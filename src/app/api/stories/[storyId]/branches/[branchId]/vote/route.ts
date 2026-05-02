import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// POST /api/stories/[storyId]/branches/[branchId]/vote - 投票
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; branchId: string }> }
) {
  try {
    const { storyId, branchId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || `guest-${Date.now()}`;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const { optionIdx, resolve = false } = body;
    if (typeof optionIdx !== "number") {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少optionIdx"), { status: 400 });
    }

    const branch = await db.storyBranch.findFirst({
      where: { id: branchId, storyId },
    });

    if (!branch) {
      return NextResponse.json(apiError("NOT_FOUND", "分支不存在"), { status: 404 });
    }

    let updatedBranch;
    if (resolve) {
      // 导演决议：确定获胜选项
      const story = await db.story.findUnique({
        where: { id: storyId },
        select: { directorId: true },
      });
      if (story?.directorId !== userId) {
        return NextResponse.json(apiError("FORBIDDEN", "只有导演可以决议"), { status: 403 });
      }
      updatedBranch = await db.storyBranch.update({
        where: { id: branchId },
        data: { status: "resolved", winnerIdx: optionIdx },
      });
    } else {
      updatedBranch = branch;
    }

    broadcastToRoom(`story-${storyId}`, "branch-vote", {
      branchId,
      optionIdx,
      votedBy: userId,
      resolved: resolve,
      timestamp: Date.now(),
    });

    return NextResponse.json(apiResponse({ branch: updatedBranch }));
  } catch (error: any) {
    console.error("[BranchVote POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "投票失败"), { status: 500 });
  }
}
