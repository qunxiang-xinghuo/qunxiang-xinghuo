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
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { storyId } = await params;
    const body = await request.json();
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

    if (role.claimedBy && role.claimedBy !== userId) {
      return NextResponse.json(apiError("CONFLICT", "该角色已被选择"), { status: 409 });
    }

    // 清理用户在该故事中已claim的其他角色
    await db.storyRole.updateMany({
      where: { storyId, claimedBy: userId, id: { not: roleId } },
      data: { claimedBy: null, claimedAt: null, claimStatus: "unclaimed" },
    });

    // 检查是否已有活跃房间
    const existingRoom = await db.room.findFirst({
      where: { storyId, status: "active" },
    });
    if (existingRoom) {
      // 检查用户是否已在该房间的参与者中
      const existingParticipant = await db.roomParticipant.findFirst({
        where: { roomId: existingRoom.id, userId },
      });
      if (existingParticipant) {
        return NextResponse.json(apiResponse({
          status: "matched",
          roomId: existingRoom.id,
          storyId: story.id,
          roleName: role.name,
          openingInfo: role.openingInfo || "",
        }));
      }
    }

    await db.storyRole.update({
      where: { id: roleId },
      data: { claimedBy: userId, claimedAt: new Date(), claimStatus: "active" },
    });

    const otherRole = story.roles.find((r) => r.id !== roleId && r.claimedBy && r.claimedBy !== userId);

    if (otherRole?.claimedBy) {
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
