/**
 * AI 基础能力投喂服务（冷启动）
 *
 * 从 DeepSeek/知乎直答抓取各领域专业知识，构建基础能力池。
 * 服务启动时执行一次，之后可手动触发补充。
 */

import { db } from '@/lib/db';

interface DomainConfig {
  domain: string;
  prompt: string;
  source: string;
}

const DOMAINS: DomainConfig[] = [
  {
    domain: 'psychology',
    prompt: `请为AI助手提供心理咨询领域的核心知识要点，要求简洁实用，每条50-100字，共15条。涵盖：CBT认知行为疗法基础、共情技巧、倾听技术、情绪识别、危机干预原则。这些知识将用于训练AI在对话中进行专业引导。只输出要点列表，每条前面加数字编号。`,
    source: 'deepseek',
  },
  {
    domain: 'storytelling',
    prompt: `请为AI助手提供故事创作与引导的核心知识要点，要求简洁实用，每条50-100字，共15条。涵盖：三幕剧结构、悬念设计原理、即兴戏剧引导技巧、角色冲突构建、叙事节奏控制。这些知识将用于训练AI在故事模式中担任DM。只输出要点列表，每条前面加数字编号。`,
    source: 'deepseek',
  },
  {
    domain: 'brainhole',
    prompt: `请为AI助手提供脑洞引导与冲突激化的核心知识要点，要求简洁实用，每条50-100字，共15条。涵盖：开放式提问技巧、视角转换方法、矛盾激化策略、情境代入技巧、对话推进方法。这些知识将用于训练AI在双人脑洞催化中的引导能力。只输出要点列表，每条前面加数字编号。`,
    source: 'deepseek',
  },
  {
    domain: 'taicang',
    prompt: `请提供太仓本地文化的核心知识要点，要求简洁有趣，每条50-100字，共15条。涵盖：郑和下西洋史实、江南丝竹起源、麻将发明传说、牛郎织女考证、太仓港口历史。这些知识将用于训练AI在文化沉浸场景中提供真实感。只输出要点列表，每条前面加数字编号。`,
    source: 'deepseek',
  },
];

/**
 * 调用 DeepSeek API 获取领域知识
 */
async function fetchDomainKnowledge(config: DomainConfig): Promise<string[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn(`[AI Training] DEEPSEEK_API_KEY 未设置，跳过 ${config.domain}`);
    return [];
  }

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
        messages: [{ role: 'user', content: config.prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(t);

    if (!res.ok) {
      console.error(`[AI Training] ${config.domain} DeepSeek 返回非 2xx:`, res.status);
      return [];
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';

    // 解析编号列表
    const items = content
      .split('\n')
      .map((line: string) => line.replace(/^\d+[.\、]\s*/, '').trim())
      .filter((line: string) => line.length >= 20 && line.length <= 200);

    return items;
  } catch (e: any) {
    if (e.name !== 'AbortError') {
      console.error(`[AI Training] ${config.domain} 获取失败:`, e.message);
    }
    return [];
  } finally {
    clearTimeout(t);
  }
}

/**
 * 执行基础能力投喂
 */
export async function feedBaseKnowledge(): Promise<{
  domain: string;
  count: number;
}[]> {
  const results: { domain: string; count: number }[] = [];

  for (const config of DOMAINS) {
    // 检查该领域是否已有数据
    const existing = await db.aITrainingData.count({
      where: { domain: config.domain },
    });

    if (existing > 0) {
      console.log(`[AI Training] ${config.domain} 已有 ${existing} 条数据，跳过`);
      results.push({ domain: config.domain, count: 0 });
      continue;
    }

    console.log(`[AI Training] 开始投喂 ${config.domain}...`);
    const items = await fetchDomainKnowledge(config);

    if (items.length === 0) {
      results.push({ domain: config.domain, count: 0 });
      continue;
    }

    // 批量存入数据库
    try {
      await db.aITrainingData.createMany({
        data: items.map((content) => ({
          domain: config.domain,
          content,
          source: config.source,
        })),
      });
      console.log(`[AI Training] ${config.domain} 已存入 ${items.length} 条`);
      results.push({ domain: config.domain, count: items.length });
    } catch (e: any) {
      console.error(`[AI Training] ${config.domain} 存储失败:`, e.message);
      results.push({ domain: config.domain, count: 0 });
    }

    // 每个领域间隔 2 秒，避免 API 限流
    await new Promise((r) => setTimeout(r, 2000));
  }

  return results;
}

/**
 * 手动添加单条训练数据
 */
export async function addTrainingData(
  domain: string,
  content: string,
  source: string = 'manual'
): Promise<void> {
  await db.aITrainingData.create({
    data: { domain, content, source },
  });
}

/**
 * 获取指定领域的训练数据（用于 AI prompt 构建）
 */
export async function getTrainingKnowledge(
  domain: string,
  limit: number = 10
): Promise<string[]> {
  const data = await db.aITrainingData.findMany({
    where: { domain },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return data.map((d) => d.content);
}
