/**
 * ============================================
 * 消息 API - 发送/获取房间消息
 * ============================================
 * 
 * 功能说明：
 * - GET /api/rooms/[id]/messages - 获取房间消息列表
 * - POST /api/rooms/[id]/messages - 发送消息
 * 
 * GET 返回数据：
 * - messages: RoomMessage[] - 按时间升序排列的消息列表
 * 
 * POST 请求参数：
 * - role: 'A' | 'B' - 发言角色
 * - content: string - 消息内容 (1-100 字)
 * - isAI?: boolean - 是否 AI 生成 (默认 false)
 * - aiStyle?: '温情' | '冲突' | '留白' - AI 风格
 * 
 * 业务规则：
 * - 房间状态必须为 'active'
 * - 必须轮到当前角色发言
 * - 轮次不能超过 10 轮
 * - 敏感词过滤
 * 
 * 返回数据（POST）：
 * - message: RoomMessage - 创建的消息
 * - room: Room - 更新后的房间状态
 * 
 * @example
 * GET /api/rooms/Y0SFWF/messages
 * POST /api/rooms/Y0SFWF/messages { "role": "A", "content": "好久不见" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { z } from 'zod';
import { contentSafetyCheck } from '@/lib/content-filter';

/** 发送消息请求参数验证 */
const sendMessageSchema = z.object({
  role: z.enum(['A', 'B'], { message: '请选择角色' }),
  content: z.string().min(1).max(100, '消息内容最多 100 字'),
  isAI: z.boolean().optional().default(false),
  aiStyle: z.enum(['温情', '冲突', '留白']).optional(),
});

// GET /api/rooms/[id]/messages - 获取消息列表
async function handleGetMessages(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const messages = await prisma.roomMessage.findMany({
      where: { roomId: id },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取消息列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/rooms/[id]/messages - 发送消息
async function handleSendMessage(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { role, content, isAI, aiStyle } = validation.data;

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
    if (room.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '房间未激活或已结束' },
        { status: 409 }
      );
    }

    // 检查轮次
    if (room.currentRound > 10) {
      return NextResponse.json(
        { success: false, error: '对话已结束' },
        { status: 409 }
      );
    }

    // 检查角色是否匹配
    if (role !== room.currentRole) {
      return NextResponse.json(
        { success: false, error: `当前轮到${room.currentRole === 'A' ? room.roleAName : room.roleBName}发言` },
        { status: 409 }
      );
    }

    // 敏感词检查
    const safetyCheck = contentSafetyCheck(content, 100);
    if (!safetyCheck.passed) {
      return NextResponse.json(
        { success: false, error: safetyCheck.errors?.join(', ') || '内容包含敏感词' },
        { status: 400 }
      );
    }

    // 创建消息
    const message = await prisma.roomMessage.create({
      data: {
        roomId: id,
        role,
        content,
        round: room.currentRound,
        isAI: isAI || false,
        aiStyle,
      },
    });

    // 更新房间状态
    const newRound = room.currentRound + (room.currentRole === 'B' ? 1 : 0);
    const newRole = room.currentRole === 'A' ? 'B' : 'A';
    
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        currentRound: newRound,
        currentRole: newRole,
        status: newRound > 10 ? 'completed' : 'active',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message,
        room: updatedRoom,
      },
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { success: false, error: '发送消息失败' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGetMessages, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
export const POST = withRateLimit(handleSendMessage, RATE_LIMITS.standard, (req) => getClientIP(req.headers));
