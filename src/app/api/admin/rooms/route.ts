import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";

/**
 * GET /api/admin/rooms
 * 获取僵尸房间列表（管理员）
 * - 活跃超过2小时的AI房间
 * - 创建超过24小时仍未活跃的孤儿房间
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [zombieAiRooms, orphanRooms] = await Promise.all([
      db.room.findMany({
        where: {
          status: "active",
          isAiRoom: true,
          createdAt: { lt: twoHoursAgo },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          brainhole: { select: { title: true } },
          story: { select: { title: true } },
          participants: { select: { userId: true, identity: true } },
          _count: { select: { messages: true } },
        },
      }),
      db.room.findMany({
        where: {
          status: "created",
          createdAt: { lt: oneDayAgo },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          brainhole: { select: { title: true } },
          story: { select: { title: true } },
          participants: { select: { userId: true, identity: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    const mapRoom = (room: any) => ({
      id: room.id,
      type: room.type,
      status: room.status,
      isAiRoom: room.isAiRoom,
      title: room.brainhole?.title || room.story?.title || "未命名",
      createdAt: room.createdAt.toISOString(),
      participantCount: room.participants.length,
      messageCount: room._count.messages,
      participants: room.participants.map((p: any) => p.identity).filter(Boolean),
    });

    return NextResponse.json(apiResponse({
      zombieAiRooms: zombieAiRooms.map(mapRoom),
      orphanRooms: orphanRooms.map(mapRoom),
    }));
  } catch (error) {
    console.error("[Admin Rooms] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取失败"), { status: 500 });
  }
}
