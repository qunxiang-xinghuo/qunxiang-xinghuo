import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";

/**
 * GET /api/admin/rooms
 * v8.3: 管理员房间监控
 * - 活跃AI房间：status=active, isAiRoom=true, 有在线真人参与者
 * - 异常活跃房间：status=active 但该关的房间（AI未关闭 + 真人僵尸）
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 活跃AI房间：正在和刘看山聊天的房间（有在线真人）
    const activeAiRooms = await db.room.findMany({
      where: {
        status: "active",
        isAiRoom: true,
        participants: {
          some: {
            isOnline: true,
            userId: { not: { startsWith: "agent_" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        brainhole: { select: { title: true } },
        story: { select: { title: true } },
        participants: { select: { userId: true, identity: true, isOnline: true } },
        _count: { select: { messages: true } },
      },
    });

    // 异常活跃房间：所有该关但没关的（AI未关闭 + 真人僵尸）
    const abnormalRooms = await db.room.findMany({
      where: {
        status: "active",
        OR: [
          // AI房间：没有在线真人参与者，且创建超过2小时
          {
            isAiRoom: true,
            participants: {
              none: {
                isOnline: true,
                userId: { not: { startsWith: "agent_" } },
              },
            },
            createdAt: { lt: twoHoursAgo },
          },
          // 真人房间：创建超过2小时
          {
            isAiRoom: false,
            createdAt: { lt: twoHoursAgo },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        brainhole: { select: { title: true } },
        story: { select: { title: true } },
        participants: { select: { userId: true, identity: true, isOnline: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        _count: { select: { messages: true } },
      },
    });

    const mapRoom = (room: any) => ({
      id: room.id,
      type: room.type,
      status: room.status,
      isAiRoom: room.isAiRoom,
      title: room.brainhole?.title || room.story?.title || "未命名",
      createdAt: room.createdAt.toISOString(),
      lastMessageAt: room.messages?.[0]?.createdAt?.toISOString() || null,
      participantCount: room.participants.length,
      onlineCount: room.participants.filter((p: any) => p.isOnline).length,
      messageCount: room._count.messages,
      participants: room.participants.map((p: any) => p.identity).filter(Boolean),
    });

    return NextResponse.json(apiResponse({
      activeAiRooms: activeAiRooms.map(mapRoom),
      abnormalRooms: abnormalRooms.map(mapRoom),
    }));
  } catch (error) {
    console.error("[Admin Rooms] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取失败"), { status: 500 });
  }
}
