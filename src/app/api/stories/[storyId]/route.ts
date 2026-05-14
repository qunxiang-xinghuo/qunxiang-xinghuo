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
          orderBy: { sortOrder: "asc" },
        },
        chapters: { orderBy: { order: "asc" } },
        messages: { orderBy: { createdAt: "asc" }, take: 100 },
        _count: { select: { messages: true, inspirations: true } },
      },
    });

    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    // v8.0-sec-fix: 非公开状态的故事需要鉴权
    // v8.0-fix: open/recruiting/approved 状态的故事也应公开可见
    const isPublic = ['published', 'open', 'recruiting', 'approved'].includes(story.status);
    if (!isPublic) {
      return NextResponse.json(apiError("FORBIDDEN", "该故事尚未发布"), { status: 403 });
    }

    // v8.0: 如果是解密故事（有 eraBackground），返回简化格式
    if (story.eraBackground) {
      return NextResponse.json(apiResponse({
        id: story.id,
        title: story.title,
        eraBackground: story.eraBackground || "",
        storySummary: story.storySummary || "",
        act1Reveal: story.act1Reveal || "",
        act2Reveal: story.act2Reveal || "",
        act3Reveal: story.act3Reveal || "",
        act4Truth: story.act4Truth || "",
        maxCharacters: story.maxCharacters || 2,
        hotScore: story.hotScore || 0,
        difficulty: story.difficulty || 1,
        status: story.status,
        roles: story.roles.map((r) => ({
          id: r.id,
          name: r.name,
          openingInfo: r.openingInfo || "",
          description: r.description || "",
          innerMonologue: r.innerMonologue || "",
          claimed: !!r.claimedBy,
          claimedBy: r.claimedBy,
        })),
      }));
    }

    // 旧格式：返回完整故事对象
    return NextResponse.json(apiResponse({ story }));
  } catch (error: unknown) {
    console.error("[StoryDetail GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取故事详情失败"), { status: 500 });
  }
}
