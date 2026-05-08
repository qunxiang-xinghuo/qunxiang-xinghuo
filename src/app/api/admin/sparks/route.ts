import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";

/**
 * GET /api/admin/sparks
 * 获取公开火花列表（管理员）
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const sparks = await db.asset.findMany({
      where: { isPublic: true, deletedByUser: false },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true } },
        brainhole: { select: { title: true } },
        room: { select: { type: true, status: true } },
      },
    });

    const list = sparks.map((s) => ({
      id: s.id,
      title: s.brainhole?.title || s.title,
      summary: s.summary || "",
      hotScore: s.hotScore,
      messageCount: s.messageCount,
      ownerName: s.user.name || "匿名",
      ownerId: s.user.id,
      roomType: s.room?.type || null,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Admin Sparks] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取失败"), { status: 500 });
  }
}
