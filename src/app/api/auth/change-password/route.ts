/**
 * @file 修改密码 API
 * @description 处理用户修改密码请求
 *
 * 接口：
 * - POST /api/auth/change-password - 修改当前用户密码
 *
 * 请求参数：
 * - currentPassword: 当前密码
 * - newPassword: 新密码
 *
 * 安全措施：
 * - 必须登录
 * - 严格速率限制（防暴力破解当前密码）
 * - 新密码强度验证（字母+数字，至少 8 位）
 * - bcrypt 12 轮哈希
 * - 禁止新密码与当前密码相同
 * - 审计日志记录
 */

import { authOptions, hashPassword } from '@/lib/auth-config';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { writeAuditLog, AuditLevel } from '@/lib/audit-log';
import { passwordSchema } from '@/lib/validation';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: passwordSchema, // 使用统一的强密码验证
});

async function handleChangePassword(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const ip = getClientIP(request.headers);

    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      writeAuditLog({
        timestamp: new Date().toISOString(),
        level: AuditLevel.WARNING,
        action: 'PASSWORD_CHANGE_FAILED',
        userId: user.id,
        ip,
        success: false,
        error: '当前密码错误',
      });
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }

    // 禁止新密码与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: '新密码不能与当前密码相同' },
        { status: 400 }
      );
    }

    // 使用统一哈希函数更新密码
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // 记录审计日志
    writeAuditLog({
      timestamp: new Date().toISOString(),
      level: AuditLevel.INFO,
      action: 'PASSWORD_CHANGED',
      userId: user.id,
      ip,
      success: true,
    });

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 严格限流：1 分钟 5 次（防暴力破解）
export const POST = withRateLimit(
  handleChangePassword,
  RATE_LIMITS.strict,
  (req) => getClientIP(req.headers)
);
