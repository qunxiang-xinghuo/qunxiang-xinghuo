import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// POST /api/stories/[storyId]/pause - 导演暂停
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
        const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { directorId: true },
    });

    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }
    if (story.directorId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "只有导演可以暂停"), { status: 403 });
    }

    broadcastToRoom(`story-${storyId}`, "director-pause", { storyId, pausedBy: userId, timestamp: Date.now() });

    return NextResponse.json(apiResponse({ paused: true }));
  } catch (error: any) {
    console.error("[StoryPause POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "暂停失败"), { status: 500 });
  }
}
