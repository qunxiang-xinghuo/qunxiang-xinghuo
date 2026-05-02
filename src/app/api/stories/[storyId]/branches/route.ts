import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { broadcastToRoom } from "@/server/io";

// GET /api/stories/[storyId]/branches - 获取分支列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const branches = await db.storyBranch.findMany({
      where: { storyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apiResponse({ branches }));
  } catch (error: any) {
    console.error("[StoryBranches GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取分支失败"), { status: 500 });
  }
}

// POST /api/stories/[storyId]/branches - 创建分支（AI生成或手动）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || `guest-${Date.now()}`;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const { content, options, chapterId } = body;
    if (!content || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少分支内容或选项"), { status: 400 });
    }

    const branch = await db.storyBranch.create({
      data: {
        storyId,
        chapterId: chapterId || null,
        content,
        options: JSON.stringify(options),
        status: "pending",
      },
    });

    broadcastToRoom(`story-${storyId}`, "branch-proposed", branch);

    return NextResponse.json(apiResponse({ branch }), { status: 201 });
  } catch (error: any) {
    console.error("[StoryBranches POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建分支失败"), { status: 500 });
  }
}
