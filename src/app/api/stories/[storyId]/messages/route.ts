import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// GET /api/stories/[storyId]/messages - 获取消息
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const messages = await db.storyMessage.findMany({
      where: {
        storyId,
        ...(chapterId ? { chapterId } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json(apiResponse({ messages }));
  } catch (error: any) {
    console.error("[StoryMessages GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取消息失败"), { status: 500 });
  }
}

// POST /api/stories/[storyId]/messages - 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;
    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录或提供guest-id"), { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const { content, identity, chapterId, isDirectorNote = false } = body;
    if (!content || !identity) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少content或identity"), { status: 400 });
    }

    const message = await db.storyMessage.create({
      data: {
        storyId,
        chapterId: chapterId || null,
        senderId: effectiveUserId,
        content,
        identity,
        isDirectorNote,
      },
    });

    // WebSocket广播
    broadcastToRoom(`story-${storyId}`, "new-story-message", message);

    return NextResponse.json(apiResponse({ message }), { status: 201 });
  } catch (error: any) {
    console.error("[StoryMessages POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "发送消息失败"), { status: 500 });
  }
}
