import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";
import { getPersona } from "@/lib/ai/personas";

/**
 * v6.0: AI 催化问题生成
 * DeepSeek + 知乎直答 双API，基于对话上下文动态生成开放性问题
 * POST /api/ai/catalyst
 * Body: { topic, messages, identity }
 */

const CATALYST_SYSTEM_PROMPT = getPersona('catalyst').systemPrompt;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, messages = [], identity } = body;

    const topicStr = topic || "一个有趣的话题";
    const identityStr = identity || "普通用户";

    // 构建上下文
    const contextMessages = messages.length > 0
      ? messages.map((m: any) => `${m.role === 'user' ? '用户' : '对方'}: ${m.content}`).join("\n")
      : "对话刚开始";

    const prompt = `主题：${topicStr}
用户身份：${identityStr}

对话上下文：
${contextMessages}

请生成3个能推动对话深入的开放性问题：`;

    let prompts: string[] = [];
    let source = "";

    // ==================== DeepSeek ====================
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: CATALYST_SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
            temperature: 0.9,
            max_tokens: 150,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const result = await res.json();
          const content = result.choices?.[0]?.message?.content || "";
          prompts = content.split("\n").filter((s: string) => s.trim().length > 0).slice(0, 3);
          source = "deepseek";
        }
      } catch (err: any) {
        console.error("[Catalyst] DeepSeek error:", err.message);
      }
    }

    // ==================== 知乎直答 fallback ====================
    if (prompts.length === 0) {
      try {
        const zhidaResult = await zhidaChat([
          { role: "user", content: `[系统设定] ${CATALYST_SYSTEM_PROMPT}\n\n${prompt}` },
        ], "zhida-thinking-1p5");
        const content = zhidaResult.choices?.[0]?.message?.content || "";
        prompts = content.split("\n").filter((s: string) => s.trim().length > 0).slice(0, 3);
        source = "zhida";
      } catch (err: any) {
        console.error("[Catalyst] Zhida error:", err.message);
      }
    }

    // ==================== Fallback ====================
    if (prompts.length === 0) {
      prompts = [
        "如果换一个角度看，你会发现什么？",
        "如果是你，接下来会怎么做？",
        "能再多说一点当时的感受吗？",
      ];
      source = "fallback";
    }

    // 清理问题文本（去掉序号、引号等）
    prompts = prompts.map((p) => {
      return p.replace(/^\d+[.、]\s*/, "").replace(/^[""']|[""']$/g, "").trim();
    }).filter(p => p.length > 0);

    return NextResponse.json(apiResponse({ prompts, source }));
  } catch (error: any) {
    console.error("[Catalyst] Fatal error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error instanceof Error ? error.message : "AI催化生成失败"), { status: 500 });
  }
}
