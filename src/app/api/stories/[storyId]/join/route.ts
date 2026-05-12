import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * POST /api/stories/:storyId/join
 * 选角色加入故事。
 * Body: { roleId: string }
 * 查找同故事等待用户 → 创建 Room。未找到 → 返回 { status: "waiting" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { storyId } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(apiError("BAD_REQUEST", "请选择角色"), { status: 400 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      include: { roles: true },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    const role = story.roles.find((r) => r.id === roleId);
    if (!role) {
      return NextResponse.json(apiError("BAD_REQUEST", "角色不存在"), { status: 400 });
    }

    // 检查故事是否可加入
    if (story.status === 'closed' || story.status === 'completed') {
      return NextResponse.json(apiError("BAD_REQUEST", "该故事已结束"), { status: 400 });
    }

    // 清理用户在该故事中已claim的其他角色
    await db.storyRole.updateMany({
      where: { storyId, claimedBy: userId, id: { not: roleId } },
      data: { claimedBy: null, claimedAt: null, claimStatus: "unclaimed" },
    });

    // 检查用户是否已在该故事的活跃房间中
    const myActiveParticipant = await db.roomParticipant.findFirst({
      where: { userId, room: { storyId, status: "active" } },
      include: { room: true },
    });
    if (myActiveParticipant) {
      return NextResponse.json(apiResponse({
        status: "matched",
        roomId: myActiveParticipant.room.id,
        storyId: story.id,
        roleName: role.name,
        openingInfo: role.openingInfo || "",
      }));
    }

    // 乐观锁：尝试 claim 角色（只有 claimedBy 为 null 时才成功）
    let claimedRole;
    try {
      claimedRole = await db.storyRole.update({
        where: { id: roleId, claimedBy: null },
        data: { claimedBy: userId, claimedAt: new Date(), claimStatus: "active" },
      });
    } catch (e: any) {
      // P2025 = Record to update not found（已被他人 claim）
      if (e.code === 'P2025') {
        return NextResponse.json(apiError("CONFLICT", "该角色已被选择"), { status: 409 });
      }
      throw e;
    }

    // 重新查询其他角色（在事务后获取最新状态）
    const otherRole = await db.storyRole.findFirst({
      where: {
        storyId,
        id: { not: roleId },
        AND: [
          { claimedBy: { not: null } },
          { claimedBy: { not: userId } },
        ],
      },
      orderBy: { claimedAt: 'asc' },
    });

    if (otherRole?.claimedBy) {
      // 检查是否已存在包含这两个用户的房间（防重复）
      const existingPairRoom = await db.room.findFirst({
        where: {
          storyId,
          status: "active",
          participants: {
            every: { userId: { in: [userId, otherRole.claimedBy] } },
          },
        },
        include: { participants: true },
      });
      if (existingPairRoom && existingPairRoom.participants.length >= 2) {
        return NextResponse.json(apiResponse({
          status: "matched",
          roomId: existingPairRoom.id,
          storyId: story.id,
          roleName: role.name,
          openingInfo: role.openingInfo || "",
        }));
      }

      const room = await db.room.create({
        data: {
          storyId: story.id,
          type: "story_duet",
          status: "active",
          scene: story.eraBackground || story.storySummary || "",
        },
      });

      await db.roomParticipant.createMany({
        data: [
          { roomId: room.id, userId, identity: role.name, role: "actor", isOnline: true },
          { roomId: room.id, userId: otherRole.claimedBy, identity: otherRole.name, role: "actor", isOnline: true },
        ],
      });

      return NextResponse.json(apiResponse({
        status: "matched",
        roomId: room.id,
        storyId: story.id,
        roleName: role.name,
        openingInfo: role.openingInfo || "",
      }));
    }

    return NextResponse.json(apiResponse({
      status: "waiting",
      storyId: story.id,
      roleName: role.name,
      openingInfo: role.openingInfo || "",
    }));
  } catch (error: any) {
    console.error("[Story Join] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "加入失败"), { status: 500 });
  }
}
