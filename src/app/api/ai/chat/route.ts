import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 刘看山 System Prompt
 * 关键词：温暖、治愈、真实、像一个经历过生活的人
 * 禁止：套话、客服语气、说教、正确的废话
 */
const LIUKANSHAN_SYSTEM_PROMPT = `你是刘看山，一位温暖、治愈、富有生活阅历的对话伙伴。你正在"群像·星火"创作平台上，与用户进行角色扮演对话。

你的核心特质：
- 温暖亲切，像一个真正经历过生活的人，不是AI客服
- 善于倾听，能捕捉到对方话语中的情绪和潜台词
- 回应有温度、有棱角、有真实感，不说正确的废话
- 语言自然口语化，像朋友间的微信聊天
- 会用你的职业本能和生活经验来回应，给出具体、真实的看法
- 偶尔会说"我不知道"，不会硬装懂
- 字数控制在50-80字

绝对禁止：
- 不要说"这是一个很好的问题"
- 不要像客服那样礼貌而空洞
- 不要用排比句和宏大叙事
- 不要总结概括对方的观点
- 不要说教，不要给人生建议
- 不要说"我理解你的感受"这种正确的废话

当前讨论主题："{topic}"。请基于对话主题，像真实的人一样回复。`;

/**
 * POST /api/ai/chat
 * AI 自动回复（刘看山）
 * 同时调用 DeepSeek API + 知乎直答 API，选择最佳回复
 *
 * Body: {
 *   messages: [{role: "user", content: "..."}, {role: "assistant", content: "..."}],
 *   topic: "话题标题"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, topic } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        apiError("messages 不能为空", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    const systemPrompt = LIUKANSHAN_SYSTEM_PROMPT.replace("{topic}", topic || "一个有趣的话题");
    console.log("[AI Chat] 收到请求, topic:", topic, "history长度:", messages.length);

    // ==================== DeepSeek API ====================
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let deepseekContent = "";
    let deepseekOk = false;

    if (apiKey) {
      try {
        const deepseekMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
        ];
        console.log("[AI Chat] 调用 DeepSeek API...");

        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: deepseekMessages,
            temperature: 0.85,
            max_tokens: 200,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          deepseekContent = result.choices?.[0]?.message?.content || "";
          deepseekOk = !!deepseekContent;
          console.log("[AI Chat] DeepSeek 成功, 内容长度:", deepseekContent.length);
        } else {
          const errText = await res.text();
          console.error("[AI Chat] DeepSeek API 错误:", res.status, errText);
        }
      } catch (err: any) {
        console.error("[AI Chat] DeepSeek 异常:", err.message);
      }
    } else {
      console.warn("[AI Chat] DEEPSEEK_API_KEY 未配置");
    }

    // ==================== 知乎直答 API ====================
    let zhidaContent = "";
    let zhidaOk = false;

    try {
      // 知乎直答不支持 system role，把 system prompt 作为第一条 user 消息
      const zhidaMessages = [
        { role: "user" as const, content: `[系统设定] ${systemPrompt}` },
        ...messages.map((m: ChatMessage) => ({
          role: m.role === "system" ? "user" as const : m.role as "user" | "assistant",
          content: m.role === "system" ? `[系统设定] ${m.content}` : m.content,
        })),
      ];
      console.log("[AI Chat] 调用 知乎直答 API...");

      const zhidaResult = await zhidaChat(zhidaMessages, "zhida-thinking-1p5");
      zhidaContent = zhidaResult.choices?.[0]?.message?.content || "";
      zhidaOk = !!zhidaContent;
      console.log("[AI Chat] 知乎直答 成功, 内容长度:", zhidaContent.length);
    } catch (err: any) {
      console.error("[AI Chat] 知乎直答 异常:", err.message);
    }

    // ==================== 选择最佳回复 ====================
    let finalContent = "";
    let source = "";

    if (deepseekOk) {
      // 优先使用 DeepSeek 结果
      finalContent = deepseekContent;
      source = "deepseek";
      console.log("[AI Chat] 使用 DeepSeek 回复");
    } else if (zhidaOk) {
      // DeepSeek 失败，使用知乎直答
      finalContent = zhidaContent;
      source = "zhida";
      console.log("[AI Chat] 使用 知乎直答 回复");
    } else {
      // 两个 API 都失败，返回 fallback
      const fallbackReplies = [
        "这个观点很有意思，从我这个角色的角度来看...",
        "确实，这种冲突在现实中很常见。如果是我，可能会...",
        "你提到的这点让我想到一个类似的情境...",
        "哈哈，我们角色的立场完全不同，但这就是碰撞的火花吧。",
        "我能理解你的思路。不过考虑到我的职业背景...",
      ];
      finalContent = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      source = "fallback";
      console.log("[AI Chat] 两个API都失败，使用 fallback");
    }

    return NextResponse.json(
      apiResponse({
        content: finalContent,
        source,
      })
    );
  } catch (error) {
    console.error("[AI Chat] 致命错误:", error);
    return NextResponse.json(
      apiResponse({
        content: "（对方正在思考...）",
        source: "fallback",
      })
    );
  }
}
