import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * DELETE /api/room-comments/:id
 * 删除自己的评论
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const comment = await db.roomComment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json({ success: false, error: "评论不存在" }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ success: false, error: "无权删除" }, { status: 403 });
    }

    await db.roomComment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RoomComments DELETE] Error:", error);
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
