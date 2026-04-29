import { NextRequest, NextResponse } from "next/server";
import { getCommentList, createComment, deleteComment } from "@/lib/zhihu-api";

/**
 * GET /api/zhihu/comment?contentToken=xxx&contentType=pin&pageNum=1&pageSize=10
 * 获取评论列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contentToken = searchParams.get("contentToken");
    const contentType = searchParams.get("contentType") as "pin" | "comment";
    const pageNum = parseInt(searchParams.get("pageNum") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    if (!contentToken || !contentType) {
      return NextResponse.json(
        { status: 1, msg: "contentToken 和 contentType 不能为空", data: null },
        { status: 400 }
      );
    }

    const data = await getCommentList({ contentToken, contentType, pageNum, pageSize });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取评论失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}

/**
 * POST /api/zhihu/comment
 * 创建评论
 * Body: { contentToken: string, contentType: "pin" | "comment", content: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentToken, contentType, content } = body;

    if (!contentToken || !contentType || !content) {
      return NextResponse.json(
        { status: 1, msg: "contentToken, contentType, content 不能为空", data: null },
        { status: 400 }
      );
    }

    const data = await createComment({ contentToken, contentType, content });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建评论失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}

/**
 * DELETE /api/zhihu/comment
 * 删除评论
 * Body: { commentId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { status: 1, msg: "commentId 不能为空", data: null },
        { status: 400 }
      );
    }

    const data = await deleteComment(commentId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除评论失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}
