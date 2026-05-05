import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/stories/[storyId] - 获取故事详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    if (!storyId || storyId.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "无效的ID"), { status: 400 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      include: {
        director: { select: { id: true, name: true } },
        roles: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        chapters: {
          orderBy: { order: "asc" },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
        _count: {
          select: { messages: true, inspirations: true },
        },
      },
    });

    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    return NextResponse.json(apiResponse({ story }));
  } catch (error: any) {
    console.error("[StoryDetail GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取故事详情失败"), { status: 500 });
  }
}
