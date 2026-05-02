import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// POST /api/stories/[storyId]/roles/[roleId]/review - 导演审核角色认领
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; roleId: string }> }
) {
  try {
    const { storyId, roleId } = await params;
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || "";

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { action } = body; // "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(apiError("BAD_REQUEST", "action参数必须为approve或reject"), { status: 400 });
    }

    // 检查故事是否存在，并验证导演身份
    const story = await db.story.findUnique({
      where: { id: storyId },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }
    if (story.directorId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "只有导演可以审核角色认领"), { status: 403 });
    }

    // 检查角色是否存在且处于待审核状态
    const role = await db.storyRole.findFirst({
      where: { id: roleId, storyId },
    });
    if (!role) {
      return NextResponse.json(apiError("NOT_FOUND", "角色不存在"), { status: 404 });
    }
    if (role.claimStatus !== "pending") {
      return NextResponse.json(apiError("BAD_REQUEST", "该角色不处于待审核状态"), { status: 400 });
    }

    if (action === "approve") {
      const updatedRole = await db.storyRole.update({
        where: { id: roleId },
        data: { claimStatus: "approved" },
      });
      return NextResponse.json(apiResponse({
        success: true,
        action: "approve",
        role: updatedRole,
      }));
    } else {
      // reject: 清空认领信息，恢复为未认领状态
      const updatedRole = await db.storyRole.update({
        where: { id: roleId },
        data: {
          claimStatus: "rejected",
          claimedBy: null,
          claimedAt: null,
          claimReason: null,
          identityTag: null,
          performanceDirection: null,
        },
      });
      return NextResponse.json(apiResponse({
        success: true,
        action: "reject",
        role: updatedRole,
      }));
    }
  } catch (error: any) {
    console.error("[ReviewRole POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "审核角色失败"), { status: 500 });
  }
}
