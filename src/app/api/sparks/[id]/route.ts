import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/sparks/:id
 * v8.0: 火花详情 — 返回单条火花及关联房间的完整对白记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "无效的火花ID"), { status: 400 });
    }

    const asset = await db.asset.findUnique({
      where: { id },
      include: {
        brainhole: { select: { title: true, category: true, scenario: true } },
        room: {
          include: {
            participants: {
              select: { identity: true, userId: true, role: true },
            },
            messages: {
              orderBy: { createdAt: "asc" as const },
              select: {
                id: true,
                content: true,
                identity: true,
                senderId: true,
                roleCharacter: true,
                isSpark: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(apiError("NOT_FOUND", "火花不存在"), { status: 404 });
    }

    if (!asset.isPublic) {
      return NextResponse.json(apiError("FORBIDDEN", "该火花未公开"), { status: 403 });
    }

    const participants = asset.room?.participants || [];
    const identities = participants.map((p) => p.identity).filter(Boolean);
    const identityPair = identities.length >= 2
      ? `${identities[0]} × ${identities[1]}`
      : identities[0] || asset.identity || "匿名";

    const data = {
      id: asset.id,
      title: asset.title,
      content: asset.content || asset.summary || "",
      hotScore: asset.hotScore || 0,
      createdAt: asset.createdAt.toISOString(),
      identity: asset.identity || "匿名",
      identityPair,
      brainholeTitle: asset.brainhole?.title || "",
      brainholeCategory: asset.brainhole?.category || "",
      brainholeScenario: asset.brainhole?.scenario || "",
      roomId: asset.roomId,
      roomStatus: asset.room?.status,
      closedAt: asset.room?.closedAt?.toISOString() || null,
      messageCount: asset.messageCount || 0,
      sparkCount: asset.sparkCount || 0,
      messages: (asset.room?.messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        identity: m.identity,
        senderId: m.senderId,
        roleCharacter: m.roleCharacter,
        isSpark: m.isSpark,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(apiResponse(data));
  } catch (error) {
    console.error("[Spark Detail] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取火花详情失败"), { status: 500 });
  }
}
