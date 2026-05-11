/**
 * v9.3: 工作流引擎
 *
 * 职责：
 * 1. 根据意图类型执行对应工作流（故事/脑洞/疗愈/检索/对话）
 * 2. 管理工作流状态（步骤、上下文、历史）
 * 3. 每一步执行后运行检查点
 * 4. 失败时自动重试/兜底
 */

import { RAGEngine, type WorkflowType, type RAGResult } from "./rag-engine";
import {
  executeToolCall,
  parseToolCall,
  stripToolCall,
  type ToolCall,
  type ToolResult,
  type ToolContext,
} from "./agent-tools";

// ── 类型定义 ──

export interface WorkflowContext {
  userId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  currentTopic?: string;
  workflowState?: WorkflowState;
  selectedStoryId?: string;
  selectedBrainholeId?: string;
  roomId?: string;
  stepIndex: number;
  history: WorkflowStepResult[];
}

export interface WorkflowState {
  type: WorkflowType;
  step: string;
  status: "running" | "waiting_user" | "completed" | "failed";
}

export interface WorkflowStepResult {
  step: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  aiReply?: string;
  checkpoint?: any;
  success: boolean;
}

export interface WorkflowResult {
  content: string;
  workflow: WorkflowType;
  state: WorkflowState;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  shouldWaitUser: boolean;
}

// ── 工作流定义 ──

const STORY_WORKFLOW = [
  { name: "search_stories", tool: "search_stories", requiresUserInput: false },
  { name: "present_stories", tool: null, requiresUserInput: true },
  { name: "find_online_user", tool: "find_online_user", requiresUserInput: false },
  { name: "create_room", tool: "create_room", requiresUserInput: false },
];

const BRAINHOLE_WORKFLOW = [
  { name: "search_brainholes", tool: "search_brainholes", requiresUserInput: false },
  { name: "present_brainholes", tool: null, requiresUserInput: true },
  { name: "create_room", tool: "create_room", requiresUserInput: false },
];

const HEALING_WORKFLOW = [
  { name: "switch_healer", tool: null, requiresUserInput: false },
];

// ── 工作流引擎 ──

export class WorkflowEngine {
  /**
   * 主入口：处理用户消息，执行对应工作流
   */
  static async process(
    userMessage: string,
    ctx: WorkflowContext
  ): Promise<WorkflowResult> {
    // 1. RAG 意图判断 + 检索
    const ragResult = await RAGEngine.retrieve(userMessage);
    const workflow = ragResult.intent.workflow;

    console.log(
      `[Workflow] intent: ${workflow}, confidence: ${ragResult.intent.confidence}, docs: ${ragResult.documents.length}`
    );

    // 2. 对话状态 → 正常聊天
    if (workflow === "chat") {
      return {
        content: "",
        workflow: "chat",
        state: { type: "chat", step: "free_chat", status: "running" },
        shouldWaitUser: false,
      };
    }

    // 3. 疗愈模式 → 返回切换 healer 的标记
    if (workflow === "healing") {
      return {
        content: "",
        workflow: "healing",
        state: { type: "healing", step: "switch_healer", status: "running" },
        shouldWaitUser: false,
      };
    }

    // 4. 检索模式 → 返回检索结果
    if (workflow === "search") {
      const docs = ragResult.documents;
      const summary = docs
        .slice(0, 3)
        .map((d, i) => `${i + 1}. ${d.document.title} (${d.document.type})`)
        .join("\n");
      return {
        content: docs.length > 0 ? `找到以下内容：\n${summary}` : "没有找到相关内容。",
        workflow: "search",
        state: { type: "search", step: "retrieve", status: "completed" },
        shouldWaitUser: false,
      };
    }

    // 5. 故事模式 / 脑洞模式 → 执行工作流
    if (workflow === "story") {
      return this.runStoryWorkflow(userMessage, ctx, ragResult);
    }

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

  // ── 故事模式工作流 ──

  private static async runStoryWorkflow(
    message: string,
    ctx: WorkflowContext,
    ragResult: RAGResult
  ): Promise<WorkflowResult> {
    const stepIndex = ctx.stepIndex || 0;
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    // Step 0: 检索故事
    if (stepIndex === 0) {
      const keyword = ragResult.intent.suggestedParams?.keyword || message;
      const toolCall: ToolCall = { tool: "search_stories", params: { keyword } };
      const toolResult = await executeToolCall(toolCall, { userId: ctx.userId });

      toolCalls.push(toolCall);
      toolResults.push(toolResult);

      if (toolResult.success && Array.isArray(toolResult.data) && toolResult.data.length > 0) {
        const stories = toolResult.data.slice(0, 3);
        const list = stories
          .map((s: any, i: number) => `${i + 1}. ${s.title}（${s.era}，难度${s.difficulty}）`)
          .join("\n");

        return {
          content: `找到几个故事，你看看对哪个有兴趣？\n${list}\n\n回复数字或故事名就行。`,
          workflow: "story",
          state: { type: "story", step: "present_stories", status: "waiting_user" },
          toolCalls,
          toolResults,
          shouldWaitUser: true,
        };
      } else {
        // 没找到故事，兜底
        return {
          content: "暂时没找到相关故事。要不我推荐一个热门的？",
          workflow: "story",
          state: { type: "story", step: "fallback", status: "waiting_user" },
          toolCalls,
          toolResults,
          shouldWaitUser: true,
        };
      }
    }

    // Step 1: 用户已选择故事 → 查找匹配
    if (stepIndex === 1 && ctx.selectedStoryId) {
      const toolCall: ToolCall = { tool: "find_online_user", params: {} };
      const toolResult = await executeToolCall(toolCall, { userId: ctx.userId });

      toolCalls.push(toolCall);
      toolResults.push(toolResult);

      const hasMatches = toolResult.success && Array.isArray(toolResult.data) && toolResult.data.length > 0;

      if (hasMatches) {
        // 有真人匹配 → 创建真人房间
        const roomCall: ToolCall = {
          tool: "create_room",
          params: { type: "story_duet", storyId: ctx.selectedStoryId },
        };
        const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
        toolCalls.push(roomCall);
        toolResults.push(roomResult);

        if (roomResult.success && roomResult.data?.roomId) {
          return {
            content: `匹配到了！房间已创建，进来吧。`,
            workflow: "story",
            state: { type: "story", step: "room_created", status: "completed" },
            toolCalls,
            toolResults,
            shouldWaitUser: false,
          };
        }
      }

      // 没有真人匹配 → 创建 AI 房间兜底
      const roomCall: ToolCall = {
        tool: "create_room",
        params: { type: "ai_duet", storyId: ctx.selectedStoryId },
      };
      const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
      toolCalls.push(roomCall);
      toolResults.push(roomResult);

      return {
        content: `暂时没真人匹配到，我先陪你聊聊这个故事？`,
        workflow: "story",
        state: { type: "story", step: "ai_fallback", status: "completed" },
        toolCalls,
        toolResults,
        shouldWaitUser: false,
      };
    }

    // 默认：等待用户输入
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
    const stepIndex = ctx.stepIndex || 0;
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    // Step 0: 检索脑洞
    if (stepIndex === 0) {
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
          .map((b: any, i: number) => `${i + 1}. ${b.title}`)
          .join("\n");

        return {
          content: `这几个话题最近挺热的，你对哪个有感觉？\n${list}\n\n回复数字或话题名就行。`,
          workflow: "brainhole",
          state: { type: "brainhole", step: "present_brainholes", status: "waiting_user" },
          toolCalls,
          toolResults,
          shouldWaitUser: true,
        };
      } else {
        return {
          content: "暂时没找到热门话题。要不我随便推荐一个？",
          workflow: "brainhole",
          state: { type: "brainhole", step: "fallback", status: "waiting_user" },
          toolCalls,
          toolResults,
          shouldWaitUser: true,
        };
      }
    }

    // Step 1: 用户已选择话题 → 创建房间
    if (stepIndex === 1 && ctx.selectedBrainholeId) {
      const roomCall: ToolCall = {
        tool: "create_room",
        params: { type: "ai_duet", brainholeId: ctx.selectedBrainholeId },
      };
      const roomResult = await executeToolCall(roomCall, { userId: ctx.userId });
      toolCalls.push(roomCall);
      toolResults.push(roomResult);

      return {
        content: `已创建房间，我们可以开始了。`,
        workflow: "brainhole",
        state: { type: "brainhole", step: "room_created", status: "completed" },
        toolCalls,
        toolResults,
        shouldWaitUser: false,
      };
    }

    return {
      content: "",
      workflow: "brainhole",
      state: { type: "brainhole", step: "waiting", status: "waiting_user" },
      shouldWaitUser: true,
    };
  }

  /**
   * 解析用户选择（数字或名称）
   */
  static parseUserSelection(
    message: string,
    options: Array<{ id: string; title: string }>
  ): { id: string; title: string } | null {
    const trimmed = message.trim();

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
      if (lowerMsg.includes(opt.title.toLowerCase())) {
        return opt;
      }
    }

    return null;
  }
}
