import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

// GET: 获取当前用户的疗愈会话列表
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const sessions = await db.healingSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(apiResponse(sessions.map((s) => ({
      id: s.id,
      status: s.status,
      title: s.title,
      topic: s.topic,
      isPublic: s.isPublic,
      messageCount: s._count.messages,
      createdAt: s.createdAt,
      closedAt: s.closedAt,
    }))));
  } catch (error: any) {
    console.error("[Healing GET] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取会话列表失败"), { status: 500 });
  }
}

// POST: 创建新的疗愈会话
export async function POST(request: NextRequest) {
  try {
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const createSessionSchema = z.object({
      topic: z.string().max(500, "话题不能超过500字").optional(),
    });

    const body = await request.json().catch(() => ({}));
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数格式错误"), { status: 400 });
    }
    const { topic } = validation.data;

    // v7.0-test15: 限制单个用户的活跃会话数量
    const activeCount = await db.healingSession.count({
      where: { userId, status: "active" },
    });
    if (activeCount >= 10) {
      return NextResponse.json(apiError("LIMIT_EXCEEDED", "最多只能有10个进行中的疗愈会话"), { status: 429 });
    }

    // 确保用户存在
    await db.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, name: "疗愈用户", email: `${userId}@guest.local` },
    });

    // 创建会话
    const healingSession = await db.healingSession.create({
      data: {
        userId,
        status: "active",
        title: topic ? `${topic.slice(0, 20)}...` : "新的对话",
        topic: topic || null,
      },
    });

    // 刘看山发送第一条问候消息（加密存储）
    const welcomeContent = "今天，有什么想和我聊聊的吗？";
    await db.healingMessage.create({
      data: {
        sessionId: healingSession.id,
        senderId: "agent_healer",
        content: encrypt(welcomeContent),
        identity: "刘看山·疗愈师",
        isAi: true,
      },
    });

    return NextResponse.json(apiResponse({
      sessionId: healingSession.id,
      title: healingSession.title,
    }), { status: 201 });
  } catch (error: any) {
    console.error("[Healing POST] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建疗愈会话失败"), { status: 500 });
  }
}
