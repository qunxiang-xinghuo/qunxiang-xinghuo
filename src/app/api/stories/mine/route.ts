import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/stories/mine?type=created|participated
 * 我的故事：我创建的 / 我参与的
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "participated"; // created | participated

    let list: any[] = [];

    if (type === "created") {
      const stories = await db.story.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" as const },
        take: 50,
        include: {
          roles: { select: { name: true, claimedBy: true } },
        },
      });
      list = stories.map((s) => ({
        id: s.id,
        title: s.title,
        eraBackground: s.eraBackground || "",
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        roleCount: s.roles.length,
        hotScore: s.hotScore || 0,
        isCreator: true,
      }));
    } else {
      // participated: 通过 StoryRole.claimedBy 查找
      const roles = await db.storyRole.findMany({
        where: { claimedBy: userId },
        take: 50,
        include: {
          story: {
            include: {
              roles: { select: { name: true, claimedBy: true } },
            },
          },
        },
      });
      // v9.1: 为每个参与的故事查询最佳火花消息
      const storyIds = roles.map((r) => r.story.id);
      const rooms = await db.room.findMany({
        where: { storyId: { in: storyIds } },
        select: { id: true, storyId: true },
      });
      const roomIdsByStory = new Map<string, string[]>();
      for (const room of rooms) {
        if (room.storyId) {
          const arr = roomIdsByStory.get(room.storyId) || [];
          arr.push(room.id);
          roomIdsByStory.set(room.storyId, arr);
        }
      }
      const allRoomIds = rooms.map((r) => r.id);
      const sparks = await db.roomMessage.findMany({
        where: {
          roomId: { in: allRoomIds },
          senderId: userId,
          isSpark: true,
        },
        orderBy: { createdAt: "desc" },
        select: { roomId: true, content: true, createdAt: true },
      });
      const sparkByRoom = new Map<string, { content: string; createdAt: Date }>();
      for (const s of sparks) {
        if (!sparkByRoom.has(s.roomId)) {
          sparkByRoom.set(s.roomId, { content: s.content, createdAt: s.createdAt });
        }
      }

      list = roles.map((r) => {
        const roomIds = roomIdsByStory.get(r.story.id) || [];
        let bestSpark: { content: string; createdAt: string } | null = null;
        for (const rid of roomIds) {
          const spark = sparkByRoom.get(rid);
          if (spark) {
            bestSpark = { content: spark.content, createdAt: spark.createdAt.toISOString() };
            break;
          }
        }
        return {
          id: r.story.id,
          title: r.story.title,
          eraBackground: r.story.eraBackground || "",
          status: r.story.status,
          myRole: r.name,
          roleId: r.id,
          createdAt: r.story.createdAt.toISOString(),
          roleCount: r.story.roles.length,
          hotScore: r.story.hotScore || 0,
          isCreator: r.story.creatorId === userId,
          bestSpark,
        };
      });
    }

    return NextResponse.json(apiResponse({ list }));
  } catch (error: any) {
    console.error("[Stories Mine] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取失败，请稍后重试"), { status: 500 });
  }
}

/**
 * DELETE /api/stories/mine
 * v8.2: 删除我的故事记录
 * Body: { storyId: string }
 * - creator: 删除整个 Story 及其关联数据
 * - participant: 解除角色 claim，删除关联 Asset
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;
    if (!storyId) {
      return NextResponse.json(apiError("BAD_REQUEST", "参数错误"), { status: 400 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { creatorId: true },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    // creator 删除整个故事
    if (story.creatorId === userId) {
      const rooms = await db.room.findMany({ where: { storyId }, select: { id: true } });
      for (const room of rooms) {
        await db.roomComment.deleteMany({ where: { roomId: room.id } });
        await db.roomMessage.deleteMany({ where: { roomId: room.id } });
        await db.roomParticipant.deleteMany({ where: { roomId: room.id } });
        await db.asset.deleteMany({ where: { roomId: room.id } });
        await db.reaction.deleteMany({ where: { roomId: room.id } });
      }
      await db.room.deleteMany({ where: { storyId } });
      await db.storyRole.deleteMany({ where: { storyId } });
      await db.storyChapter.deleteMany({ where: { storyId } });
      await db.storyMessage.deleteMany({ where: { storyId } });
      await db.storyInspiration.deleteMany({ where: { storyId } });
      await db.storyBranch.deleteMany({ where: { storyId } });
      await db.storyLike.deleteMany({ where: { storyId } });
      await db.story.delete({ where: { id: storyId } });
      return NextResponse.json(apiResponse({ message: "故事已删除" }));
    }

    // participant: 解除角色 claim + 删除关联 Asset
    const myRole = await db.storyRole.findFirst({
      where: { storyId, claimedBy: userId },
    });
    if (myRole) {
      await db.storyRole.update({
        where: { id: myRole.id },
        data: { claimedBy: null, claimedAt: null, claimStatus: 'unclaimed' },
      });
    }

    // 删除关联的 Asset（人机/双人模式）
    const myRooms = await db.roomParticipant.findMany({
      where: { userId },
      include: { room: { select: { storyId: true } } },
    });
    const storyRoomIds = myRooms
      .filter((rp) => rp.room.storyId === storyId)
      .map((rp) => rp.roomId);

    for (const roomId of storyRoomIds) {
      const assets = await db.asset.findMany({ where: { roomId, userId } });
      for (const asset of assets) {
        await db.assetLike.deleteMany({ where: { assetId: asset.id } });
        await db.asset.delete({ where: { id: asset.id } });
      }
    }

    return NextResponse.json(apiResponse({ message: "参与记录已删除" }));
  } catch (error: any) {
    console.error("[Stories Mine DELETE] Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json(apiResponse({ message: '资源不存在或已删除' }));
    }
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
