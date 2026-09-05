/**
 * ============================================
 * 房间 API - 创建房间
 * ============================================
 * 
 * 功能说明：
 * - POST /api/rooms - 创建新的双人创作房间
 * 
 * 请求参数：
 * - scene: string - 场景描述 (1-200 字)
 * - roleAName: string - 角色 A 名字 (1-20 字)
 * - roleBName: string - 角色 B 名字 (1-20 字)
 * 
 * 返回数据：
 * - roomId: string - 6 位房间号
 * - scene: string - 场景描述
 * - roleAName: string - 角色 A 名字
 * - roleBName: string - 角色 B 名字
 * - shareUrl: string - 分享链接
 * 
 * 安全措施：
 * - Rate Limiting: 1 分钟 5 次/IP
 * - 敏感词过滤：场景描述 + 角色名字
 * - 输入验证：Zod schema
 * 
 * @example
 * POST /api/rooms
 * {
 *   "scene": "机场候机厅",
 *   "roleAName": "林晓",
 *   "roleBName": "陈默"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit';
import { z } from 'zod';
import { contentSafetyCheck } from '@/lib/content-filter';

/**
 * 生成 6 位随机房间号
 * 格式：大写字母 + 数字组合 (如：ABC123)
 * 使用 crypto.randomInt 加密级随机数（防预测），共约 21 亿种组合
 *
 * @returns {string} 6 位房间号
 */
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符 I/O/0/1
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(randomInt(chars.length));
  }
  return result;
}

/**
 * 创建房间请求参数验证 Schema
 * 使用 Zod 进行类型安全和运行时验证
 */
const createRoomSchema = z.object({
  scene: z.string()
    .min(1, '场景描述不能为空')
    .max(200, '场景描述最多 200 字'),
  roleAName: z.string()
    .min(1, '角色 A 名字不能为空')
    .max(20, '角色名字最多 20 字'),
  roleBName: z.string()
    .min(1, '角色 B 名字不能为空')
    .max(20, '角色名字最多 20 字'),
});

/**
 * 处理创建房间请求
 * 
 * 流程：
 * 1. 验证请求参数
 * 2. 敏感词检查
 * 3. 生成唯一房间号
 * 4. 创建房间记录
 * 5. 返回房间信息和分享链接
 */
async function handleCreateRoom(request: NextRequest) {
  try {
    // 安全说明：本接口为匿名公开接口，防滥用依赖「IP 限流（1 分钟 5 次）
    // + Zod 输入校验 + 敏感词过滤」。此前的 HMAC 请求签名校验使用的是仅存在于
    // 服务端的密钥，浏览器端无法合法生成签名，会导致正常创建房间被拒绝，已移除。

    // 1. 解析并验证请求参数
    const body = await request.json();
    const validation = createRoomSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { scene, roleAName, roleBName } = validation.data;

    // 2. 敏感词检查（防止违规内容）
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

    // 3. 生成唯一房间号（检查是否已存在）
    let roomId = generateRoomId();
    let existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    
    // 如果房间号已存在，重新生成
    while (existingRoom) {
      roomId = generateRoomId();
      existingRoom = await prisma.room.findUnique({ where: { id: roomId } });
    }

    // 4. 创建房间记录
    const room = await prisma.room.create({
      data: {
        id: roomId,
        scene,
        roleAName,
        roleBName,
        hostId: request.headers.get('x-anonymous-id') || 'anonymous', // 匿名 ID
        status: 'waiting',  // 初始状态：等待加入
        currentRound: 0,    // 初始轮次：0
        currentRole: 'A',   // 从角色 A 开始
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 小时后过期
      },
    });

    // 5. 返回房间信息和分享链接
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
      { success: false, error: '创建房间失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms - 获取房间列表（可选功能）
 * 目前返回空数组，后续可扩展
 */
async function handleGetRooms() {
  return NextResponse.json({
    success: true,
    data: [],
  });
}

// 导出带 Rate Limiting 的 POST 方法
export const POST = withRateLimit(
  handleCreateRoom,
  RATE_LIMITS.strict,  // 严格限制：1 分钟 5 次/IP
  (req) => getClientIP(req.headers)
);

// 导出 GET 方法
export const GET = handleGetRooms;
