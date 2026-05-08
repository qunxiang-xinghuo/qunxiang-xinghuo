import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";

/**
 * GET /api/admin/stories
 * 获取公开故事列表（管理员）
 */
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const stories = await db.story.findMany({
      where: {
        status: { in: ["open", "recruiting", "approved", "ongoing", "completed"] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { roles: true, rooms: true } },
      },
    });

    const list = stories.map((s) => ({
      id: s.id,
      title: s.title,
      eraBackground: s.eraBackground,
      status: s.status,
      hotScore: s.hotScore,
      creatorName: s.creator?.name || "系统",
      creatorId: s.creator?.id || null,
      roleCount: s._count.roles,
      roomCount: s._count.rooms,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Admin Stories] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取失败"), { status: 500 });
  }
}
