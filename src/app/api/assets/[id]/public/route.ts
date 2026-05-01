import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isPublic } = body;

    // 检查资产是否属于当前用户
    const asset = await db.asset.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "资产不存在或无权限"), { status: 404 });
    }

    const updated = await db.asset.update({
      where: { id },
      data: { isPublic: !!isPublic },
    });

    return NextResponse.json(apiResponse({ asset: updated }));
  } catch (error) {
    console.error("[Asset Public PATCH] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "更新失败"), { status: 500 });
  }
}
