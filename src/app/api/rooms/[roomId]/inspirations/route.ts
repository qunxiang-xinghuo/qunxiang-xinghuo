import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { roomId } = await params;

    // 检查房间是否存在
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 检查用户是否是房间参与者
    const participant = await db.roomParticipant.findFirst({
      where: {
        roomId,
        userId: session.user.id,
        isOnline: true,
      },
    });

    if (!participant) {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }

    // 获取灵感项
    const inspirations = await db.inspirationItem.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiResponse(inspirations));
  } catch (error: any) {
    console.error("获取灵感项失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取灵感项失败"), { status: 500 });
  }
}