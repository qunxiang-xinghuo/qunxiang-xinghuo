import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/sparks/:id/like
 * 点赞/取消点赞火花
 * 规则：
 * 1. 不能给自己的火花点赞
 * 2. 已点赞则取消点赞，未点赞则点赞
 * 3. 同步更新 Asset.hotScore
 */
export async function POST(
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

    // 获取火花信息
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "火花不存在"), { status: 404 });
    }

    // 不能给自己的火花点赞
    if (asset.userId === effectiveUserId) {
      return NextResponse.json(apiError("FORBIDDEN", "不能给自己的火花点赞"), { status: 403 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.assetLike.findUnique({
      where: {
        assetId_userId: {
          assetId: id,
          userId: effectiveUserId,
        },
      },
    });

    if (existingLike) {
      // 已点赞 → 取消点赞
      await prisma.$transaction([
        prisma.assetLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.asset.update({
          where: { id },
          data: { hotScore: { decrement: 1 } },
        }),
      ]);

      const updated = await prisma.asset.findUnique({
        where: { id },
        select: { hotScore: true },
      });

      return NextResponse.json(apiResponse({
        liked: false,
        hotScore: updated?.hotScore || 0,
        message: "已取消点赞",
      }));
    } else {
      // 未点赞 → 点赞
      await prisma.$transaction([
        prisma.assetLike.create({
          data: {
            assetId: id,
            userId: effectiveUserId,
          },
        }),
        prisma.asset.update({
          where: { id },
          data: { hotScore: { increment: 1 } },
        }),
      ]);

      const updated = await prisma.asset.findUnique({
        where: { id },
        select: { hotScore: true },
      });

      return NextResponse.json(apiResponse({
        liked: true,
        hotScore: updated?.hotScore || 0,
        message: "点赞成功",
      }));
    }
  } catch (error) {
    console.error("[Spark Like] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "操作失败"), { status: 500 });
  }
}
