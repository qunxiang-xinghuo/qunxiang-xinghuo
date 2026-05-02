import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/stories/[storyId]/roles/[roleId]/claim - 认领角色
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; roleId: string }> }
) {
  try {
    const { storyId, roleId } = await params;
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || `guest-${Date.now()}`;

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { claimReason } = body;

    // 检查角色是否存在且未被认领
    const role = await db.storyRole.findFirst({
      where: { id: roleId, storyId },
    });

    if (!role) {
      return NextResponse.json(apiError("NOT_FOUND", "角色不存在"), { status: 404 });
    }
    if (role.claimedBy) {
      return NextResponse.json(apiError("ALREADY_CLAIMED", "该角色已被认领"), { status: 400 });
    }

    // 检查用户是否已认领该故事的其他角色
    const existingClaim = await db.storyRole.findFirst({
      where: { storyId, claimedBy: userId },
    });
    if (existingClaim) {
      return NextResponse.json(apiError("ALREADY_HAS_ROLE", "你已认领该故事的其他角色"), { status: 400 });
    }

    // 确保用户存在
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "演员",
        email: `${userId}@guest.local`,
      },
    });

    // 更新角色认领
    await db.storyRole.update({
      where: { id: roleId },
      data: {
        claimedBy: userId,
        claimedAt: new Date(),
        claimReason: claimReason || null,
      },
    });

    // 检查是否所有角色都被认领
    const allRoles = await db.storyRole.findMany({ where: { storyId } });
    const allClaimed = allRoles.every((r) => r.claimedBy);

    if (allClaimed) {
      await db.story.update({
        where: { id: storyId },
        data: { status: "ongoing" },
      });
    }

    return NextResponse.json(apiResponse({
      success: true,
      allClaimed,
      role: { ...role, claimedBy: userId, claimReason },
    }));
  } catch (error: any) {
    console.error("[ClaimRole POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "认领角色失败"), { status: 500 });
  }
}
