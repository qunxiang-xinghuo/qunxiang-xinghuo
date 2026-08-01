/**
 * 会话管理 API
 * 
 * 功能：
 * - GET: 获取当前用户的会话列表
 * - POST: 创建新的角色扮演会话
 * 
 * 认证：需要用户登录
 * 速率限制：60 请求/分钟
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateInput, createSessionSchema, validationErrorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function handleCreateSession(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // 输入验证
    const validation = validateInput(createSessionSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { sceneId } = validation.data;

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        sceneId,
        userId: user.id,
        status: 'active',
      },
      include: {
        scene: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

async function handleGetSessions() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Return empty array for unauthenticated users
      return NextResponse.json([]);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        scene: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

export const POST = withRateLimit(
  handleCreateSession,
  RATE_LIMITS.standard, // 标准限制：1 分钟 60 次
  (req) => {
    // 优先使用用户 ID，否则使用 IP
    const ip = getClientIP(req.headers);
    return `session_create:${ip}`;
  }
);

export const GET = withRateLimit(
  handleGetSessions,
  RATE_LIMITS.standard
);
