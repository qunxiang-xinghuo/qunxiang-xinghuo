/**
 * 刘看山内容审核服务
 * v8.1: 从 finish API 提取为共享模块，供 visibility 等接口复用
 */
import { zhidaChat } from "@/lib/zhihu-dev-api";

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
  const reviewPrompt = `你现在是一位资深的内容编辑，负责审核用户生成的对白。

请检查以下对话中是否包含不文明用语、人身攻击、色情低俗、政治敏感、广告引流或其他违规内容。

如果内容健康、有价值，请返回 JSON:
{ "approved": true, "summary": "用一句话总结这段对话的亮点（20字以内）" }

如果内容违规，请返回 JSON:
{ "approved": false, "reason": "简要说明违规原因" }

只返回JSON，不要任何其他解释或格式标记。

对话内容：
${content.slice(0, 3000)}`;

  // 优先调用 DeepSeek
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你是一个严格但公正的内容审核编辑。只输出JSON格式。" },
            { role: "user", content: reviewPrompt },
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const zhidaResult = await zhidaChat(
      [
        { role: "user", content: `[系统设定] 你是一个严格但公正的内容审核编辑。只输出JSON格式。` },
        { role: "user", content: reviewPrompt },
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

  // 两个 API 都失败，默认不通过（安全优先）
  console.warn("[AI Review] 审核 API 全部失败，默认私密保存");
  return { approved: false, reason: "审核服务暂时不可用，内容已私密保存" };
}
