import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkMatchStatus, cancelMatch } from "@/server/match-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

    const { matchId } = await params;
    const match = await checkMatchStatus(matchId, userId || matchId);

    // v4.3: 如果匹配成功，获取房间和脑洞信息
    let roomData = null;
    if (match.status === "matched" && match.roomId) {
      const room = await db.room.findUnique({
        where: { id: match.roomId },
        include: {
          brainhole: {
            select: {
              id: true,
              title: true,
              scenario: true,
              category: true,
              difficulty: true,
            },
          },
        },
      });
      roomData = room;
    }

    return NextResponse.json(apiResponse({
      ...match,
      room: roomData,
    }));
  } catch (error: any) {
    if (error.message === "MATCH_NOT_FOUND") {
      return NextResponse.json(apiError("MATCH_NOT_FOUND", "匹配不存在"), { status: 404 });
    }
    console.error("获取匹配状态失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取匹配状态失败"), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

    const { matchId } = await params;
    const success = await cancelMatch(matchId, userId || matchId);

    return NextResponse.json(apiResponse({ success }));
  } catch (error: any) {
    if (error.message === "MATCH_NOT_FOUND") {
      return NextResponse.json(apiError("MATCH_NOT_FOUND", "匹配不存在"), { status: 404 });
    }
    if (error.message === "MATCH_ALREADY_RESOLVED") {
      return NextResponse.json(apiError("MATCH_ALREADY_RESOLVED", "匹配已结束"), { status: 400 });
    }
    console.error("取消匹配失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "取消匹配失败"), { status: 500 });
  }
}
