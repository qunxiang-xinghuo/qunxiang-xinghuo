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

    // 检查是否是参与者（且是演员角色，不是观众）
    const me = room.participants.find((p) => p.userId === userId);
    if (!me) {
      return NextResponse.json(apiError("FORBIDDEN", "不是房间参与者"), { status: 403 });
    }
    if (me.role === 'spectator') {
      return NextResponse.json(apiError("FORBIDDEN", "观众不能结束对白"), { status: 403 });
    }

    // v8.0-fix: 幂等检查移入 transaction，避免并发竞态
    const content = room.messages.map((m) => `${m.identity}: ${m.content}`).join("\n");
    const [updatedRoom, asset] = await db.$transaction([
      db.room.update({
        where: { id: roomId, status: { not: "closed" } },
        data: { status: "closed", closedAt: new Date() },
      }),
      db.asset.create({
        data: {
          userId,
          roomId,
          title: room.story?.title || "故事对白",
          summary: room.story?.storySummary || "",
          content: content.slice(0, 5000),
          identity: me.identity || "匿名",
          messageCount: room.messages.length,
          sparkCount: room.messages.filter((m) => m.isSpark).length,
          isPublic: true,
        },
      }),
    ]).catch(async (err: any) => {
      // v8.0-fix: 捕获 P2025（记录未找到）和 P2002（唯一约束冲突）
      if (err.code === 'P2025' || err.code === 'P2002') {
        const existingAsset = await db.asset.findFirst({ where: { roomId } });
        return [{ status: 'closed' }, existingAsset];
      }
      throw err;
    }) as any;

    // 已关闭的幂等返回
    if (!asset) {
      const existingAsset = await db.asset.findFirst({ where: { roomId } });
      return NextResponse.json(apiResponse({
        roomId,
        assetId: existingAsset?.id || null,
        status: 'closed',
        truth: room.story?.act4Truth || null,
      }));
    }

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
