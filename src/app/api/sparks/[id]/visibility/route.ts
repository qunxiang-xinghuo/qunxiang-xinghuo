import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db as prisma } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { liukanshanReview } from "@/lib/ai/review";

/**
 * PUT /api/sparks/:id/visibility
 * 更新火花的公开/私密状态
 * v8.1: 设为公开前必须经过刘看山Agent审核
 * Body: { isPublic: boolean }
 */
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
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

    // v8.1: 用户没有手动公开权，公开只能由 finish API 的自动审核触发
    if (isPublic && !asset.isPublic) {
      return NextResponse.json(
        apiError("FORBIDDEN", "火花公开需通过系统审核，无法手动设为公开"),
        { status: 403 }
      );
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
