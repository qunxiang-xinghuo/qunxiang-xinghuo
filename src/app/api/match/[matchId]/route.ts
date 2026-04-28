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
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { matchId } = await params;
    const match = await checkMatchStatus(matchId, session.user.id);

    return NextResponse.json(apiResponse(match));
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
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { matchId } = await params;
    const success = await cancelMatch(matchId, session.user.id);

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