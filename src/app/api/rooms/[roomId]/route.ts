import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { getRoomWithParticipants } from "@/server/room-manager";

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
    const room = await getRoomWithParticipants(roomId);

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 检查用户是否是房间参与者
    const isParticipant = (room as any).participants.some((p: any) => p.userId === session.user.id);
    if (!isParticipant) {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }

    return NextResponse.json(apiResponse(room));
  } catch (error: any) {
    console.error("获取房间信息失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取房间信息失败"), { status: 500 });
  }
}