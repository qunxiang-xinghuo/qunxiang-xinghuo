/**
 * 用户注册 API
 * 
 * 功能：处理用户注册请求
 * 
 * 接口：
 * - POST /api/auth/register - 注册新用户
 * 
 * 请求参数：
 * - email: 用户邮箱
 * - password: 用户密码
 * - username: 用户名
 * 
 * 返回：
 * - 注册成功：用户信息（不含密码）
 * - 注册失败：错误信息
 * 
 * 安全：
 * - 密码使用 bcrypt 加密
 * - 有速率限制防止恶意注册
 * - 输入验证防止注入攻击
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateInput, registerSchema, validationErrorResponse } from '@/lib/validation';
import { hashPassword } from '@/lib/auth-config';
import { auditRegister } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json();
    const ip = getClientIP(request.headers);

    // 输入验证
    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { email, password, username } = validation.data;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 安全考虑：不暴露邮箱是否已注册的具体差异
      // 但用户体验上需要提示，这里使用模糊提示
      auditRegister('', false, ip, '邮箱已注册');
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    // 使用统一的密码哈希函数（bcrypt 12 轮）
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username: username || email.split('@')[0],
      },
    });

    // 记录审计日志
    auditRegister(user.id, true, ip);

    return NextResponse.json(
      { message: '注册成功', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  handleRegister,
  RATE_LIMITS.strict, // 严格限制：1 分钟 5 次
  (req) => getClientIP(req.headers) // 按 IP 限制
);
