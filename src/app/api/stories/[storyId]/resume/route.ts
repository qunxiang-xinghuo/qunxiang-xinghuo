import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// POST /api/stories/[storyId]/resume - 导演继续
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
      return NextResponse.json(apiError("FORBIDDEN", "只有导演可以继续"), { status: 403 });
    }

    broadcastToRoom(`story-${storyId}`, "director-resume", { storyId, resumedBy: userId, timestamp: Date.now() });

    return NextResponse.json(apiResponse({ resumed: true }));
  } catch (error: any) {
    console.error("[StoryResume POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "继续失败"), { status: 500 });
  }
}
