import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";

/**
 * v6.0: AI 催化问题生成
 * DeepSeek + 知乎直答 双API，基于对话上下文动态生成开放性问题
 * POST /api/ai/catalyst
 * Body: { topic, messages, identity }
 */

const CATALYST_SYSTEM_PROMPT = `你是一个对话催化剂。基于给定的对话主题和上下文，生成3个简短、开放的追问问题。

要求：
- 每个问题不超过20字
- 问题要有针对性，引导对话深入
- 避免重复、避免封闭式问题（不要是/否问题）
- 语气轻松自然，像朋友之间的闲聊
- 如果对话已经比较深入，可以提一些"如果...会怎样"的假设性问题
- 基于对方的身份标签调整问题角度

只返回3个问题，每行一个，不要任何前缀、编号或解释。`;

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
        });
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
  } catch (error) {
    console.error("[Catalyst] Fatal error:", error);
    return NextResponse.json(apiResponse({
      prompts: [
        "能多说一点吗？",
        "如果是你，会怎么处理？",
        "当时你是什么感受？",
      ],
      source: "fallback",
    }));
  }
}
