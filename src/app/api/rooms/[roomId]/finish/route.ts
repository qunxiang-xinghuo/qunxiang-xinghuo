import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * POST /api/rooms/:roomId/finish
 * 结束故事对白房间，保存为资产，揭晓谜底
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { roomId } = await params;

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        story: true,
        messages: { orderBy: { createdAt: "asc" } },
        participants: true,
      },
    });

    if (!room) {
      return NextResponse.json(apiError("NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 检查是否是参与者
    const isParticipant = room.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json(apiError("FORBIDDEN", "不是房间参与者"), { status: 403 });
    }

    // 关闭房间
    await db.room.update({
      where: { id: roomId },
      data: { status: "closed", closedAt: new Date() },
    });

    // 创建资产（保存对白）
    const content = room.messages.map((m) => `${m.identity}: ${m.content}`).join("\n");
    const asset = await db.asset.create({
      data: {
        userId,
        roomId,
        title: room.story?.title || "故事对白",
        summary: room.story?.storySummary || "",
        content: content.slice(0, 5000),
        identity: room.participants.find((p) => p.userId === userId)?.identity || "匿名",
        messageCount: room.messages.length,
        sparkCount: room.messages.filter((m) => m.isSpark).length,
        isPublic: false,
      },
    });

    return NextResponse.json(apiResponse({
      roomId,
      assetId: asset.id,
      status: "closed",
      truth: room.story?.act4Truth || null,
    }));
  } catch (error: any) {
    console.error("[Room Finish] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "结束失败"), { status: 500 });
  }
}
