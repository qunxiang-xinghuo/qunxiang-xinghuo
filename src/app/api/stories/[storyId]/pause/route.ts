import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// POST /api/stories/[storyId]/pause - 导演暂停
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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
