import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/stories/[storyId]/roles/[roleId]/claim - 认领角色
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; roleId: string }> }
) {
  try {
    const { storyId, roleId } = await params;
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { claimReason, identityTag, performanceDirection } = body;

    // 检查角色是否存在且未被认领（或之前被拒绝过）
    const role = await db.storyRole.findFirst({
      where: { id: roleId, storyId },
    });

    if (!role) {
      return NextResponse.json(apiError("NOT_FOUND", "角色不存在"), { status: 404 });
    }
    if (role.claimedBy && role.claimStatus !== "rejected") {
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

    // 更新角色认领（状态设为pending，等待导演审核）
    const updatedRole = await db.storyRole.update({
      where: { id: roleId },
      data: {
        claimedBy: userId,
        claimedAt: new Date(),
        claimReason: claimReason || null,
        claimStatus: "pending",
        identityTag: identityTag || null,
        performanceDirection: performanceDirection || null,
      },
    });

    return NextResponse.json(apiResponse({
      success: true,
      role: updatedRole,
    }));
  } catch (error: any) {
    console.error("[ClaimRole POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "认领角色失败"), { status: 500 });
  }
}
