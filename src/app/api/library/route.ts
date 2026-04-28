import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // 获取用户的反应、火花和故事草稿
    const [reactions, sparks, storyDrafts] = await Promise.all([
      db.reaction.findMany({
        where: { userId: session.user.id },
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
          userId: session.user.id,
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
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json(apiResponse({
      reactions,
      sparks,
      storyDrafts,
      stats: {
        totalReactions: await db.reaction.count({ where: { userId: session.user.id } }),
        totalSparks: await db.reaction.count({ where: { userId: session.user.id, isSpark: true } }),
        totalStoryDrafts: await db.storyDraft.count({ where: { userId: session.user.id } }),
      },
    }));
  } catch (error) {
    console.error("获取个人素材库失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取个人素材库失败"), { status: 500 });
  }
}