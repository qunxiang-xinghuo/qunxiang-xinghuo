import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { publishPin } from "@/lib/zhihu-api";

/**
 * POST /api/zhihu/publish
 * 在知乎圈子发布想法
 * Body: { title: string, content: string, imageUrls?: string[], ringId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json({ status: 1, msg: "未登录", data: null }, { status: 401 });
    }
    const body = await req.json();
    const { title, content, imageUrls, ringId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { status: 1, msg: "title 和 content 不能为空", data: null },
        { status: 400 }
      );
    }

    const data = await publishPin({ title, content, imageUrls, ringId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "发布想法失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}
