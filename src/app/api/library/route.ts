import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // 获取用户的反应、火花和故事草稿
    const [reactions, sparks, storyDrafts] = await Promise.all([
      db.reaction.findMany({
        where: { userId },
        include: {
          brainhole: {
            select: {
              id: true,
              title: true,
              scenario: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.reaction.findMany({
        where: { 
          userId,
          isSpark: true,
        },
        include: {
          brainhole: {
            select: {
              id: true,
              title: true,
              scenario: true,
            },
          },
        },
        orderBy: { sparkMarkedAt: "desc" },
        take: 20,
      }),
      db.storyDraft.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json(apiResponse({
      reactions,
      sparks,
      storyDrafts,
      stats: {
        totalReactions: await db.reaction.count({ where: { userId } }),
        totalSparks: await db.reaction.count({ where: { userId, isSpark: true } }),
        totalStoryDrafts: await db.storyDraft.count({ where: { userId } }),
      },
    }));
  } catch (error) {
    console.error("获取个人素材库失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取个人素材库失败"), { status: 500 });
  }
}