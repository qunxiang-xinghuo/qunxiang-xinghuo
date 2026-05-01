import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { matchRequestSchema } from "@/lib/validators/match";
import { findMatch } from "@/server/match-engine";

export async function POST(request: NextRequest) {
  try {
    console.log("[MatchAPI] 正在尝试匹配...");

    const session = await getServerSession(authOptions);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || `guest-${Date.now()}`;
    console.log("[MatchAPI] userId:", userId, "session:", !!session);

    const body = await request.json();
    console.log("[MatchAPI] 请求体:", JSON.stringify(body));

    const validatedData = matchRequestSchema.parse(body);
    console.log("[MatchAPI] 数据验证通过");

    console.log("[MatchAPI] 正在调用 findMatch...");
    const matchResult = await findMatch(userId, {
      brainholeId: validatedData.brainholeId,
      identity: validatedData.identity,
      excludeUserId: userId,
      minLevel: 1,
      maxLevel: 10,
      preferDifferentIdentity: validatedData.preferDifferent,
      timeoutMinutes: validatedData.timeoutMinutes,
      mode: validatedData.mode,
    });

    if (matchResult.matched) {
      console.log("[MatchAPI] 匹配成功! matchId:", matchResult.matchId, "roomId:", matchResult.roomId);
      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        roomId: matchResult.roomId,
        matchedUserId: matchResult.matchedUserId,
        matchedUserIdentity: matchResult.matchedUserIdentity,
        matchedCount: matchResult.matchedCount,
        roomType: matchResult.roomType,
        status: "matched",
      }), { status: 201 });
    } else {
      console.log("[MatchAPI] 匹配未完成，进入等待状态. matchId:", matchResult.matchId, "message:", matchResult.message);
      if (matchResult.message === "MATCH_ALREADY_EXISTS") {
        return NextResponse.json(apiError("MATCH_ALREADY_EXISTS", "已有活跃匹配请求"), { status: 400 });
      }

      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        roomType: matchResult.roomType,
        status: "waiting",
        message: matchResult.message,
      }), { status: 202 });
    }
  } catch (error: any) {
    console.error("[MatchAPI] 请求匹配失败:", error);
    console.error("[MatchAPI] 错误详情:", error.message, error.stack);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "请求匹配失败: " + (error.message || "未知错误")), { status: 500 });
  }
}
