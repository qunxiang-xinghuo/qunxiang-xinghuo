import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET /api/stories - 获取故事列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const stories = await db.story.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        director: { select: { id: true, name: true } },
        roles: {
          select: { id: true, name: true, claimedBy: true, claimStatus: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // 格式化响应
    const formatted = stories.map((s) => ({
      id: s.id,
      title: s.title,
      worldview: s.worldview,
      conflict: s.conflict,
      status: s.status,
      director: s.director,
      maxActors: s.maxActors,
      totalRoles: s.roles.length,
      claimedRoles: s.roles.filter((r) => r.claimedBy).length,
      approvedRoles: s.roles.filter((r) => r.claimStatus === 'approved').length,
      messageCount: s._count.messages,
      createdAt: s.createdAt,
    }));

    return NextResponse.json(apiResponse({ stories: formatted }));
  } catch (error: any) {
    console.error("[Stories GET] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取故事列表失败"), { status: 500 });
  }
}

// POST /api/stories - 创建新故事
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || `guest-${Date.now()}`;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const { title, worldview, conflict, roles, maxActors = 5, minActors = 2 } = body;

    if (!title || !worldview || !conflict) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少必要参数: title, worldview, conflict"), { status: 400 });
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(apiError("BAD_REQUEST", "至少需要一个角色"), { status: 400 });
    }

    // 确保用户在User表中存在
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "故事发起人",
        email: `${userId}@guest.local`,
      },
    });

    // 创建故事 + 角色 + 第一章节
    const story = await db.story.create({
      data: {
        title,
        worldview,
        conflict,
        directorId: userId,
        maxActors,
        minActors: Math.max(2, minActors),
        roles: {
          create: roles.map((r: any) => ({
            name: r.name,
            description: r.description || "",
            requirements: r.requirements || null,
          })),
        },
        chapters: {
          create: {
            title: "第一章：序章",
            goal: "引入世界观和主要角色",
            order: 0,
            status: "active",
          },
        },
      },
      include: {
        roles: true,
        chapters: true,
      },
    });

    return NextResponse.json(apiResponse({ story }), { status: 201 });
  } catch (error: any) {
    console.error("[Stories POST] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建故事失败: " + error.message), { status: 500 });
  }
}
