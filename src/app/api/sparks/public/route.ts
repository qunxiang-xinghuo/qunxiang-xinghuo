import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/sparks/public
 * 公开火花墙（Asset中 isPublic=true 的记录）
 * Query: ?limit=50&sort=latest|hottest
 * sort=latest: 按发布时间降序（默认）
 * sort=hottest: 按热度值降序
 */
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const sort = searchParams.get("sort") || "latest"; // latest | hottest

    const orderBy = sort === "hottest"
      ? [{ hotScore: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

    // 获取当前用户ID（用于判断 likedByMe）
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;

    const assets = await prisma.asset.findMany({
      where: { isPublic: true },
      orderBy,
      take: limit,
      include: {
        brainhole: { select: { title: true } },
        room: { select: { id: true } },
      },
    });

    // 如果用户已登录，查询该用户对所有这些火花的点赞状态
    let likedAssetIds = new Set<string>();
    if (effectiveUserId && assets.length > 0) {
      const likes = await prisma.assetLike.findMany({
        where: {
          assetId: { in: assets.map((a) => a.id) },
          userId: effectiveUserId,
        },
        select: { assetId: true },
      });
      likedAssetIds = new Set(likes.map((l) => l.assetId));
    }

    const list = assets.map((a) => ({
      id: a.id,
      content: a.content || a.summary || "",
      title: a.title,
      hotScore: a.hotScore || 0,
      createdAt: a.createdAt.toISOString(),
      identity: a.identity || "匿名",
      brainholeTitle: a.brainhole?.title || a.title || "",
      sparkCount: a.sparkCount || 0,
      messageCount: a.messageCount || 0,
      roomId: a.room?.id || null,
      likedByMe: likedAssetIds.has(a.id),
      isMySpark: effectiveUserId ? a.userId === effectiveUserId : false,
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Public] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
