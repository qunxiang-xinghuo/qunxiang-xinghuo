import { getFallbackPrompt } from "./fallback-prompts";
import { getCatalystPrompt } from "@/server/ai-catalyst";
import {
  generatePromptFromContext,
  refinePrompt,
  generateCatalystQuestions,
} from "./prompt-generator";

// v9.3: RAG + 工作流 + 意图路由
export { RAGEngine, type WorkflowType, type RAGIntent, type RAGResult } from "./rag-engine";
export { WorkflowEngine, type WorkflowContext, type WorkflowResult } from "./workflow-engine";
export { classifyIntent, retrieveWithIntent } from "./intent-router";
export {
  buildVectorIndex,
  rebuildIndex,
  searchKnowledgeBase,
  isVectorMode,
  getIndexStats,
  forceKeywordMode,
  type VectorDocument,
  type SearchResult,
} from "./vector-store";

export { generatePromptFromContext, refinePrompt, generateCatalystQuestions };

export interface AIPrompt {
  prompt: string;
  source: "fallback" | "generated" | "catalyst";
  category?: string;
  tags?: string[];
}

export async function getAIPrompt(
  brainholeId?: string,
  category?: string,
  tags?: string[]
): Promise<AIPrompt> {
  // 1. 优先尝试 catalyst（基于脑洞内容的深度分析）
  if (brainholeId) {
    try {
      const catalystPrompt = await getCatalystPrompt(brainholeId);
      if (catalystPrompt) {
        return {
          prompt: catalystPrompt,
          source: "catalyst",
          category,
          tags,
        };
      }
    } catch (error) {
      console.warn("Failed to get catalyst prompt:", error);
    }
  }

  // 2. 尝试用 DeepSeek 生成个性化提示（如果有上下文线索）
  if (category || (tags && tags.length > 0)) {
    try {
      const generated = await generatePromptFromContext(
        `生成一个${category || ""}领域的创意引导问题`,
        category,
        tags
      );
      if (generated && generated.length > 5) {
        return {
          prompt: generated,
          source: "generated",
          category,
          tags,
        };
      }
    } catch (error) {
      console.warn("AI prompt generation failed:", error);
    }
  }

  // 3. Fallback 到本地提示库
  const fallback = getFallbackPrompt(category, tags);
  return {
    prompt: fallback,
    source: "fallback",
    category,
    tags,
  };
}

export async function generateStoryFromSparks(
  sparks: Array<{ content: string; identity: string; timestamp: Date }>,
  _format: "script" | "narrative" = "script"
): Promise<string> {
  // Phase 4: This will integrate with AI service
  return "故事串联功能即将上线，敬请期待！";
}

export async function analyzeEmotion(_content: string): Promise<string[]> {
  // Phase 4: This will integrate with AI service
  return ["neutral"];
}
