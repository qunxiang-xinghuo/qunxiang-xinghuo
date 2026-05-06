import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isPublic } = body;

    // 检查资产是否属于当前用户
    const asset = await db.asset.findFirst({
      where: { id, userId },
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
