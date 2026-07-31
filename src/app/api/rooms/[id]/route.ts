import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { z } from 'zod';

// 加入房间 Schema
const joinRoomSchema = z.object({
  role: z.enum(['A', 'B'], { message: '请选择角色 A 或 B' }),
  guestId: z.string().min(1),
});

// GET /api/rooms/[id] - 获取房间信息
async function handleGetRoom(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }

    // 检查是否过期
    if (room.expiresAt < new Date()) {
      await prisma.room.update({
        where: { id },
        data: { status: 'expired' },
      });
      return NextResponse.json(
        { success: false, error: '房间已过期' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('获取房间信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取房间信息失败' },
      { status: 500 }
    );
  }
}

// POST /api/rooms/[id]/join - 加入房间
async function handleJoinRoom(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = joinRoomSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { role, guestId } = validation.data;

    // 查找房间
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }

    // 检查房间状态
    if (room.status === 'expired') {
      return NextResponse.json(
        { success: false, error: '房间已过期' },
        { status: 410 }
      );
    }

    if (room.status === 'active') {
      return NextResponse.json(
        { success: false, error: '房间已满' },
        { status: 409 }
      );
    }

    // 检查角色是否已被选
    if (role === 'A' && room.hostId) {
      return NextResponse.json(
        { success: false, error: '角色 A 已被选择' },
        { status: 409 }
      );
    }

    if (role === 'B' && room.guestId) {
      return NextResponse.json(
        { success: false, error: '角色 B 已被选择' },
        { status: 409 }
      );
    }

    // 加入房间
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        guestId,
        status: 'active',
        currentRound: 1,
        currentRole: 'A', // 角色 A 先开始
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error) {
    console.error('加入房间失败:', error);
    return NextResponse.json(
      { success: false, error: '加入房间失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id] - 删除房间（24 小时自动清理）
async function handleDeleteRoom(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.room.update({
      where: { id },
      data: { status: 'expired' },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('删除房间失败:', error);
    return NextResponse.json(
      { success: false, error: '删除房间失败' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGetRoom, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
export const POST = withRateLimit(handleJoinRoom, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
export const DELETE = withRateLimit(handleDeleteRoom, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
