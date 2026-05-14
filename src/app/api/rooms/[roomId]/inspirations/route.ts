import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { db } from "@/lib/db";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
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
        userId,
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
  } catch (error: unknown) {
    console.error("获取灵感项失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取灵感项失败"), { status: 500 });
  }
}