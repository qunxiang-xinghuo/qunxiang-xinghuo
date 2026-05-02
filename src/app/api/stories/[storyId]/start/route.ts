import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/stories/[storyId]/start - 导演手动启动故事
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || "";

    // 检查故事是否存在
    const story = await db.story.findUnique({
      where: { id: storyId },
      include: { roles: true },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    // 验证导演身份
    if (story.directorId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "只有导演可以启动故事"), { status: 403 });
    }

    // 检查故事是否已经在进行中
    if (story.status === "ongoing") {
      return NextResponse.json(apiError("BAD_REQUEST", "故事已经在进行中"), { status: 400 });
    }
    if (story.status === "completed") {
      return NextResponse.json(apiError("BAD_REQUEST", "故事已结束"), { status: 400 });
    }

    // 检查是否所有角色都已审核通过
    const allApproved = story.roles.every((r) => r.claimStatus === "approved");
    if (!allApproved) {
      return NextResponse.json(apiError("BAD_REQUEST", "还有角色未通过审核，无法启动故事"), { status: 400 });
    }

    // 启动故事
    const updatedStory = await db.story.update({
      where: { id: storyId },
      data: { status: "ongoing" },
    });

    return NextResponse.json(apiResponse({
      success: true,
      story: updatedStory,
    }));
  } catch (error: any) {
    console.error("[StartStory POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "启动故事失败"), { status: 500 });
  }
}
