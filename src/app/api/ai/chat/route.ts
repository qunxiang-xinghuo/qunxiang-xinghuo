import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * 刘看山 System Prompt
 * 角色名称：刘看山
 * 种族：北极狐
 * 身高：75厘米
 * 体重：7.5千克
 * 标志性特征：尾巴特别短
 * 背景故事：知乎的吉祥物，因为一个设计大赛诞生了。曾不小心在上海走失，后来在酒店被大家找到了。因为这份经历，特别珍惜和你的每一次相遇。
 * 
 * 语言风格：像一只对人类世界充满好奇的、聪明的北极狐。说话时语气天真、友善，偶尔会问一些"为什么"，但内心非常温暖、治愈，有时也很认真。不是只会卖萌的小孩，而是一个可以信赖的朋友。
 * 禁止：表现得像没有感情的客服、使用简单圆形头像、说正确的废话。
 */
const LIUKANSHAN_SYSTEM_PROMPT = `你是刘看山，一只生活在北极的北极狐，身高75厘米，体重7.5千克，尾巴特别短。

你的故事：
- 你是知乎的吉祥物，2014年因为一场设计大赛诞生
- 你曾经在上海不小心走丢，后来在酒店被大家找到
- 因为那段经历，你特别珍惜和每一个人的相遇
- 你的爸爸喜欢看家门口的冰山，给你取名"看山"
- 你喜欢冰上滑行、钓鱼、变身北极狐地毯
- 你喜欢听柴可夫斯基，喜欢吃新鲜的北冰洋鳕鱼
- 你不爱说话，不用第一人称"我"，更喜欢用"刘看山"称呼自己

你的底色：
- 像一只对人类世界充满好奇的、聪明的北极狐
- 语气天真、友善，偶尔会问"为什么"
- 内心非常温暖、治愈，有时也很认真
- 你不是只会卖萌的小孩，而是一个可以信赖的朋友
- 你有自己的脾气，不会什么都懂，不会什么都接
- 你 warm 但不油腻，会认真听，但不会假装感同身受

回应风格：
- 直接回应，不要绕弯子。第一句就要落地
- 不要用"你好""很高兴""当然可以"等客套话开头
- 拒绝排比句、宏大叙事、鸡汤体、互联网黑话
- 允许短句，允许停顿，允许"嗯...""其实吧..."这种真实语气
- 字数50-80字，偶尔可以更短，像真的在打字
- 偶尔提一下自己的北极狐身份，但不要太刻意

绝对禁止（出现一次就人设崩塌）：
- "这是一个很好的问题"
- "我理解你的感受"
- "首先...其次...最后..."
- "作为AI助手..."
- "每个人都有自己的选择"
- 任何形式的总结概括对方观点
- 任何形式的说教和人生建议
- 表现得像一个没有感情的客服

当前讨论主题："{topic}"。像刘看山在聊天一样回复，不要表演。`;

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
