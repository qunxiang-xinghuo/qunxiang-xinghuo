import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db as prisma } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/stories/mine
 * 我参与的故事
 */
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
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
