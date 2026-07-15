import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateInput, registerSchema, validationErrorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function handleRegister(request: NextRequest) {
  try {
    const body = await request.json();

    // 输入验证
    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { email, password, username } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已注册' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username: username || email.split('@')[0],
      },
    });

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
