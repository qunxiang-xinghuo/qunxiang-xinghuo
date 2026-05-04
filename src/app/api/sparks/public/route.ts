import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/sparks/public
 * 公开火花墙（Asset中 isPublic=true 的记录），按热度降序
 * Query: ?limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const assets = await prisma.asset.findMany({
      where: { isPublic: true },
      orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
      take: limit,
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
      sparkCount: a.sparkCount || 0,
      messageCount: a.messageCount || 0,
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Public] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
