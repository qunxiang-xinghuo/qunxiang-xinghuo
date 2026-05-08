import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/stories
 * 故事列表（解密故事）
 * 返回：标题、时代背景、简介、角色数。不返回 act 内容。
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);

    const stories = await db.story.findMany({
      where: {
        status: { in: ["open", "recruiting", "approved"] },
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

    // v8.2: 已登录时查询用户点赞状态
    let likedStoryIds = new Set<string>();
    if (userId) {
      const likes = await db.storyLike.findMany({
        where: { userId, storyId: { in: stories.map((s) => s.id) } },
        select: { storyId: true },
      });
      likedStoryIds = new Set(likes.map((l) => l.storyId));
    }

    const list = stories.map((s) => ({
      id: s.id,
      title: s.title,
      eraBackground: s.eraBackground || "",
      storySummary: s.storySummary || "",
      hotScore: s.hotScore || 0,
      maxCharacters: s.maxCharacters || 2,
      roleCount: s._count.roles,
      liked: likedStoryIds.has(s.id),
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

/**
 * POST /api/stories
 * 创建新故事（需登录）
 * 流程：draft → pending_review → approved → recruiting
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const { title, eraBackground, storySummary, category, maxCharacters, roles } = body;

    // 校验
    if (!title?.trim() || title.trim().length < 2 || title.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "标题需 2-100 字"), { status: 400 });
    }
    if (!eraBackground?.trim() || eraBackground.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "时代背景不能为空且不超过100字"), { status: 400 });
    }
    if (!storySummary?.trim() || storySummary.trim().length < 20 || storySummary.length > 2000) {
      return NextResponse.json(apiError("BAD_REQUEST", "故事简介需 20-2000 字"), { status: 400 });
    }
    if (!Array.isArray(roles) || roles.length < 2 || roles.length > 6) {
      return NextResponse.json(apiError("BAD_REQUEST", "角色数需 2-6 个"), { status: 400 });
    }
    const validCategories = ['古风', '民国', '现代', '悬疑', '科幻', '职场', 'general'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(apiError("BAD_REQUEST", "无效的分类"), { status: 400 });
    }
    for (const r of roles) {
      if (!r.name?.trim() || r.name.length > 50) {
        return NextResponse.json(apiError("BAD_REQUEST", "角色名称需 1-50 字"), { status: 400 });
      }
      if (!r.description?.trim() || r.description.length > 500) {
        return NextResponse.json(apiError("BAD_REQUEST", "角色设定需 1-500 字"), { status: 400 });
      }
      if (!r.openingInfo?.trim() || r.openingInfo.length > 500) {
        return NextResponse.json(apiError("BAD_REQUEST", "开场信息需 1-500 字"), { status: 400 });
      }
    }

    // 创建故事 + 角色（事务）
    const story = await db.story.create({
      data: {
        title: title.trim(),
        eraBackground: eraBackground.trim(),
        storySummary: storySummary.trim(),
        maxCharacters: maxCharacters || roles.length,
        creatorId: userId,
        status: "pending_review", // 提交后进入审核队列
        // 角色
        roles: {
          create: roles.map((r: any, i: number) => ({
            name: r.name.trim(),
            description: r.description.trim(),
            openingInfo: r.openingInfo.trim(),
            sortOrder: r.sortOrder ?? i,
          })),
        },
      },
      include: { roles: true },
    });

    return NextResponse.json(apiResponse({
      id: story.id,
      title: story.title,
      status: story.status,
      message: "故事已提交审核",
    }));
  } catch (error: any) {
    console.error("[Stories Create] Error:", error);
    console.error("[Stories Create] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建失败，请稍后重试"), { status: 500 });
  }
}
