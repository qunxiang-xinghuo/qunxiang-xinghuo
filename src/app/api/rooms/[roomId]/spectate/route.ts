import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { db } from "@/lib/db";

/**
 * POST /api/rooms/:roomId/spectate
 * 以观众身份加入房间
 * Body: { identity?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const identity = body.identity || "观众";

    const { roomId } = await params;

    // 检查房间是否存在
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    if (room.status === "closed") {
      return NextResponse.json(apiError("ROOM_CLOSED", "房间已关闭"), { status: 400 });
    }

    // 检查是否已是参与者（actor 不能变成 spectator）
    const existingActor = await db.roomParticipant.findFirst({
      where: { roomId, userId, role: "actor" },
    });

    if (existingActor) {
      return NextResponse.json(apiError("ALREADY_ACTOR", "你已是房间演员，不能变为观众"), { status: 400 });
    }

    // 创建/更新 spectator 参与者
    const participant = await db.roomParticipant.upsert({
      where: {
        roomId_userId: { roomId, userId },
      },
      update: {
        role: "spectator",
        identity,
        isOnline: true,
        leftAt: null,
      },
      create: {
        roomId,
        userId,
        identity,
        role: "spectator",
        isOnline: true,
      },
    });

    return NextResponse.json(apiResponse({
      participant,
      message: "已进入观众模式",
    }));
  } catch (error) {
    console.error("[Spectate] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "加入观众模式失败"), { status: 500 });
  }
}
