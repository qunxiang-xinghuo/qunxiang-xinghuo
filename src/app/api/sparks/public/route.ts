import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/sparks/public
 * 公开火花墙（RoomMessage中 isSpark=true 的记录），按时间倒序
 * Query: ?limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const messages = await prisma.roomMessage.findMany({
      where: { isSpark: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        room: {
          select: {
            brainhole: { select: { title: true } },
          },
        },
      },
    });

    const list = messages.map((m) => ({
      id: m.id,
      content: m.content,
      heat: 0, // RoomMessage没有heat字段
      createdAt: m.createdAt.toISOString(),
      identity: m.identity || "匿名",
      brainholeTitle: m.room?.brainhole?.title || "",
      messageId: m.id,
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Public] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
