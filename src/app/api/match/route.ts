import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { matchRequestSchema } from "@/lib/validators/match";
import { findMatch } from "@/server/match-engine";

export async function POST(request: NextRequest) {
  try {
    console.log("[MatchAPI] ========== 收到匹配请求 ==========");
    console.log("[MatchAPI] 请求方法:", request.method);
    console.log("[MatchAPI] 请求URL:", request.url);

    const session = await getServerSession(authOptions);
    // v4.4-fix: 支持guest用户
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || `guest-${Date.now()}`;
    console.log("[MatchAPI] userId:", userId, "session存在:", !!session, "guestId:", guestId);

    let body;
    try {
      body = await request.json();
      console.log("[MatchAPI] 请求体:", JSON.stringify(body));
    } catch (parseErr: any) {
      console.error("[MatchAPI] 请求体解析失败:", parseErr.message);
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误，请检查JSON格式"), { status: 400 });
    }

    // v4.6: 如果body为空或缺少identity，给出明确提示
    if (!body || typeof body !== 'object') {
      console.error("[MatchAPI] 请求体为空或不是对象");
      return NextResponse.json(apiError("BAD_REQUEST", "请求体不能为空"), { status: 400 });
    }
    if (!body.identity) {
      console.error("[MatchAPI] 缺少identity参数");
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数(identity)"), { status: 400 });
    }

    console.log("[MatchAPI] 正在验证请求数据... identity:", body.identity, "brainholeId:", body.brainholeId || '(未指定)');

    const validatedData = matchRequestSchema.parse(body);
    console.log("[MatchAPI] 数据验证通过 - identity:", validatedData.identity, "brainholeId:", validatedData.brainholeId, "mode:", validatedData.mode);

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
      console.log("[MatchAPI] 匹配成功! matchId:", matchResult.matchId, "roomId:", matchResult.roomId, "roomType:", matchResult.roomType);
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
    console.error("[MatchAPI] ========== 请求匹配失败 ==========");
    console.error("[MatchAPI] 错误消息:", error.message);
    console.error("[MatchAPI] 错误堆栈:", error.stack);

    // v4.6: Zod验证错误的友好提示
    if (error.name === 'ZodError' && error.issues) {
      const issues = error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ');
      console.error("[MatchAPI] 数据验证错误:", issues);
      return NextResponse.json(apiError("VALIDATION_ERROR", `参数验证失败: ${issues}`), { status: 400 });
    }

    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "请求匹配失败: " + (error.message || "未知错误")), { status: 500 });
  }
}
