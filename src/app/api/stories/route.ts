import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/stories - Create a new story from a conversation
export async function POST(request: NextRequest) {
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
    const { conversationId, title, content, summary } = body;

    if (!title || !content || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
        summary,
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

// GET /api/stories - Get all stories for the current user
export async function GET() {
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
