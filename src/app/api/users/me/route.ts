import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    // v7.0-fix: App Router 中 getServerSession 不可靠，改用 getToken 读取 JWT
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const guestId = req.headers.get("x-guest-id");
    const userId = token?.id as string | undefined || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // v8.0-login-fix: 检查 token 是否已被服务器端撤销
    if (token?.id) {
      const dbUser = await db.user.findUnique({
        where: { id: token.id as string },
        select: { tokenRevokedAt: true },
      });
      if (dbUser?.tokenRevokedAt) {
        const tokenIatMs = token.iat ? (token.iat as number) * 1000 : 0;
        if (tokenIatMs < dbUser.tokenRevokedAt.getTime()) {
          console.log('[User Me] Token 已被撤销, userId:', token.id);
          return NextResponse.json(apiError("UNAUTHORIZED", "登录已过期，请重新登录"), { status: 401 });
        }
      }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        level: true,
        sparkCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(apiError("NOT_FOUND", "用户不存在"), { status: 404 });
    }

    return NextResponse.json(apiResponse(user));
  } catch (error: any) {
    console.error("[User Me API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
