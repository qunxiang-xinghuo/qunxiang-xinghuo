import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/sparks/top?limit=3
 * 今日最热 TOP3 火花排行榜
 * 从 Asset 中按 hotScore 降序取前 N 条
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "3", 10);
    const limit = Number.isNaN(rawLimit) ? 3 : Math.min(Math.max(rawLimit, 1), 10);

    const assets = await prisma.asset.findMany({
      where: { isPublic: true, deletedByUser: false },
      orderBy: [{ hotScore: "desc" as const }, { createdAt: "desc" as const }],
      take: limit,
      include: {
        brainhole: { select: { title: true } },
        room: {
          select: {
            id: true,
            participants: {
              select: { identity: true },
              take: 2,
            },
          },
        },
      },
    });

    const list = assets.map((a) => {
      const participants = a.room?.participants || [];
      const identities = participants
        .map((p) => p.identity)
        .filter(Boolean);
      const identityPair = identities.length >= 2
        ? `${identities[0]} × ${identities[1]}`
        : identities[0] || "匿名对话";

      return {
        id: a.id,
        brainholeTitle: a.brainhole?.title || a.title || "未命名火花",
        identityPair,
        sparkCount: a.sparkCount || 0,
        roomId: a.room?.id || null,
      };
    });

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Top] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
