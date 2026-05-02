import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/stories/[storyId]/inspirations - 获取灵感库
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const inspirations = await db.storyInspiration.findMany({
      where: { storyId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apiResponse({ inspirations }));
  } catch (error: any) {
    console.error("[StoryInspirations GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取灵感失败"), { status: 500 });
  }
}

// POST /api/stories/[storyId]/inspirations - 添加灵感
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

    const { content, sourceMsgId } = body;
    if (!content) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少content"), { status: 400 });
    }

    const inspiration = await db.storyInspiration.create({
      data: {
        storyId,
        content,
        sourceMsgId: sourceMsgId || null,
      },
    });

    return NextResponse.json(apiResponse({ inspiration }), { status: 201 });
  } catch (error: any) {
    console.error("[StoryInspirations POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "添加灵感失败"), { status: 500 });
  }
}
