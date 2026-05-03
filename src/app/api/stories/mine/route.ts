import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/stories/mine
 * 我参与的故事
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

    // 查找用户参与的故事房间
    const rooms = await prisma.room.findMany({
      where: {
        participants: { some: { userId: effectiveUserId } },
        type: 'story',
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        brainhole: { select: { title: true } },
        participants: { select: { userId: true, identity: true } },
      },
    });

    const list = rooms.map((r) => ({
      id: r.id,
      title: r.brainhole?.title || "未命名故事",
      participantCount: r.participants.length,
      updatedAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Stories Mine] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
