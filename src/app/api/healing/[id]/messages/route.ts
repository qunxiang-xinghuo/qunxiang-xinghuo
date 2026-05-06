import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { encrypt, decrypt } from "@/lib/crypto";

// GET: 获取会话消息（解密后返回）
// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // 验证会话所有权
    const healingSession = await db.healingSession.findUnique({
      where: { id: sessionId },
    });
    if (!healingSession || healingSession.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权访问此会话"), { status: 403 });
    }

    const messages = await db.healingMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    // 解密后返回
    const decryptedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      content: decrypt(msg.content),
      identity: msg.identity,
      isAi: msg.isAi,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json(apiResponse(decryptedMessages));
  } catch (error: any) {
    console.error("[Healing Messages GET] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取消息失败"), { status: 500 });
  }
}

// POST: 发送消息（加密后存储）+ 触发AI回复
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // 验证会话所有权
    const healingSession = await db.healingSession.findUnique({
      where: { id: sessionId },
    });
    if (!healingSession || healingSession.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权访问此会话"), { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { content, identity = "我" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(apiError("BAD_REQUEST", "消息内容不能为空"), { status: 400 });
    }

    // 保存用户消息（加密）
    const userMsg = await db.healingMessage.create({
      data: {
        sessionId,
        senderId: userId,
        content: encrypt(content.trim()),
        identity,
        isAi: false,
      },
    });

    // 异步生成AI回复（不阻塞响应）
    // v7.0-test12: 获取最近10条消息作为上下文（先desc取最近，再reverse恢复顺序）
    const history = await db.healingMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const messagesForAI = history.reverse().map((msg) => ({
      role: msg.isAi ? ("assistant" as const) : ("user" as const),
      content: decrypt(msg.content),
    }));

    // 调用AI API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const aiRes = await fetch(`${request.nextUrl.origin}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForAI,
          topic: healingSession.topic || "个人疗愈对话",
          persona: "healer",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const aiResult = await aiRes.json();
      const aiContent = aiResult.data?.content || "嗯，我能感受到你话里的分量。愿意多说说吗？";

      // 保存AI回复（加密）
      await db.healingMessage.create({
        data: {
          sessionId,
          senderId: "agent_healer",
          content: encrypt(aiContent),
          identity: "刘看山·疗愈师",
          isAi: true,
        },
      });
    } catch (aiErr: any) {
      console.error("[Healing AI] 回复生成失败:", aiErr.message);
      // AI失败不影响用户消息保存
    }

    return NextResponse.json(apiResponse({
      messageId: userMsg.id,
      content: content.trim(),
    }), { status: 201 });
  } catch (error: any) {
    console.error("[Healing Messages POST] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "发送消息失败"), { status: 500 });
  }
}
