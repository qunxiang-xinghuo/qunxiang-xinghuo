import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { updateRoomStatus } from "@/server/room-manager";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
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

    // 更新房间状态为暂停
    const updatedRoom = await updateRoomStatus(roomId, "paused", userId);

    return NextResponse.json(apiResponse(updatedRoom));
  } catch (error: unknown) {
    console.error("暂停房间失败:", error);
    
    if (getErrorMessage(error) === "ROOM_NOT_FOUND") {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    } else if (getErrorMessage(error) === "NOT_DIRECTOR") {
      return NextResponse.json(apiError("NOT_DIRECTOR", "不是房间导演"), { status: 403 });
    }
    
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "暂停房间失败"), { status: 500 });
  }
}