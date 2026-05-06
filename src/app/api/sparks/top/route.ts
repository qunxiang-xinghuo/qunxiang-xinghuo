import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/sparks/top?limit=3
 * v8.0: TOP3 火花排行榜 — 返回 hotScore 最高的公开火花
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "3", 10);
    const limit = Number.isNaN(rawLimit) ? 3 : Math.min(Math.max(rawLimit, 1), 10);

    const assets = await db.asset.findMany({
      where: { isPublic: true },
      orderBy: [{ hotScore: "desc" as const }, { createdAt: "desc" as const }],
      take: limit,
      include: {
        brainhole: { select: { title: true, category: true } },
        room: {
          select: {
            id: true,
            status: true,
            closedAt: true,
            createdAt: true,
            participants: {
              select: { identity: true, userId: true },
            },
          },
        },
      },
    });

    // 获取每个火花的最新消息预览（2条）
    const list = await Promise.all(
      assets.map(async (asset) => {
        // 获取房间中最热的2条消息
        const messages = asset.roomId
          ? await db.roomMessage.findMany({
              where: { roomId: asset.roomId },
              orderBy: { createdAt: "asc" as const },
              take: 2,
              select: { content: true, identity: true, createdAt: true },
            })
          : [];

        const participants = asset.room?.participants || [];
        const identities = participants.map((p) => p.identity).filter(Boolean);
        const identityPair = identities.length >= 2
          ? `${identities[0]} × ${identities[1]}`
          : identities[0] || asset.identity || "匿名";

        return {
          id: asset.id,
          title: asset.title,
          content: asset.content || asset.summary || "",
          hotScore: asset.hotScore || 0,
          createdAt: asset.createdAt.toISOString(),
          identity: asset.identity || "匿名",
          identityPair,
          brainholeTitle: asset.brainhole?.title || asset.title || "",
          brainholeCategory: asset.brainhole?.category || "",
          roomId: asset.roomId,
          messageCount: asset.messageCount || 0,
          sparkCount: asset.sparkCount || 0,
          previewMessages: messages.map((m) => ({
            content: m.content,
            identity: m.identity,
          })),
        };
      })
    );

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Top] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
