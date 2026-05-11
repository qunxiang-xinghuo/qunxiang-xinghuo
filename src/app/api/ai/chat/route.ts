import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { zhidaChat } from "@/lib/zhihu-dev-api";
import { getPersona } from "@/lib/ai/personas";
import { getFallbackReply } from "@/lib/ai/fallback-replies";
import {
  parseToolCall,
  executeToolCall,
  stripToolCall,
  type ToolCall,
  type ToolResult,
} from "@/lib/ai/agent-tools";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * POST /api/ai/chat
 * AI 自动回复（刘看山）
 * 同时调用 DeepSeek API + 知乎直答 API，选择最佳回复
 *
 * Body: {
 *   messages: [{role: "user", content: "..."}, {role: "assistant", content: "..."}],
 *   topic: "话题标题",
 *   persona: "catalyst" | "creative" | "healer" | "mediator"  (可选，默认 catalyst)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, topic, persona: personaKey, context } = body;

    // v9.1 Agent: 获取当前用户ID（用于工具调用上下文）
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    console.log("[AI Chat] userId:", userId || "未登录");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "messages 不能为空"),
        { status: 400 }
      );
    }

    // v6.1: 支持多角色切换
    // v8.1-fix: liukanshan 角色使用 personas.ts 中的完整 systemPrompt，注入话题/上下文
    const persona = getPersona(personaKey);
    let systemPrompt = persona.systemPrompt;

    // v8.6-fix: 为 assistant_director / liukanshan 角色注入话题和上下文
    if ((personaKey === 'liukanshan' || personaKey === 'assistant_director') && context) {
      systemPrompt += `\n\n当前话题：「${topic || '一个有趣的话题'}」\n${context}\n\n硬性约束：你的每一次回复必须和当前话题直接相关。如果用户偏离话题，用一个简短的提问把话题拉回来。禁止聊与当前话题无关的内容。`;
    } else if (systemPrompt.includes('{topic}')) {
      systemPrompt = systemPrompt.replace("{topic}", topic || "一个有趣的话题");
    }

    console.log("[AI Chat] 使用角色:", persona.name, "key:", personaKey || "catalyst");
    console.log("[AI Chat] 收到请求, topic:", topic, "history长度:", messages.length);

    // ==================== DeepSeek API ====================
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let deepseekContent = "";
    let deepseekOk = false;

    if (apiKey) {
      try {
        // v8.1-fix: 过滤掉前端传来的 system message，避免重复
        const userMessages = messages.filter((m: ChatMessage) => m.role !== 'system');
        const deepseekMessages = [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ];
        console.log("[AI Chat] 调用 DeepSeek API...");

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
            messages: deepseekMessages,
            temperature: 0.85,
            max_tokens: 200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

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
      // v8.1-fix: 过滤掉前端传来的 system message，避免重复
      const userMessages = messages.filter((m: ChatMessage) => m.role !== 'system');
      const zhidaMessages = [
        { role: "user" as const, content: `[系统设定] ${systemPrompt}` },
        ...userMessages.map((m: ChatMessage) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];
      console.log("[AI Chat] 调用 知乎直答 API...");

      // v7.0-test17: 知乎直答添加15秒超时
      const zhidaController = new AbortController();
      const zhidaTimeout = setTimeout(() => zhidaController.abort(), 15000);
      const zhidaResult = await zhidaChat(zhidaMessages, "zhida-thinking-1p5", zhidaController.signal);
      clearTimeout(zhidaTimeout);
      zhidaContent = zhidaResult.choices?.[0]?.message?.content || "";
      zhidaOk = !!zhidaContent;
      console.log("[AI Chat] 知乎直答 成功, 内容长度:", zhidaContent.length);
    } catch (err: any) {
      console.error("[AI Chat] 知乎直答 异常:", err.message);
    }

    // ==================== 选择最佳回复 ====================
    let finalContent = "";
    let source = "";
    let toolCalls: ToolCall[] | undefined;
    let toolResults: ToolResult[] | undefined;

    if (deepseekOk) {
      // 优先使用 DeepSeek 结果
      finalContent = deepseekContent;
      source = "deepseek";
      console.log("[AI Chat] 使用 DeepSeek 回复");

      // v9.1 Agent 阶段4: 仅对 companion 角色启用工具调用闭环
      if (personaKey === 'companion' && userId) {
        const toolCall = parseToolCall(finalContent);
        if (toolCall) {
          console.log("[AI Chat] Agent 检测到工具调用:", toolCall.tool);
          const toolResult = await executeToolCall(toolCall, { userId });
          toolCalls = [toolCall];
          toolResults = [toolResult];

          // 二次调用 DeepSeek：将工具结果回传，让 AI 基于结果生成最终回复
          const naturalReply = stripToolCall(finalContent) || finalContent;
          const followUpMessages = [
            { role: "system" as const, content: systemPrompt },
            ...messages.filter((m: ChatMessage) => m.role !== 'system'),
            { role: "assistant" as const, content: naturalReply },
            {
              role: "user" as const,
              content: `你刚才调用了工具 "${toolCall.tool}"，执行结果如下：\n${JSON.stringify(toolResult.data || toolResult.error, null, 2)}\n\n请基于这个结果，自然地回复用户。如果工具执行失败，如实告诉用户并建议其他方案。`,
            },
          ];

          try {
            const controller2 = new AbortController();
            const timeout2 = setTimeout(() => controller2.abort(), 15000);
            const res2 = await fetch("https://api.deepseek.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: followUpMessages,
                temperature: 0.85,
                max_tokens: 200,
              }),
              signal: controller2.signal,
            });
            clearTimeout(timeout2);

            if (res2.ok) {
              const result2 = await res2.json();
              const secondContent = result2.choices?.[0]?.message?.content || "";
              if (secondContent) {
                finalContent = secondContent;
                console.log("[AI Chat] Agent 二次调用成功, 内容长度:", secondContent.length);
              }
            } else {
              console.error("[AI Chat] Agent 二次调用失败:", res2.status);
            }
          } catch (err: any) {
            console.error("[AI Chat] Agent 二次调用异常:", err.message);
            // 二次调用失败时，保留第一次回复（已包含工具调用 JSON）
          }
        }
      }
    } else if (zhidaOk) {
      // DeepSeek 失败，使用知乎直答
      finalContent = zhidaContent;
      source = "zhida";
      console.log("[AI Chat] 使用 知乎直答 回复");
    } else {
      // v8.6-fix: 两个 API 都失败，按角色返回兜底回复
      finalContent = getFallbackReply(personaKey || 'catalyst');
      source = "fallback";
      console.log("[AI Chat] 两个API都失败，使用角色兜底:", personaKey || 'catalyst');
    }

    const responsePayload: any = {
      content: finalContent,
      source,
    };
    if (toolCalls) responsePayload.toolCalls = toolCalls;
    if (toolResults) responsePayload.toolResults = toolResults;

    return NextResponse.json(apiResponse(responsePayload));
  } catch (error: any) {
    console.error("[AI Chat] 致命错误:", error);
    return NextResponse.json(
      apiError("INTERNAL_SERVER_ERROR", error instanceof Error ? error.message : "AI回复生成失败"),
      { status: 500 }
    );
  }
}
