import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse } from "@/lib/utils";

/**
 * GET /api/stories
 * 故事列表（解密故事）
 * 返回：标题、时代背景、简介、角色数。不返回 act 内容。
 */
export async function GET(request: NextRequest) {
  try {
    const stories = await db.story.findMany({
      where: {
        status: { in: ["open", "recruiting"] },
        act1Reveal: { not: null }, // v8.0: 只返回有解密内容的
      },
      orderBy: [{ hotScore: "desc" as const }, { createdAt: "desc" as const }],
      include: {
        roles: {
          select: { id: true, name: true, claimedBy: true, openingInfo: true },
          orderBy: { sortOrder: "asc" as const },
        },
        _count: { select: { roles: true } },
      },
    });

    const list = stories.map((s) => ({
      id: s.id,
      title: s.title,
      eraBackground: s.eraBackground || "",
      storySummary: s.storySummary || "",
      hotScore: s.hotScore || 0,
      maxCharacters: s.maxCharacters || 2,
      roleCount: s._count.roles,
      roles: s.roles.map((r) => ({
        id: r.id,
        name: r.name,
        openingInfo: r.openingInfo || "",
        claimed: !!r.claimedBy,
      })),
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Stories List] Error:", error);
    return NextResponse.json(apiResponse({ list: [] }));
  }
}
