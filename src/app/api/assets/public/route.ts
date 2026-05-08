import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/assets/public — 获取广场素材（公开的对白资产）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const assets = await db.asset.findMany({
      where: { isPublic: true, deletedByUser: false },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, username: true } },
        brainhole: { select: { title: true, scenario: true } },
      },
    });

    return NextResponse.json(apiResponse({ assets }));
  } catch (error) {
    console.error("[Assets Public GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取广场素材失败"), { status: 500 });
  }
}
