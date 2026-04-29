import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * POST /api/ai/chat
 * AI 自动回复（双人模式用）
 *
 * Body: {
 *   messages: [{role: "system", content: "..."}, {role: "user", content: "..."}],
 *   model?: "deepseek-chat"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = "deepseek-chat" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        apiError("messages 不能为空", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      const fallbackReplies = [
        "这个观点很有意思，从我这个角色的角度来看...",
        "确实，这种冲突在现实中很常见。如果是我，可能会...",
        "你提到的这点让我想到一个类似的情境...",
        "哈哈，我们角色的立场完全不同，但这就是碰撞的火花吧。",
        "我能理解你的思路。不过考虑到我的职业背景...",
      ];
      return NextResponse.json(
        apiResponse({
          content: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
          source: "fallback",
        })
      );
    }

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("DeepSeek API 错误:", errorText);
      throw new Error("AI 服务暂时不可用");
    }

    const result = await res.json();
    const content = result.choices?.[0]?.message?.content || "";

    return NextResponse.json(
      apiResponse({
        content,
        source: "deepseek",
      })
    );
  } catch (error) {
    console.error("AI 聊天错误:", error);
    return NextResponse.json(
      apiResponse({
        content: "（对方正在思考...）",
        source: "fallback",
      })
    );
  }
}
