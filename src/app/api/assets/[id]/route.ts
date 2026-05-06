import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/assets/[id] — 获取单个资产详情（含对白消息）
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const { id } = await params;
    if (!id || id.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "无效的ID"), { status: 400 });
    }

    const asset = await db.asset.findUnique({
      where: { id },
      include: {
        brainhole: { select: { title: true, scenario: true } },
        room: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                content: true,
                identity: true,
                isSpark: true,
                createdAt: true,
                senderId: true,
              },
            },
            participants: {
              select: { userId: true, identity: true },
            },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "素材不存在"), { status: 404 });
    }

    // 如果未公开，检查是否是所有者
    if (!asset.isPublic && asset.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权查看该素材"), { status: 403 });
    }

    return NextResponse.json(apiResponse({ asset }));
  } catch (error) {
    console.error("[Asset Detail GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取素材详情失败"), { status: 500 });
  }
}

// DELETE /api/assets/[id] — 删除素材
export async function DELETE(
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

    // 检查资产是否属于当前用户
    const asset = await db.asset.findFirst({
      where: { id, userId },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "素材不存在或无权限"), { status: 404 });
    }

    await db.asset.delete({ where: { id } });

    return NextResponse.json(apiResponse({ message: "删除成功" }));
  } catch (error) {
    console.error("[Asset DELETE] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
