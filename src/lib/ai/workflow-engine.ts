/**
 * v9.3-fix: 工作流引擎（工具执行层）
 *
 * 职责：
 * 1. 根据意图类型执行对应工具调用（故事/脑洞/检索）
 * 2. 从消息历史中推断用户选择（不依赖前端状态）
 * 3. 返回工具执行结果，由上层（chat/route）调用 DeepSeek 生成自然语言
 * 4. 不直接生成回复文案 —— 避免硬编码、保持刘看山人设
 */

import { RAGEngine, type WorkflowType, type RAGResult } from "./rag-engine";
import {
  executeToolCall,
  type ToolCall,
  type ToolResult,
} from "./agent-tools";

// ── 类型定义 ──

export interface WorkflowContext {
  userId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface WorkflowState {
  type: WorkflowType;
  step: string;
  status: "running" | "waiting_user" | "completed" | "failed";
}

export interface WorkflowResult {
  /** 为空表示没有触发工作流，走正常 DeepSeek 聊天 */
  content: string;
  workflow: WorkflowType;
  state: WorkflowState;
  /** 工具调用记录 */
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  /** 供 DeepSeek 使用的工具结果摘要 */
  toolSummary?: string;
  /** 是否需要等用户回复 */
  shouldWaitUser: boolean;
  /** 建议切换的 persona */
  suggestedPersona?: string;
}

// ── 用户取消信号检测 ──

const CANCEL_SIGNALS = ["算了", "不用了", "我自己来", "别", "停", "取消", "放弃", "不用"];

function isUserCancel(message: string): boolean {
  const lower = message.toLowerCase();
  return CANCEL_SIGNALS.some((s) => lower.includes(s));
}

// ── 从消息历史推断用户选择 ──

function inferUserChoice(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options: Array<{ id: string; title: string }>
): { id: string; title: string } | null {
  // 找最后一条用户消息
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const trimmed = lastUserMsg.trim();

  // 尝试解析数字
  const numMatch = trimmed.match(/^(\d+)/);
  if (numMatch) {
    const index = parseInt(numMatch[1], 10) - 1;
    if (index >= 0 && index < options.length) {
      return options[index];
    }
  }

  // 尝试匹配名称
  const lowerMsg = trimmed.toLowerCase();
  for (const opt of options) {
    if (lowerMsg.includes(opt.title.toLowerCase().slice(0, 4))) {
      return opt;
    }
  }

  // "第一个""最后一个"
  if (lowerMsg.includes("第一个") || lowerMsg.includes("第一个")) return options[0] || null;
  if ((lowerMsg.includes("最后一个") || lowerMsg.includes("最后一个")) && options.length > 0) {
    return options[options.length - 1];
  }

  return null;
}

// ── 从消息历史推断当前工作流阶段 ──

function inferWorkflowStage(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): { stage: "initial" | "after_present"; lastAssistantHadList: boolean } {
  const recentMessages = messages.slice(-4); // 看最近4条
  const lastAssistant = [...recentMessages].reverse().find((m) => m.role === "assistant");

  // 判断上一条助手回复是否包含列表（1. 2. 3.）
  const hadList = /\n\s*\d+\./.test(lastAssistant?.content || "");

  // 如果最近有搜索展示类回复，认为是在"等待选择"阶段
  const hadPresentation =
    hadList ||
    /(你看看|你对哪个|选一个|对哪个有感觉|回复数字)/.test(lastAssistant?.content || "");

  return {
    stage: hadPresentation ? "after_present" : "initial",
    lastAssistantHadList: hadList,
  };
}

// ── 工作流引擎 ──

export class WorkflowEngine {
  /**
   * 主入口：执行工具调用，返回结果供 DeepSeek 生成自然语言
   */
  static async process(
    userMessage: string,
    ctx: WorkflowContext
  ): Promise<WorkflowResult> {
    // 0. 检测用户取消
    if (isUserCancel(userMessage)) {
      return {
        content: "",
        workflow: "chat",
        state: { type: "chat", step: "cancelled", status: "completed" },
        shouldWaitUser: false,
      };
    }

    // 1. RAG 意图判断
    const ragResult = await RAGEngine.retrieve(userMessage);
    const workflow = ragResult.intent.workflow;

    console.log(
      `[Workflow] intent: ${workflow}, confidence: ${ragResult.intent.confidence}, docs: ${ragResult.documents.length}`
    );

    // 2. 对话状态 → 不触发工作流，走正常 DeepSeek
    if (workflow === "chat") {
      return {
        content: "",
        workflow: "chat",
        state: { type: "chat", step: "free_chat", status: "running" },
        shouldWaitUser: false,
      };
    }

    // 3. 疗愈模式 → 建议切换 healer persona
    if (workflow === "healing") {
      return {
        content: "",
        workflow: "healing",
        state: { type: "healing", step: "switch_healer", status: "running" },
        suggestedPersona: "healer",
        shouldWaitUser: false,
      };
    }

    // 4. 检索模式 → 执行检索，返回结果供 DeepSeek 回答
    if (workflow === "search") {
      return this.runSearchWorkflow(userMessage, ctx, ragResult);
    }

    // 5. 故事模式
    if (workflow === "story") {
      return this.runStoryWorkflow(userMessage, ctx, ragResult);
    }

    // 6. 脑洞模式
    if (workflow === "brainhole") {
      return this.runBrainholeWorkflow(userMessage, ctx, ragResult);
    }

    // 默认兜底
    return {
      content: "",
      workflow: "chat",
      state: { type: "chat", step: "free_chat", status: "running" },
      shouldWaitUser: false,
    };
  }

  // ── 检索模式 ──

  private static async runSearchWorkflow(
    message: string,
    ctx: WorkflowContext,
    ragResult: RAGResult
  ): Promise<WorkflowResult> {
    const docs = ragResult.documents;
    const summary = docs
      .slice(0, 3)
      .map((d, i) => `${i + 1}. ${d.document.title}（${d.document.type === "story" ? "故事" : "话题"}）`)
      .join("\n");

    return {
      content: "",
      workflow: "search",
      state: { type: "search", step: "retrieve", status: "completed" },
      toolSummary: docs.length > 0
        ? `【检索结果】找到以下内容：\n${summary}\n\n请基于以上结果回答用户。`
        : "【检索结果】没有找到相关内容。请如实告诉用户。",
      shouldWaitUser: false,
    };
  }

  // ── 故事模式工作流 ──

  private static async runStoryWorkflow(
    message: string,
    ctx: WorkflowContext,
    ragResult: RAGResult
  ): Promise<WorkflowResult> {
    const stage = inferWorkflowStage(ctx.messages);
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    // 阶段 A：首次请求 → 检索故事
    if (stage.stage === "initial") {
      const keyword = ragResult.intent.suggestedParams?.keyword || message;
      const toolCall: ToolCall = { tool: "search_stories", params: { keyword } };
      const toolResult = await executeToolCall(toolCall, { userId: ctx.userId });

      toolCalls.push(toolCall);
      toolResults.push(toolResult);

      if (toolResult.success && Array.isArray(toolResult.data) && toolResult.data.length > 0) {
        const stories = toolResult.data.slice(0, 3);
        const list = stories
          .map((s: { title: string; era: string; difficulty: number }, i: number) => `${i + 1}. ${s.title}（${s.era}，难度${s.difficulty}）`)
          .join("\n");

        return {
          content: "",
          workflow: "story",
          state: { type: "story", step: "present_stories", status: "waiting_user" },
          toolCalls,
          toolResults,
          toolSummary: `【故事检索结果】找到以下故事，请自然地展示给用户，让用户选择：\n${list}\n\n注意：\n- 用刘看山的口吻说话，像朋友推荐一样\n- 不要暴露这是"检索结果"\n- 问用户想玩哪个，让用户回复数字或故事名`,
          shouldWaitUser: true,
        };
      } else {
        return {
          content: "",
          workflow: "story",
          state: { type: "story", step: "fallback", status: "waiting_user" },
          toolCalls,
          toolResults,
          toolSummary: "【故事检索结果】没有找到相关故事。请如实告诉用户，并主动推荐一个热门故事。",
          shouldWaitUser: true,
        };
      }
    }

    // 阶段 B：用户已回复 → 推断选择 → 匹配/创建房间
    if (stage.stage === "after_present") {
      // 从最后一条助手消息中恢复选项列表
      const lastAssistant = [...ctx.messages].reverse().find((m) => m.role === "assistant");
      const storyMatches = lastAssistant?.content.match(/\d+\.\s+([^（\n]+)/g) || [];
      const options = storyMatches.map((m, i) => ({
        id: `story_${i}`, // 临时 ID，实际应该用真实 ID
        title: m.replace(/^\d+\.\s*/, "").trim(),
      }));

      // 尝试从历史中找真实 story ID（从 toolResults 中恢复）
      // 简化：直接用 keyword 重新搜索一次
      const keyword = ragResult.intent.suggestedParams?.keyword || message;
      const searchCall: ToolCall = { tool: "search_stories", params: { keyword } };
      const searchResult = await executeToolCall(searchCall, { userId: ctx.userId });
      const stories = searchResult.success && Array.isArray(searchResult.data) ? searchResult.data : [];

      const choice = inferUserChoice(ctx.messages, stories.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title })));

      if (!choice && stories.length > 0) {
        // 无法推断选择，但用户可能说了什么，默认选第一个
        console.log("[Workflow] 无法推断用户选择，默认第一个");
      }

      const selectedStory = choice || stories[0];

      if (selectedStory) {
        // 查找匹配
        const matchCall: ToolCall = { tool: "find_online_user", params: {} };
        const matchResult = await executeToolCall(matchCall, { userId: ctx.userId });
        toolCalls.push(matchCall);
        toolResults.push(matchResult);

        const hasMatches = matchResult.success && Array.isArray(matchResult.data) && matchResult.data.length > 0;

        if (hasMatches) {
          // 有真人 → 创建真人房间
          const roomCall: ToolCall = {
            tool: "create_room",
            params: { type: "story_duet", storyId: selectedStory.id },
          };
          const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
          toolCalls.push(roomCall);
          toolResults.push(roomResult);

          const roomData = roomResult.data as { roomId?: string } | undefined;
          if (roomResult.success && roomData?.roomId) {
            return {
              content: "",
              workflow: "story",
              state: { type: "story", step: "room_created", status: "completed" },
              toolCalls,
              toolResults,
              toolSummary: `【匹配结果】匹配到了真人用户！房间 ${roomData.roomId} 已创建。请自然地告诉用户这个好消息，引导用户进入房间。`,
              shouldWaitUser: false,
            };
          }
        }

        // 无真人 → AI 兜底
        const roomCall: ToolCall = {
          tool: "create_room",
          params: { type: "ai_duet", storyId: selectedStory.id },
        };
        const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
        toolCalls.push(roomCall);
        toolResults.push(roomResult);

        return {
          content: "",
          workflow: "story",
          state: { type: "story", step: "ai_fallback", status: "completed" },
          toolCalls,
          toolResults,
          toolSummary: "【匹配结果】暂时没匹配到真人。已创建 AI 房间，刘看山会陪你聊这个故事。请自然地告诉用户。",
          shouldWaitUser: false,
        };
      }
    }

    return {
      content: "",
      workflow: "story",
      state: { type: "story", step: "waiting", status: "waiting_user" },
      shouldWaitUser: true,
    };
  }

  // ── 脑洞模式工作流 ──

  private static async runBrainholeWorkflow(
    message: string,
    ctx: WorkflowContext,
    ragResult: RAGResult
  ): Promise<WorkflowResult> {
    const stage = inferWorkflowStage(ctx.messages);
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    // 阶段 A：首次请求 → 检索脑洞
    if (stage.stage === "initial") {
      const category = ragResult.intent.suggestedParams?.category;
      const toolCall: ToolCall = {
        tool: "search_brainholes",
        params: { category, limit: 5 },
      };
      const toolResult = await executeToolCall(toolCall, { userId: ctx.userId });

      toolCalls.push(toolCall);
      toolResults.push(toolResult);

      if (toolResult.success && Array.isArray(toolResult.data) && toolResult.data.length > 0) {
        const brainholes = toolResult.data.slice(0, 3);
        const list = brainholes
          .map((b: { title: string }, i: number) => `${i + 1}. ${b.title}`)
          .join("\n");

        return {
          content: "",
          workflow: "brainhole",
          state: { type: "brainhole", step: "present_brainholes", status: "waiting_user" },
          toolCalls,
          toolResults,
          toolSummary: `【话题检索结果】找到以下热门话题，请自然地展示给用户：\n${list}\n\n注意：\n- 用刘看山的口吻，像朋友推荐一样\n- 问用户想聊哪个，让用户回复数字或话题名`,
          shouldWaitUser: true,
        };
      } else {
        return {
          content: "",
          workflow: "brainhole",
          state: { type: "brainhole", step: "fallback", status: "waiting_user" },
          toolCalls,
          toolResults,
          toolSummary: "【话题检索结果】没找到热门话题。请如实告诉用户，并主动创建一个 AI 房间开始聊天。",
          shouldWaitUser: true,
        };
      }
    }

    // 阶段 B：用户已回复 → 推断选择 → 创建房间
    if (stage.stage === "after_present") {
      const keyword = ragResult.intent.suggestedParams?.keyword || message;
      const searchCall: ToolCall = { tool: "search_brainholes", params: { keyword, limit: 5 } };
      const searchResult = await executeToolCall(searchCall, { userId: ctx.userId });
      const brainholes = searchResult.success && Array.isArray(searchResult.data) ? searchResult.data : [];

      const choice = inferUserChoice(ctx.messages, brainholes.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
      const selected = choice || brainholes[0];

      if (selected) {
        const roomCall: ToolCall = {
          tool: "create_room",
          params: { type: "ai_duet", brainholeId: selected.id },
        };
        const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
        toolCalls.push(roomCall);
        toolResults.push(roomResult);

        return {
          content: "",
          workflow: "brainhole",
          state: { type: "brainhole", step: "room_created", status: "completed" },
          toolCalls,
          toolResults,
          toolSummary: `【房间创建结果】已创建 AI 房间（话题：${selected.title}）。请自然地告诉用户可以开始了。`,
          shouldWaitUser: false,
        };
      }
    }

    return {
      content: "",
      workflow: "brainhole",
      state: { type: "brainhole", step: "waiting", status: "waiting_user" },
      shouldWaitUser: true,
    };
  }
}
