import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { toggleReaction } from "@/lib/zhihu-api";

/**
 * POST /api/zhihu/reaction
 * 点赞 / 取消点赞
 * Body: { contentToken: string, contentType: "pin" | "comment", actionValue: 0 | 1 }
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json({ status: 1, msg: "未登录", data: null }, { status: 401 });
    }
    const body = await req.json();
    const { contentToken, contentType, actionValue } = body;

    if (!contentToken || !contentType || actionValue === undefined) {
      return NextResponse.json(
        { status: 1, msg: "contentToken, contentType, actionValue 不能为空", data: null },
        { status: 400 }
      );
    }

    const data = await toggleReaction({ contentToken, contentType, actionValue });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}
