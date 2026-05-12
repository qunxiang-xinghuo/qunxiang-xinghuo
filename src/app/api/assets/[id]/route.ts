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
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
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

    // v8.1-fix5: 已软删除的资产对所有人不可见
    if (asset.deletedByUser) {
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
// v8.1-fix5: 人机模式直接删除，双人模式标记删除（双方均删才物理清除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { id } = await params;

    // 检查资产是否属于当前用户
    const asset = await db.asset.findFirst({
      where: { id, userId },
      include: { room: { select: { type: true } } },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "素材不存在或无权限"), { status: 404 });
    }

    // v8.1-fix5: 人机模式（ai_duet）直接物理删除
    if (asset.room?.type === 'ai_duet') {
      await db.asset.delete({ where: { id } });
      return NextResponse.json(apiResponse({ message: "删除成功" }));
    }

    // v8.1-fix5: 双人/故事模式标记软删除
    await db.asset.update({
      where: { id },
      data: { deletedByUser: true },
    });

    // v8.1-fix5: 若同一房间下所有 Asset 均已被标记删除 → 物理清除
    if (asset.roomId) {
      const roomAssets = await db.asset.findMany({
        where: { roomId: asset.roomId },
        select: { id: true, deletedByUser: true },
      });
      const allDeleted = roomAssets.every((a) => a.deletedByUser);
      if (allDeleted && roomAssets.length > 0) {
        await db.asset.deleteMany({ where: { roomId: asset.roomId } });
        return NextResponse.json(apiResponse({ message: "删除成功（双方均已删除）" }));
      }
    }

    return NextResponse.json(apiResponse({ message: "已从你的列表中移除" }));
  } catch (error) {
    console.error("[Asset DELETE] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
