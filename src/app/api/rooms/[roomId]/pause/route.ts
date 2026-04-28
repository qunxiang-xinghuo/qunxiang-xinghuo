import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { updateRoomStatus } from "@/server/room-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { roomId } = await params;

    // 更新房间状态为暂停
    const updatedRoom = await updateRoomStatus(roomId, "paused", session.user.id);

    return NextResponse.json(apiResponse(updatedRoom));
  } catch (error: any) {
    console.error("暂停房间失败:", error);
    
    if (error.message === "ROOM_NOT_FOUND") {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    } else if (error.message === "NOT_DIRECTOR") {
      return NextResponse.json(apiError("NOT_DIRECTOR", "不是房间导演"), { status: 403 });
    }
    
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "暂停房间失败"), { status: 500 });
  }
}