import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { getRoomWithParticipants } from "@/server/room-manager";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    const { roomId } = await params;
    const room = await getRoomWithParticipants(roomId);

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // v6.2-fix6: 允许参与者（actor/ai_agent）和观众（spectator）访问
    const isParticipant = userId && (room as any).participants.some(
      (p: any) => p.userId === userId && (p.role === 'actor' || p.role === 'ai_agent')
    );
    const isSpectator = userId && (room as any).participants.some(
      (p: any) => p.userId === userId && p.role === 'spectator'
    );

    if (!isParticipant && !isSpectator) {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }

    return NextResponse.json(apiResponse(room));
  } catch (error: any) {
    console.error("获取房间信息失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取房间信息失败"), { status: 500 });
  }
}
