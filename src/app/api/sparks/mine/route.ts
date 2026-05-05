import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/sparks/mine
 * 我的火花（个人所有对白记录）
 * Query: ?sort=latest|hottest
 * sort=latest: 按发布时间降序（默认）
 * sort=hottest: 按热度值降序
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json(apiResponse({ list: [] }));
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "latest"; // latest | hottest

    const orderBy = sort === "hottest"
      ? [{ hotScore: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

    const assets = await prisma.asset.findMany({
      where: { userId: effectiveUserId },
      orderBy,
      take: 100,
      include: {
        brainhole: { select: { title: true } },
        room: { select: { id: true } },
      },
    });

    const list = assets.map((a) => ({
      id: a.id,
      content: a.content || a.summary || "",
      title: a.title,
      hotScore: a.hotScore || 0,
      createdAt: a.createdAt.toISOString(),
      identity: a.identity || "匿名",
      brainholeTitle: a.brainhole?.title || a.title || "",
      isPublic: a.isPublic,
      sparkCount: a.sparkCount || 0,
      messageCount: a.messageCount || 0,
      roomId: a.room?.id || null,
      likedByMe: false, // 自己的火花，不允许点赞
      isMySpark: true,
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Mine] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
