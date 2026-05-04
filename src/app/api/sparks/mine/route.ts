import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/sparks/mine
 * 我的火花（个人所有对白记录，不分公开/私密）
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

    const assets = await prisma.asset.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: "desc" },
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
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Mine] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
