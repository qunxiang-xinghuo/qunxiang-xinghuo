import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/sessions - Create a new conversation session
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
    const { sceneId, roleIds } = body;

    if (!sceneId || !roleIds || !Array.isArray(roleIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create conversation
    const conversation = await prisma.conversation.create({
      data: {
        sceneId,
        userId: user.id,
        status: 'active',
        roles: {
          create: roleIds.map((roleId: string) => ({
            roleId,
            userId: user.id,
            isAI: false,
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        scene: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// GET /api/sessions - Get all conversations for the current user
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

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        scene: true,
        roles: {
          include: {
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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
