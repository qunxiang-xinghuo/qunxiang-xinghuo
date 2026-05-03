import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/sparks/mine
 * 我的火花片段（RoomMessage中 isSpark=true 且 senderId=我的记录）
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

    const messages = await prisma.roomMessage.findMany({
      where: {
        isSpark: true,
        senderId: effectiveUserId,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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
      heat: 0,
      createdAt: m.createdAt.toISOString(),
      identity: m.identity || "匿名",
      brainholeTitle: m.room?.brainhole?.title || "",
      messageId: m.id,
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Sparks Mine] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
