import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { z } from 'zod';
import { contentSafetyCheck } from '@/lib/content-filter';

// 生成 6 位房间号
function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 创建房间 Schema
const createRoomSchema = z.object({
  scene: z.string().min(1).max(200),
  roleAName: z.string().min(1).max(20),
  roleBName: z.string().min(1).max(20),
});

// POST /api/rooms - 创建房间
async function handleCreateRoom(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createRoomSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { scene, roleAName, roleBName } = validation.data;

    // 敏感词检查
    const sceneCheck = contentSafetyCheck(scene, 200);
    if (!sceneCheck.passed) {
      return NextResponse.json(
        { success: false, error: `场景描述包含敏感内容：${sceneCheck.errors?.join(', ')}` },
        { status: 400 }
      );
    }

    const roleACheck = contentSafetyCheck(roleAName, 20);
    if (!roleACheck.passed) {
      return NextResponse.json(
        { success: false, error: `角色 A 名字包含敏感内容：${roleACheck.errors?.join(', ')}` },
        { status: 400 }
      );
    }

    const roleBCheck = contentSafetyCheck(roleBName, 20);
    if (!roleBCheck.passed) {
      return NextResponse.json(
        { success: false, error: `角色 B 名字包含敏感内容：${roleBCheck.errors?.join(', ')}` },
        { status: 400 }
      );
    }

    // 生成唯一房间号
    let roomId = generateRoomId();
    let existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    
    while (existingRoom) {
      roomId = generateRoomId();
      existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    }

    // 创建房间
    const room = await prisma.room.create({
      data: {
        id: roomId,
        scene,
        roleAName,
        roleBName,
        hostId: request.headers.get('x-anonymous-id') || 'anonymous',
        status: 'waiting',
        currentRound: 0,
        currentRole: 'A',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 小时后过期
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        roomId: room.id,
        scene: room.scene,
        roleAName: room.roleAName,
        roleBName: room.roleBName,
        shareUrl: `${process.env.NEXTAUTH_URL || 'https://qunxiangxinghuo.cn'}/room/${room.id}`,
      },
    });
  } catch (error) {
    console.error('创建房间失败:', error);
    return NextResponse.json(
      { success: false, error: '创建房间失败' },
      { status: 500 }
    );
  }
}

// GET /api/rooms - 获取房间列表（仅用于调试）
async function handleGetRooms(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: { not: 'expired' },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取房间列表失败' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGetRooms, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
export const POST = withRateLimit(handleCreateRoom, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
