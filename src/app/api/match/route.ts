/**
 * @file 陌生人匹配API - 排队和匹配逻辑
 * @description 用户进入排队队列，系统自动匹配两个等待中的用户创建房间
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 匹配队列（内存存储，生产环境应使用Redis）
 * 结构：Map<场景ID, 等待中的用户[]>
 */
const matchQueue = new Map<string, Array<{
  userId: string;
  username: string;
  sceneId: string;
  sceneName: string;
  roleA: string;
  roleB: string;
  timestamp: number;
}>>();

/**
 * POST /api/match/queue
 * 加入匹配队列
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, sceneId, sceneName, roleA, roleB } = body;

    if (!userId || !sceneId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 检查用户是否已在队列中
    for (const [, users] of matchQueue.entries()) {
      const existing = users.find(u => u.userId === userId);
      if (existing) {
        return NextResponse.json({ 
          message: '已在队列中',
          queuePosition: users.findIndex(u => u.userId === userId) + 1
        });
      }
    }

    // 加入队列
    const queueEntry = {
      userId,
      username: username || '匿名用户',
      sceneId,
      sceneName: sceneName || '未知场景',
      roleA: roleA || '角色A',
      roleB: roleB || '角色B',
      timestamp: Date.now()
    };

    if (!matchQueue.has(sceneId)) {
      matchQueue.set(sceneId, []);
    }
    matchQueue.get(sceneId)!.push(queueEntry);

    // 检查是否可以匹配
    const queue = matchQueue.get(sceneId)!;
    if (queue.length >= 2) {
      // 取出前两个用户进行匹配
      const user1 = queue.shift()!;
      const user2 = queue.shift()!;

      // 创建房间
      const room = await prisma.room.create({
        data: {
          id: Math.random().toString(36).substring(2, 8).toUpperCase(),
          scene: sceneName,
          roleAName: roleA,
          roleBName: roleB,
          status: 'active',
          hostId: user1.userId,
          guestId: user2.userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });

      return NextResponse.json({
        matched: true,
        room: {
          id: room.id,
          scene: room.scene,
          roleAName: room.roleAName,
          roleBName: room.roleBName,
        }
      });
    }

    // 未匹配到，返回排队位置
    return NextResponse.json({
      matched: false,
      queuePosition: queue.length,
      message: '已加入队列，等待匹配...'
    });

  } catch (error) {
    console.error('匹配失败:', error);
    return NextResponse.json({ error: '匹配失败' }, { status: 500 });
  }
}

/**
 * GET /api/match/queue?userId=xxx&sceneId=xxx
 * 检查匹配状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sceneId = searchParams.get('sceneId');

    if (!userId || !sceneId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 检查用户是否在队列中
    const queue = matchQueue.get(sceneId) || [];
    const userPosition = queue.findIndex(u => u.userId === userId);

    if (userPosition === -1) {
      return NextResponse.json({ 
        inQueue: false,
        message: '不在队列中'
      });
    }

    return NextResponse.json({
      inQueue: true,
      queuePosition: userPosition + 1,
      queueLength: queue.length,
      message: `排队中，前方还有${userPosition}人`
    });

  } catch (error) {
    console.error('查询匹配状态失败:', error);
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}

/**
 * DELETE /api/match/queue
 * 退出匹配队列
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sceneId } = body;

    if (!userId || !sceneId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 从队列中移除
    const queue = matchQueue.get(sceneId) || [];
    const filtered = queue.filter(u => u.userId !== userId);
    matchQueue.set(sceneId, filtered);

    return NextResponse.json({
      message: '已退出队列'
    });

  } catch (error) {
    console.error('退出队列失败:', error);
    return NextResponse.json({ error: '退出失败' }, { status: 500 });
  }
}
