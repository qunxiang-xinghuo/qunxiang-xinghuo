/**
 * AI 脑洞转化模块
 *
 * 将知乎热榜话题转化为双人匹配可用的脑洞场景。
 * 调用 DeepSeek API，失败时回退到知乎直答。
 */

import { ZhihuHotItem } from './zhihu-hot';
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

export interface TransformedBrainhole {
  title: string;
  scenario: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const SYSTEM_PROMPT = `你是一个创意编剧，擅长把社会热点话题转化为角色扮演游戏的脑洞场景。

你的任务：
1. 分析输入的话题标题和摘要
2. 提炼出一个具体的冲突情境
3. 用第二人称「你」开头，让读者立刻代入
4. 控制在80字以内，口语化、有画面感
5. 给出2-3个适合的身份标签（如"职场新人"、"资深律师"、"外卖骑手"）
6. 评估难度：easy（日常话题）、medium（需要一点思考）、hard（复杂伦理困境）

输出格式（必须严格按此格式）：
标题：<一句话概括场景>
场景：<第二人称描述，80字以内>
标签：标签1,标签2,标签3
难度：easy/medium/hard

注意：
- 不要涉及真实人名、真实公司名
- 不要涉及血腥、暴力、色情、政治敏感内容
- 场景要有冲突张力，但不能太沉重`;

/**
 * 调用 DeepSeek API 转化话题
 */
async function transformWithDeepSeek(item: ZhihuHotItem): Promise<TransformedBrainhole | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `话题标题：${item.title}\n话题摘要：${item.excerpt || '无摘要'}` },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(t);

    if (!res.ok) {
      console.error('[Crawler] DeepSeek 返回非 2xx:', res.status);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    return parseTransformResult(content);
  } catch (e: unknown) {
    if ((e as { name?: string }).name !== 'AbortError') {
      console.error('[Crawler] DeepSeek 转化失败:', getErrorMessage(e));
    }
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * 调用知乎直答 API 转化话题（fallback）
 */
async function transformWithZhida(item: ZhihuHotItem): Promise<TransformedBrainhole | null> {
  try {
    const { zhidaChat } = await import('@/lib/zhihu-dev-api');
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);

    try {
      // 知乎直答不支持 system role，将 system prompt 合并到 user message 中
      const userContent = `[系统设定]\n${SYSTEM_PROMPT}\n\n[用户输入]\n话题标题：${item.title}\n话题摘要：${item.excerpt || '无摘要'}`;
      const result = await zhidaChat(
        [{ role: 'user', content: userContent }],
        'zhida-fast-1p5',
        controller.signal
      );
      const content = result?.choices?.[0]?.message?.content?.trim() || '';
      return parseTransformResult(content);
    } finally {
      clearTimeout(t);
    }
  } catch (e: unknown) {
    console.error('[Crawler] 知乎直答转化失败:', getErrorMessage(e));
    return null;
  }
}

/**
 * 解析 AI 返回的文本为结构化数据
 */
function parseTransformResult(content: string): TransformedBrainhole | null {
  try {
    const titleMatch = content.match(/标题[:：]\s*(.+)/);
    const scenarioMatch = content.match(/场景[:：]\s*(.+)/);
    const tagsMatch = content.match(/标签[:：]\s*(.+)/);
    const difficultyMatch = content.match(/难度[:：]\s*(.+)/);

    const title = titleMatch?.[1]?.trim();
    const scenario = scenarioMatch?.[1]?.trim();
    const tagsRaw = tagsMatch?.[1]?.trim() || '';
    const difficultyRaw = difficultyMatch?.[1]?.trim()?.toLowerCase() || 'medium';

    if (!title || !scenario) {
      console.warn('[Crawler] AI 返回格式不完整:', content.slice(0, 200));
      return null;
    }

    const tags = tagsRaw
      .split(/[,，、]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .slice(0, 3);

    const difficulty: 'easy' | 'medium' | 'hard' =
      difficultyRaw === 'easy' || difficultyRaw === 'hard'
        ? difficultyRaw
        : 'medium';

    return { title, scenario, tags, difficulty };
  } catch (e) {
    console.error('[Crawler] 解析 AI 返回失败:', e);
    return null;
  }
}

/**
 * 将知乎热榜话题转化为脑洞
 * 优先 DeepSeek，失败回退知乎直答
 */
export async function transformHotItem(item: ZhihuHotItem): Promise<TransformedBrainhole | null> {
  // 先尝试 DeepSeek
  const dsResult = await transformWithDeepSeek(item);
  if (dsResult) return dsResult;

  // 回退知乎直答
  const zhidaResult = await transformWithZhida(item);
  if (zhidaResult) return zhidaResult;

  console.error('[Crawler] 所有 AI 转化均失败:', item.title);
  return null;
}
