import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { matchRequestSchema } from "@/lib/validators/match";
import { findMatch } from "@/server/match-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validatedData = matchRequestSchema.parse(body);

    const matchResult = await findMatch(session.user.id, {
      brainholeId: validatedData.brainholeId,
      identity: validatedData.identity,
      excludeUserId: session.user.id,
      minLevel: 1,
      maxLevel: 10,
      preferDifferentIdentity: validatedData.preferDifferent,
      timeoutMinutes: validatedData.timeoutMinutes,
    });

    if (matchResult.matched) {
      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        roomId: matchResult.roomId,
        matchedUserId: matchResult.matchedUserId,
        matchedUserIdentity: matchResult.matchedUserIdentity,
        status: "matched",
      }), { status: 201 });
    } else {
      if (matchResult.message === "MATCH_ALREADY_EXISTS") {
        return NextResponse.json(apiError("MATCH_ALREADY_EXISTS", "已有活跃匹配请求"), { status: 400 });
      }
      
      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        status: "waiting",
        message: matchResult.message,
      }), { status: 202 });
    }
  } catch (error) {
    console.error("请求匹配失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "请求匹配失败"), { status: 500 });
  }
}