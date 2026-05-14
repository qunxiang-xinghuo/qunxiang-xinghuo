/**
 * v9.3: RAG 检索引擎
 *
 * 职责：
 * 1. 接收用户查询 → 检索知识库 → 返回最相关的文档
 * 2. 自动判断意图（故事/脑洞/疗愈/检索/闲聊）
 * 3. 生成结构化检索结果，供工作流引擎使用
 */

import { searchKnowledgeBase, type SearchResult, type SearchOptions } from "./vector-store";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

// ── 类型定义 ──

export type WorkflowType = "story" | "brainhole" | "healing" | "search" | "chat";

export interface RAGIntent {
  workflow: WorkflowType;
  confidence: number;
  reasoning: string;
  suggestedParams?: Record<string, unknown>;
}

export interface RAGResult {
  intent: RAGIntent;
  documents: SearchResult[];
  hasResults: boolean;
}

// ── 意图判断关键词（快速预分类）──

const INTENT_KEYWORDS: Record<WorkflowType, string[]> = {
  story: [
    "故事", "玩", "明朝", "清朝", "民国", "古风", "现代", "剧情", "角色", "扮演", "剧本",
    "游戏", "解密", "推理", "悬疑", "侦探", "密室", "真相", "破案", "案件",
    "想玩", "找个故事", "来玩", "推荐故事", "有什么故事",
  ],
  brainhole: [
    "脑洞", "话题", "今天", "好玩", "聊聊", "讨论", "聊什么", "有什么话题",
    "推荐话题", "热点", "热门", "有意思", "有趣", "看看", "随便",
    "无聊", "闲",
  ],
  healing: [
    "心情不好", "难过", "焦虑", "压力", "想哭", "累", "郁闷", "烦", "痛苦",
    "抑郁", "孤独", "无助", "失落", "伤心", "不开心", "难受", "不舒服",
    "疗愈", "安慰", "倾诉", "聊聊心事", "心里", "情绪", "心理",
  ],
  search: [
    "查", "搜索", "找", "了解", "知道", "是什么", "为什么", "怎么", "如何",
    "资料", "信息", "知识", "科普", "解释", "说明",
  ],
  chat: [],
};

// ── 快速意图分类（零成本）──

function quickClassify(message: string): { workflow: WorkflowType; confidence: number } | null {
  const lowerMsg = message.toLowerCase();
  let bestWorkflow: WorkflowType = "chat";
  let bestScore = 0;

  for (const [workflow, keywords] of Object.entries(INTENT_KEYWORDS) as [WorkflowType, string[]][]) {
    if (workflow === "chat") continue;

    let score = 0;
    for (const kw of keywords) {
      if (lowerMsg.includes(kw.toLowerCase())) {
        score += kw.length >= 4 ? 2 : 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestWorkflow = workflow;
    }
  }

  const confidence = Math.min(bestScore / 3, 0.95);
  if (confidence < 0.3) return null;
  return { workflow: bestWorkflow, confidence };
}

// ── DeepSeek AI 意图分类 ──

async function aiClassify(message: string): Promise<RAGIntent> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { workflow: "chat", confidence: 0.5, reasoning: "API key unavailable" };
  }

  const systemPrompt = `你是意图分类器。分析用户消息，判断用户意图。只输出 JSON，不要其他内容。

分类规则：
- story: 用户想玩解密故事、角色扮演、剧本游戏
- brainhole: 用户想找话题聊天、讨论热点
- healing: 用户表达负面情绪、需要安慰、想倾诉
- search: 用户想查资料、了解某个概念、获取信息
- chat: 纯闲聊、打招呼、分享日常

输出格式：
{"intent": "story|brainhole|healing|search|chat", "confidence": 0-1, "reasoning": "一句话说明判断理由", "params": {"keyword": "提取的关键词"}}

注意：
- confidence 必须诚实，不确定就低一些
- params.keyword 提取用户提到的具体关键词（故事名、时代、话题等）`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { workflow: "chat", confidence: 0.5, reasoning: "AI classify failed" };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { workflow: "chat", confidence: 0.5, reasoning: "Cannot parse result" };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return { workflow: "chat", confidence: 0.5, reasoning: "JSON解析失败" };
    }
    const workflow = (parsed.intent as WorkflowType) || "chat";
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));

    return {
      workflow: ["story", "brainhole", "healing", "search", "chat"].includes(workflow)
        ? workflow
        : "chat",
      confidence,
      reasoning: String(parsed.reasoning || "AI classified"),
      suggestedParams: (parsed.params as Record<string, unknown>) || {},
    };
  } catch (err: unknown) {
    console.warn("[RAG Engine] AI intent classify failed:", getErrorMessage(err));
    return { workflow: "chat", confidence: 0.5, reasoning: "Classify error" };
  }
}

// ── RAG 引擎 ──

export class RAGEngine {
  static async retrieve(message: string): Promise<RAGResult> {
    const quickResult = quickClassify(message);

    let intent: RAGIntent;
    if (quickResult && quickResult.confidence >= 0.7) {
      intent = {
        workflow: quickResult.workflow,
        confidence: quickResult.confidence,
        reasoning: `Keyword match: ${quickResult.workflow}`,
      };
    } else {
      intent = await aiClassify(message);
    }

    if (intent.workflow === "chat") {
      return { intent, documents: [], hasResults: false };
    }

    const searchOptions: SearchOptions = {
      limit: 5,
      minScore: 0.3,
    };

    if (intent.workflow === "story") {
      searchOptions.type = "story";
    } else if (intent.workflow === "brainhole") {
      searchOptions.type = "brainhole";
    }

    const keyword = String(intent.suggestedParams?.keyword || message);
    const documents = await searchKnowledgeBase(keyword, searchOptions);

    return {
      intent,
      documents,
      hasResults: documents.length > 0,
    };
  }
}
