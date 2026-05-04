import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * PUT /api/sparks/:id/visibility
 * 更新火花的公开/私密状态
 * Body: { isPublic: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return NextResponse.json(apiError("VALIDATION_ERROR", "isPublic必须是布尔值"), { status: 400 });
    }

    // 验证所有权
    const asset = await prisma.asset.findFirst({
      where: { id, userId: effectiveUserId },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "火花不存在或无权限"), { status: 404 });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: { isPublic },
    });

    return NextResponse.json(apiResponse({
      id: updated.id,
      isPublic: updated.isPublic,
      message: isPublic ? "已设为公开" : "已设为私密",
    }));
  } catch (error) {
    console.error("[Sparks Visibility] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "更新失败"), { status: 500 });
  }
}
