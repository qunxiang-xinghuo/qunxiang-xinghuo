import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";

/**
 * 调用刘看山 Agent 进行内容审核
 * v8.1: 新增编辑审核流程
 */
async function liukanshanReview(content: string): Promise<{
  approved: boolean;
  summary?: string;
  reason?: string;
}> {
  const reviewPrompt = `你现在是一位资深的内容编辑，负责审核用户生成的对白。

请检查以下对话中是否包含不文明用语、人身攻击、色情低俗、政治敏感、广告引流或其他违规内容。

如果内容健康、有价值，请返回 JSON:
{ "approved": true, "summary": "用一句话总结这段对话的亮点（20字以内）" }

如果内容违规，请返回 JSON:
{ "approved": false, "reason": "简要说明违规原因" }

只返回JSON，不要任何其他解释或格式标记。

对话内容：
${content.slice(0, 3000)}`;

  // 优先调用 DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一个严格但公正的内容审核编辑。只输出JSON格式。" },
            { role: "user", content: reviewPrompt },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        const text = result.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.approved === "boolean") {
            console.log("[Room Finish] DeepSeek 审核结果:", parsed.approved, parsed.summary || parsed.reason);
            return {
              approved: parsed.approved,
              summary: parsed.summary,
              reason: parsed.reason,
            };
          }
        }
      }
    } catch (err: any) {
      console.error("[Room Finish] DeepSeek 审核异常:", err.message);
    }
  }

  // DeepSeek 失败，尝试知乎直答
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const zhidaResult = await zhidaChat(
      [
        { role: "user", content: `[系统设定] 你是一个严格但公正的内容审核编辑。只输出JSON格式。` },
        { role: "user", content: reviewPrompt },
      ],
      "zhida-thinking-1p5",
      controller.signal
    );
    clearTimeout(timeoutId);

    const text = zhidaResult.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.approved === "boolean") {
        console.log("[Room Finish] 知乎直答 审核结果:", parsed.approved, parsed.summary || parsed.reason);
        return {
          approved: parsed.approved,
          summary: parsed.summary,
          reason: parsed.reason,
        };
      }
    }
  } catch (err: any) {
    console.error("[Room Finish] 知乎直答 审核异常:", err.message);
  }

  // 两个 API 都失败，默认不通过（安全优先）
  console.warn("[Room Finish] 审核 API 全部失败，默认私密保存");
  return { approved: false, reason: "审核服务暂时不可用，内容已私密保存" };
}

/**
 * POST /api/rooms/:roomId/finish
 * 结束故事对白房间，保存为资产，揭晓谜底
 * v8.1: 新增刘看山编辑审核流程
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { roomId } = await params;

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        story: true,
        messages: { orderBy: { createdAt: "asc" } },
        participants: true,
      },
    });

    if (!room) {
      return NextResponse.json(apiError("NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 检查是否是参与者（且是演员角色，不是观众）
    const me = room.participants.find((p) => p.userId === userId);
    if (!me) {
      return NextResponse.json(apiError("FORBIDDEN", "不是房间参与者"), { status: 403 });
    }
    if (me.role === 'spectator') {
      return NextResponse.json(apiError("FORBIDDEN", "观众不能结束对白"), { status: 403 });
    }

    // v8.0-fix: 幂等检查移入 transaction，避免并发竞态
    const content = room.messages.map((m) => `${m.identity}: ${m.content}`).join("\n");

    // v8.1: 刘看山编辑审核（在关闭房间后、保存资产前）
    let reviewResult: { approved: boolean; summary?: string; reason?: string } | null = null;
    if (room.messages.length > 0) {
      reviewResult = await liukanshanReview(content);
    }

    const isPublic = reviewResult?.approved ?? false;
    const summary = reviewResult?.summary || reviewResult?.reason || room.story?.storySummary || "";

    const [updatedRoom, asset] = await db.$transaction([
      db.room.update({
        where: { id: roomId, status: { not: "closed" } },
        data: { status: "closed", closedAt: new Date() },
      }),
      db.asset.create({
        data: {
          userId,
          roomId,
          title: room.story?.title || "故事对白",
          summary,
          content: content.slice(0, 5000),
          identity: me.identity || "匿名",
          messageCount: room.messages.length,
          sparkCount: room.messages.filter((m) => m.isSpark).length,
          isPublic,
        },
      }),
    ]).catch(async (err: any) => {
      // v8.0-fix: 捕获 P2025（记录未找到）和 P2002（唯一约束冲突）
      if (err.code === 'P2025' || err.code === 'P2002') {
        const existingAsset = await db.asset.findFirst({ where: { roomId } });
        return [{ status: 'closed' }, existingAsset];
      }
      throw err;
    }) as any;

    // 已关闭的幂等返回
    if (!asset) {
      const existingAsset = await db.asset.findFirst({ where: { roomId } });
      return NextResponse.json(apiResponse({
        roomId,
        assetId: existingAsset?.id || null,
        status: 'closed',
        truth: room.story?.act4Truth || null,
      }));
    }

    return NextResponse.json(apiResponse({
      roomId,
      assetId: asset.id,
      status: "closed",
      truth: room.story?.act4Truth || null,
      review: reviewResult,
    }));
  } catch (error: any) {
    console.error("[Room Finish] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "结束失败"), { status: 500 });
  }
}
