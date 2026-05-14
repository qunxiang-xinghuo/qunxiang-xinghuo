import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { matchRequestSchema } from "@/lib/validators/match";
import { findMatch } from "@/server/match-engine";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(request: NextRequest) {
  try {
    console.log("[MatchAPI v6.0] ========== 收到匹配请求 ==========");
    console.log("[MatchAPI] 请求方法:", request.method);
    console.log("[MatchAPI] 请求URL:", request.url);

    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;
    if (!userId) {
      console.error("[MatchAPI] 缺少用户身份：未登录且无 x-guest-id header");
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录或提供用户ID"), { status: 401 });
    }
    console.log("[MatchAPI] userId:", userId, "token存在:", !!token, "guestId:", guestId);

    let body;
    try {
      body = await request.json();
      console.log("[MatchAPI] 请求体:", JSON.stringify(body));
    } catch (parseErr: unknown) {
      console.error("[MatchAPI] 请求体解析失败:", getErrorMessage(parseErr));
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

    // v8.3-fix: guest 用户必须先 upsert 到 User 表，否则 roomParticipant 外键约束会报 500
    if (!token && guestId) {
      await db.user.upsert({
        where: { id: guestId },
        update: {},
        create: { id: guestId, name: '访客', email: `${guestId}@guest.local` },
      });
    }

    console.log("[MatchAPI] 正在调用 findMatch v6.0...");
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
      console.log("[MatchAPI] 匹配成功! matchId:", matchResult.matchId, "roomId:", matchResult.roomId, "strategy:", matchResult.strategy, "brainhole:", matchResult.brainholeTitle);
      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        roomId: matchResult.roomId,
        matchedUserId: matchResult.matchedUserId,
        matchedUserIdentity: matchResult.matchedUserIdentity,
        matchedCount: matchResult.matchedCount,
        roomType: matchResult.roomType,
        status: "matched",
        strategy: matchResult.strategy,
        brainholeId: matchResult.brainholeId,
        brainholeTitle: matchResult.brainholeTitle,
        message: matchResult.message,
      }), { status: 201 });
    } else {
      console.log("[MatchAPI] 匹配未完成，进入等待状态. matchId:", matchResult.matchId, "strategy:", matchResult.strategy, "brainhole:", matchResult.brainholeTitle);
      if (matchResult.message === "MATCH_ALREADY_EXISTS") {
        return NextResponse.json(apiResponse({
          matchId: matchResult.matchId,
          roomType: matchResult.roomType,
          status: "waiting",
          message: matchResult.message,
          strategy: matchResult.strategy,
          brainholeId: matchResult.brainholeId,
          brainholeTitle: matchResult.brainholeTitle,
        }), { status: 202 });
      }

      return NextResponse.json(apiResponse({
        matchId: matchResult.matchId,
        roomType: matchResult.roomType,
        status: "waiting",
        message: matchResult.message,
        strategy: matchResult.strategy,
        brainholeId: matchResult.brainholeId,
        brainholeTitle: matchResult.brainholeTitle,
      }), { status: 202 });
    }
  } catch (error: unknown) {
    console.error("[MatchAPI] ========== 请求匹配失败 ==========");
    console.error("[MatchAPI] 错误消息:", getErrorMessage(error));
    console.error("[MatchAPI] 错误堆栈:", (error as Error).stack);

    // v4.6: Zod验证错误的友好提示
    const err = error as { name?: string; issues?: Array<{ path: string[] }> };
    if (err.name === 'ZodError' && err.issues) {
      const issues = err.issues.map((i) => `${i.path.join('.')}: ${getErrorMessage(i)}`).join('; ');
      console.error("[MatchAPI] 数据验证错误:", issues);
      return NextResponse.json(apiError("VALIDATION_ERROR", `参数验证失败: ${issues}`), { status: 400 });
    }

    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "请求匹配失败: " + (getErrorMessage(error) || "未知错误")), { status: 500 });
  }
}
