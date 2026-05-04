import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/assets — 获取当前用户的对白资产（火花）
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json(apiResponse({ assets: [] }));
    }

    const assets = await db.asset.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: "desc" },
      include: {
        brainhole: { select: { title: true, scenario: true } },
      },
    });

    return NextResponse.json(apiResponse({ assets }));
  } catch (error) {
    console.error("[Assets GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取资产失败"), { status: 500 });
  }
}

// POST /api/assets — 从房间创建对白资产（火花），自动存入
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;

    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(apiError("VALIDATION_ERROR", "缺少房间ID"), { status: 400 });
    }

    // 检查资产是否已存在
    const existing = await db.asset.findFirst({
      where: { roomId, userId: effectiveUserId },
    });
    if (existing) {
      return NextResponse.json(apiResponse({ asset: existing, message: "资产已存在" }));
    }

    // 获取房间信息
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        brainhole: { select: { title: true, scenario: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 找到第一条用户消息作为content
    const userMessages = room.messages.filter((m: any) => m.senderId === effectiveUserId && !m.isAiPrompt);
    const firstUserMsg = userMessages[0]?.content || "";
    const sparkMessages = room.messages.filter((m: any) => m.isSpark);
    const firstSparkMsg = sparkMessages[0]?.content || firstUserMsg;

    // 找到用户身份
    const participant = await db.roomParticipant.findFirst({
      where: { roomId, userId: effectiveUserId },
      select: { identity: true },
    });

    // 计算火花数
    const sparkCount = room.messages.filter((m: any) => m.isSpark).length;

    // 创建资产（默认私密）
    const asset = await db.asset.create({
      data: {
        userId: effectiveUserId,
        roomId,
        brainholeId: room.brainholeId,
        title: room.brainhole?.title || "无主题对白",
        summary: room.brainhole?.scenario || "",
        content: firstSparkMsg.slice(0, 200), // 截取前200字作为内容预览
        identity: participant?.identity || "匿名",
        messageCount: room.messages.length,
        sparkCount,
        isPublic: false,
        hotScore: sparkCount * 10 + room.messages.length, // 热度计算
      },
    });

    return NextResponse.json(apiResponse({ asset }), { status: 201 });
  } catch (error) {
    console.error("[Assets POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建资产失败"), { status: 500 });
  }
}
