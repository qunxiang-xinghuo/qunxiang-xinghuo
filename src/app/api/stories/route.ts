/**
 * 故事管理 API
 * 
 * 功能：
 * - GET: 获取当前用户的故事列表
 * - POST: 创建新的故事（从会话中生成）
 * 
 * 认证：需要用户登录
 * 速率限制：60 请求/分钟
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { validateInput, createStorySchema, validationErrorResponse } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function handleCreateStory(request: NextRequest) {
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
    const validation = validateInput(createStorySchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { title, content, conversationId } = validation.data;

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create story
    const story = await prisma.story.create({
      data: {
        title,
        content,
        summary: content.slice(0, 200),
        userId: user.id,
        conversationId,
        status: 'draft',
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}

async function handleGetStories() {
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

    const stories = await prisma.story.findMany({
      where: { userId: user.id },
      include: {
        conversation: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json({ error: 'Failed to get stories' }, { status: 500 });
  }
}

export const POST = withRateLimit(
  handleCreateStory,
  RATE_LIMITS.standard,
  (req) => {
    const ip = getClientIP(req.headers);
    return `story_create:${ip}`;
  }
);

export const GET = withRateLimit(
  handleGetStories,
  RATE_LIMITS.standard
);
