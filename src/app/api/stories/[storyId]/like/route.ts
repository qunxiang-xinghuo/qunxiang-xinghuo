import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { getToken } from "next-auth/jwt";

/**
 * POST /api/stories/:storyId/like
 * 点赞/取消点赞故事
 * 规则：
 * 1. 不能给自己创建的故事点赞
 * 2. 已点赞则取消，未点赞则点赞
 * 3. 同步更新 Story.hotScore
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  let storyId: string | undefined;
  let effectiveUserId: string | null | undefined;
  try {
    const paramsData = await params;
    storyId = paramsData.storyId;
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    // 不能给自己创建的故事点赞
    if (story.creatorId === effectiveUserId) {
      return NextResponse.json(apiError("FORBIDDEN", "不能给自己的故事点赞"), { status: 403 });
    }

    const existingLike = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: effectiveUserId,
        },
      },
    });

    if (existingLike) {
      await prisma.$transaction([
        prisma.storyLike.delete({ where: { id: existingLike.id } }),
        prisma.story.update({ where: { id: storyId }, data: { hotScore: { decrement: 1 } } }),
      ]);
      const updated = await prisma.story.findUnique({ where: { id: storyId }, select: { hotScore: true } });
      return NextResponse.json(apiResponse({ liked: false, hotScore: updated?.hotScore || 0, message: "已取消点赞" }));
    } else {
      await prisma.$transaction([
        prisma.storyLike.create({ data: { storyId, userId: effectiveUserId } }),
        prisma.story.update({ where: { id: storyId }, data: { hotScore: { increment: 1 } } }),
      ]);
      const updated = await prisma.story.findUnique({ where: { id: storyId }, select: { hotScore: true } });
      return NextResponse.json(apiResponse({ liked: true, hotScore: updated?.hotScore || 0, message: "点赞成功" }));
    }
  } catch (error: any) {
    console.error("[Story Like] Error:", error);
    if (error?.code === "P2002" && storyId && effectiveUserId) {
      const like = await prisma.storyLike.findUnique({
        where: { storyId_userId: { storyId, userId: effectiveUserId } },
      });
      const updated = await prisma.story.findUnique({ where: { id: storyId }, select: { hotScore: true } });
      return NextResponse.json(apiResponse({ liked: !!like, hotScore: updated?.hotScore || 0 }));
    }
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "操作失败"), { status: 500 });
  }
}
