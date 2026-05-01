import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/assets — 获取当前用户的对白资产
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const assets = await db.asset.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        brainhole: {
          select: { title: true, scenario: true },
        },
      },
    });

    return NextResponse.json(apiResponse({ assets }));
  } catch (error) {
    console.error("[Assets GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取资产失败"), { status: 500 });
  }
}

// POST /api/assets — 从房间创建对白资产
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(apiError("VALIDATION_ERROR", "缺少房间ID"), { status: 400 });
    }

    // 检查资产是否已存在
    const existing = await db.asset.findFirst({
      where: { roomId, userId: session.user.id },
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

    // 计算火花数
    const sparkCount = room.messages.filter((m: any) => m.isSpark).length;

    // 创建资产
    const asset = await db.asset.create({
      data: {
        userId: session.user.id,
        roomId,
        brainholeId: room.brainholeId,
        title: room.brainhole?.title || "无主题对白",
        summary: room.brainhole?.scenario || "",
        messageCount: room.messages.length,
        sparkCount,
        isPublic: false,
      },
    });

    return NextResponse.json(apiResponse({ asset }), { status: 201 });
  } catch (error) {
    console.error("[Assets POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建资产失败"), { status: 500 });
  }
}
