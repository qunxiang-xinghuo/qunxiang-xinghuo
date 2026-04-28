import { getFallbackPrompt } from "./fallback-prompts";
import { getCatalystPrompt } from "@/server/ai-catalyst";

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
  // Phase 4: This will integrate with AI service
  // For now, return fallback prompts
  
  if (brainholeId) {
    // Try to get catalyst prompt for specific brainhole
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

  // Fallback to local prompts
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
  format: "script" | "narrative" = "script"
): Promise<string> {
  // Phase 4: This will integrate with AI service
  return "故事串联功能即将上线，敬请期待！";
}

export async function analyzeEmotion(content: string): Promise<string[]> {
  // Phase 4: This will integrate with AI service
  return ["neutral"];
}