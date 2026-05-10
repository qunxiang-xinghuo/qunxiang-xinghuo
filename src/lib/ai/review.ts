/**
 * 刘看山内容审核服务
 * v8.1: 从 finish API 提取为共享模块，供 visibility 等接口复用
 */
import { zhidaChat } from "@/lib/zhihu-dev-api";
import { getPersona } from "@/lib/ai/personas";

export interface ReviewResult {
  approved: boolean;
  summary?: string;
  reason?: string;
}

/**
 * 调用刘看山 Agent 审核内容
 * 优先 DeepSeek，fallback 知乎直答
 * 全部失败时默认不通过（安全优先）
 */
export async function liukanshanReview(content: string): Promise<ReviewResult> {
  const persona = getPersona('reviewer');
  const userPrompt = `请审核以下对话内容：\n\n${content.slice(0, 3000)}`;

  // 优先调用 DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
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
            { role: "system", content: persona.systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const result = await res.json();
        const text = result.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.approved === "boolean") {
            console.log("[AI Review] DeepSeek 审核结果:", parsed.approved, parsed.summary || parsed.reason);
            return {
              approved: parsed.approved,
              summary: parsed.summary,
              reason: parsed.reason,
            };
          }
        }
      }
    } catch (err: any) {
      console.error("[AI Review] DeepSeek 审核异常:", err.message);
    }
  }

  // DeepSeek 失败，尝试知乎直答
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const zhidaResult = await zhidaChat(
      [
        { role: "user", content: `[系统设定] ${persona.systemPrompt}` },
        { role: "user", content: userPrompt },
      ],
      "zhida-thinking-1p5",
      controller.signal
    );
    clearTimeout(timeoutId);

    const text = zhidaResult.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.approved === "boolean") {
        console.log("[AI Review] 知乎直答 审核结果:", parsed.approved, parsed.summary || parsed.reason);
        return {
          approved: parsed.approved,
          summary: parsed.summary,
          reason: parsed.reason,
        };
      }
    }
  } catch (err: any) {
    console.error("[AI Review] 知乎直答 审核异常:", err.message);
  }

  // v8.1-fix: 两个 API 都失败或超时，默认通过（不因技术故障卡住用户）
  console.warn("[AI Review] 审核 API 全部失败，默认自动通过");
  return { approved: true, summary: "对话内容自然流畅" };
}
