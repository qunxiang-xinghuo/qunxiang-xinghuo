import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/rooms/public
 * 获取所有公开（未关闭）的房间列表，用于观看模式
 */
export async function GET(request: NextRequest) {
  try {
    const rooms = await db.room.findMany({
      where: {
        status: { not: "closed" },
        isAiRoom: false, // v8.1: 观看模式不显示AI房间
      },
      include: {
        brainhole: {
          select: {
            id: true,
            title: true,
            scenario: true,
            category: true,
          },
        },
        participants: {
          where: {
            role: { in: ["actor", "ai_agent"] },
          },
          select: {
            userId: true,
            identity: true,
            role: true,
            isOnline: true,
          },
        },
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const roomIds = rooms.map((r) => r.id);
    const spectatorCounts = await db.roomParticipant.groupBy({
      by: ["roomId"],
      where: {
        roomId: { in: roomIds },
        role: "spectator",
        isOnline: true,
      },
      _count: { roomId: true },
    });

    const spectatorCountMap = new Map(
      spectatorCounts.map((s) => [s.roomId, s._count.roomId])
    );

    const list = rooms
      .filter((room) => room._count.messages > 0) // v8.5-fix: 过滤掉空房间（无对白内容）
      .map((room) => ({
        id: room.id,
        type: room.type,
        status: room.status,
        brainhole: room.brainhole,
        actors: room.participants.map((p) => ({
          userId: p.userId,
          identity: p.identity,
          role: p.role,
          isOnline: p.isOnline,
        })),
        spectatorCount: spectatorCountMap.get(room.id) || 0,
        messageCount: room._count.messages,
        createdAt: room.createdAt,
      }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error: any) {
    console.error("[Rooms Public API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取公开房间失败"), { status: 500 });
  }
}
