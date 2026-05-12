import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/room-comments?roomId=xxx
 * 获取房间评论列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json(apiResponse({ list: [] }));
    }

    const comments = await db.roomComment.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" as const },
      take: 100,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    const list = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: {
        id: c.user.id,
        name: c.user.name || "匿名用户",
        image: c.user.image,
      },
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[RoomComments GET] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}

/**
 * POST /api/room-comments
 * 创建评论
 * Body: { roomId: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;
    if (!userId) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, content } = body;

    if (!roomId || !content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "参数错误" }, { status: 400 });
    }
    if (content.trim().length > 500) {
      return NextResponse.json({ success: false, error: "评论最多500字" }, { status: 400 });
    }

    const comment = await db.roomComment.create({
      data: {
        roomId,
        userId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(apiResponse({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name || "匿名用户",
          image: comment.user.image,
        },
      },
    }));
  } catch (error) {
    console.error("[RoomComments POST] Error:", error);
    return NextResponse.json({ success: false, error: "创建评论失败" }, { status: 500 });
  }
}
