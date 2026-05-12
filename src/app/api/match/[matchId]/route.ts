import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkMatchStatus, cancelMatch } from "@/server/match-engine";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");

    const { matchId } = await params;
    const effectiveUserId = userId || guestId;
    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }
    const match = await checkMatchStatus(matchId, effectiveUserId);

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
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");

    const { matchId } = await params;
    const effectiveUserId = userId || guestId;
    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }
    const success = await cancelMatch(matchId, effectiveUserId);

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
