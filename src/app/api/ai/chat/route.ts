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
import { WorkflowEngine } from "@/lib/ai/workflow-engine";
import { buildVectorIndex, forceKeywordMode } from "@/lib/ai/vector-store";

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

// v9.3-fix: 索引在后台异步构建，不阻塞请求
let indexBuilding = false;
let indexBuilt = false;
async function ensureIndex() {
  if (indexBuilt || indexBuilding) return;
  indexBuilding = true;
  try {
    // 后台构建，不 await（不阻塞请求）
    buildVectorIndex().then(() => {
      indexBuilt = true;
      indexBuilding = false;
    }).catch((err: any) => {
      console.warn("[AI Chat] 后台索引构建失败:", err.message);
      forceKeywordMode();
      indexBuilding = false;
    });
  } catch (err: any) {
    console.warn("[AI Chat] 索引启动失败:", err.message);
    indexBuilding = false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 启动后台索引构建（不阻塞）
    ensureIndex();

    const body = await request.json();
    const { messages, topic, persona: personaKey, context, state } = body;

    // v9.2 Agent: 如果前端传入了当前状态，注入到 systemPrompt 中辅助角色判断
    let stateHint = "";
    if (state && typeof state === "string") {
      stateHint = `\n\n【当前状态提示】${state}\n请结合上述状态切换规则，判断当前是否应处于此状态。如果用户的新消息表明状态需要切换，按新状态执行。`;
    }

    // v9.1 Agent: 获取当前用户ID（用于工具调用上下文）
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    console.log("[AI Chat] userId:", userId || "未登录");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "messages 不能为空"),
        { status: 400 }
      );
    }

    // v6.1: 支持多角色切换
    let effectivePersonaKey = personaKey || 'catalyst';
    const persona = getPersona(effectivePersonaKey);
    let systemPrompt = persona.systemPrompt;

    // v8.6-fix: 为 assistant_director / liukanshan 角色注入话题和上下文
    if ((effectivePersonaKey === 'liukanshan' || effectivePersonaKey === 'assistant_director') && context) {
      systemPrompt += `\n\n当前话题：「${topic || '一个有趣的话题'}」\n${context}\n\n硬性约束：你的每一次回复必须和当前话题直接相关。如果用户偏离话题，用一个简短的提问把话题拉回来。禁止聊与当前话题无关的内容。`;
    } else if (systemPrompt.includes('{topic}')) {
      systemPrompt = systemPrompt.replace("{topic}", topic || "一个有趣的话题");
    }

    // v9.2 Agent: 注入状态提示
    if (stateHint) {
      systemPrompt += stateHint;
    }

    console.log("[AI Chat] 使用角色:", persona.name, "key:", effectivePersonaKey);
    console.log("[AI Chat] 收到请求, topic:", topic, "history长度:", messages.length);

    // ==================== v9.3-fix: 工作流引擎 ====================
    let workflowToolSummary = "";
    let workflowToolCalls: ToolCall[] | undefined;
    let workflowToolResults: ToolResult[] | undefined;
    let workflowType = "chat";

    // 仅对 companion 角色启用工作流
    if (effectivePersonaKey === 'companion' && userId) {
      const lastUserMessage = messages
        .filter((m: ChatMessage) => m.role === 'user')
        .pop()?.content || "";

      if (lastUserMessage) {
        const workflowResult = await WorkflowEngine.process(lastUserMessage, {
          userId,
          messages: messages.filter((m: ChatMessage) => m.role !== 'system').map((m: ChatMessage) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        });

        workflowType = workflowResult.workflow;
        console.log(
          "[AI Chat] 工作流:", workflowResult.workflow,
          "step:", workflowResult.state.step,
          "waitUser:", workflowResult.shouldWaitUser
        );

        // 处理建议切换 persona（如疗愈模式）
        if (workflowResult.suggestedPersona) {
          effectivePersonaKey = workflowResult.suggestedPersona;
          const newPersona = getPersona(effectivePersonaKey);
          systemPrompt = newPersona.systemPrompt;
          console.log("[AI Chat] 工作流建议切换角色:", newPersona.name);
        }

        // 收集工具结果摘要
        if (workflowResult.toolSummary) {
          workflowToolSummary = workflowResult.toolSummary;
        }
        if (workflowResult.toolCalls) {
          workflowToolCalls = workflowResult.toolCalls;
        }
        if (workflowResult.toolResults) {
          workflowToolResults = workflowResult.toolResults;
        }
      }
    }

    // 注入工作流工具结果到 systemPrompt
    if (workflowToolSummary) {
      systemPrompt += `\n\n${workflowToolSummary}\n\n请基于以上信息，用刘看山的口吻自然地回复用户。不要暴露任何技术细节（如"检索结果""工具调用"等），像朋友一样说话。`;
    }

    // ==================== DeepSeek API ====================
    const apiKey = process.env.DEEPSEEK_API_KEY;
    let deepseekContent = "";
    let deepseekOk = false;

    if (apiKey) {
      try {
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
      const userMessages = messages.filter((m: ChatMessage) => m.role !== 'system');
      const zhidaMessages = [
        { role: "user" as const, content: `[系统设定] ${systemPrompt}` },
        ...userMessages.map((m: ChatMessage) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];
      console.log("[AI Chat] 调用 知乎直答 API...");

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
      finalContent = deepseekContent;
      source = "deepseek";
      console.log("[AI Chat] 使用 DeepSeek 回复");

      // v9.1 Agent: 仅对 companion 角色启用工具调用闭环
      if (effectivePersonaKey === 'companion' && userId) {
        const toolCall = parseToolCall(finalContent);
        if (toolCall) {
          console.log("[AI Chat] Agent 检测到工具调用:", toolCall.tool);
          const toolResult = await executeToolCall(toolCall, { userId });
          toolCalls = [toolCall];
          toolResults = [toolResult];

          const naturalReply = stripToolCall(finalContent) || finalContent;
          const checkpointInfo = toolResult.checkpoint
            ? `\n\n【检查点结果】\n${toolResult.checkpoint.checks.map((c: any) => `- ${c.name}: ${c.pass ? '✅' : '❌'} ${c.message}`).join('\n')}\n\n总体: ${toolResult.checkpoint.pass ? '检查通过，继续下一步' : '检查未通过，后端已尝试自动回退/重试，以上是最终结论'}`
            : '';
          const followUpMessages = [
            { role: "system" as const, content: systemPrompt },
            ...messages.filter((m: ChatMessage) => m.role !== 'system'),
            { role: "assistant" as const, content: naturalReply },
            {
              role: "user" as const,
              content: `你刚才调用了工具 "${toolCall.tool}"，执行结果如下：\n${JSON.stringify(toolResult.data || toolResult.error, null, 2)}${checkpointInfo}\n\n请基于这个已通过检查的结果，自然地回复用户。不要暴露检查点的技术细节，像正常人一样说话。`,
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
          }
        }
      }
    } else if (zhidaOk) {
      finalContent = zhidaContent;
      source = "zhida";
      console.log("[AI Chat] 使用 知乎直答 回复");
    } else {
      finalContent = getFallbackReply(effectivePersonaKey || 'catalyst');
      source = "fallback";
      console.log("[AI Chat] 两个API都失败，使用角色兜底:", effectivePersonaKey || 'catalyst');
    }

    const responsePayload: any = {
      content: finalContent,
      source,
      workflow: workflowType,
    };
    if (toolCalls) responsePayload.toolCalls = toolCalls;
    if (toolResults) responsePayload.toolResults = toolResults;
    if (workflowToolCalls) responsePayload.workflowToolCalls = workflowToolCalls;
    if (workflowToolResults) responsePayload.workflowToolResults = workflowToolResults;

    return NextResponse.json(apiResponse(responsePayload));
  } catch (error: any) {
    console.error("[AI Chat] 致命错误:", error);
    return NextResponse.json(
      apiError("INTERNAL_SERVER_ERROR", error instanceof Error ? error.message : "AI回复生成失败"),
      { status: 500 }
    );
  }
}
