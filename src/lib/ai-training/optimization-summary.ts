/**
 * AI 定期总结优化服务
 *
 * 每天执行一次，从 AILearningLog 和 CatalystLog 中提取优化策略，
 * 生成 AIOptimizationSummary 和 BrainholeSummary。
 */

import { db } from '@/lib/db';

/**
 * 执行每日总结优化
 */
export async function runDailyOptimization(): Promise<{
  catalystSummaries: number;
  brainholeSummaries: number;
  optimizationSummaries: number;
}> {
  console.log('[AI Optimization] ====== 开始每日总结优化 ======', new Date().toISOString());

  const catalystSummaries = await summarizeCatalystLogs();
  const brainholeSummaries = await summarizeBrainholeLogs();
  const optimizationSummaries = await summarizeLearningLogs();

  console.log('[AI Optimization] ====== 完成 ======');
  return { catalystSummaries, brainholeSummaries, optimizationSummaries };
}

/**
 * 总结催化效果日志
 */
async function summarizeCatalystLogs(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 获取昨日所有催化日志
  const logs = await db.catalystLog.findMany({
    where: { createdAt: { gte: oneDayAgo } },
  });

  if (logs.length === 0) return 0;

  // 按 phase 分组统计
  const phaseStats = new Map<string, {
    total: number;
    responded: number;
    sparked: number;
    prompts: string[];
  }>();

  for (const log of logs) {
    const stats = phaseStats.get(log.phase) || { total: 0, responded: 0, sparked: 0, prompts: [] };
    stats.total++;
    if (log.responded) stats.responded++;
    if (log.sparked) stats.sparked++;
    stats.prompts.push(log.prompt);
    phaseStats.set(log.phase, stats);
  }

  let count = 0;
  for (const [phase, stats] of phaseStats.entries()) {
    const hitRate = stats.total > 0 ? stats.responded / stats.total : 0;
    const bestPrompt = stats.prompts.length > 0
      ? findMostFrequent(stats.prompts)
      : null;

    await db.aIOptimizationSummary.create({
      data: {
        sceneType: 'story',
        referenceId: phase,
        bestPrompt: bestPrompt?.slice(0, 500) || null,
        hitRate,
        summaryDate: new Date(),
      },
    });
    count++;
  }

  console.log(`[AI Optimization] 催化总结: ${count} 条`);
  return count;
}

/**
 * 总结脑洞催化效果
 */
async function summarizeBrainholeLogs(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 获取昨日所有学习日志（brainhole 场景）
  const logs = await db.aILearningLog.findMany({
    where: {
      sceneType: 'brainhole',
      createdAt: { gte: oneDayAgo },
    },
  });

  if (logs.length === 0) return 0;

  // 按 referenceId 分组
  const refStats = new Map<string, {
    total: number;
    responded: number;
    sparked: number;
    avgLength: number;
    contents: string[];
  }>();

  for (const log of logs) {
    const id = log.referenceId || 'global';
    const stats = refStats.get(id) || { total: 0, responded: 0, sparked: 0, avgLength: 0, contents: [] };
    stats.total++;
    if (log.userResponded) stats.responded++;
    if (log.sparked) stats.sparked++;
    stats.avgLength += log.userReplyLength;
    stats.contents.push(log.aiContent);
    refStats.set(id, stats);
  }

  let count = 0;
  for (const [refId, stats] of refStats.entries()) {
    const hitRate = stats.total > 0 ? stats.responded / stats.total : 0;
    const avgResponseLength = stats.total > 0 ? stats.avgLength / stats.total : 0;
    const bestCatalyst = stats.contents.length > 0
      ? findMostFrequent(stats.contents)
      : null;

    await db.brainholeSummary.create({
      data: {
        brainholeId: refId === 'global' ? null : refId,
        bestCatalyst: bestCatalyst?.slice(0, 500) || null,
        hitRate,
        avgResponseLength,
        summaryDate: new Date(),
      },
    });
    count++;
  }

  console.log(`[AI Optimization] 脑洞总结: ${count} 条`);
  return count;
}

/**
 * 总结学习日志（按 sceneType）
 */
async function summarizeLearningLogs(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const sceneTypes = ['healing', 'story'] as const;
  let count = 0;

  for (const sceneType of sceneTypes) {
    const logs = await db.aILearningLog.findMany({
      where: {
        sceneType,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (logs.length === 0) continue;

    const total = logs.length;
    const responded = logs.filter((l) => l.userResponded).length;
    const sparked = logs.filter((l) => l.sparked).length;
    const hitRate = total > 0 ? responded / total : 0;

    // 找到最佳时机（回应率最高的 messageIndex）
    const timingStats = new Map<number, { total: number; responded: number }>();
    for (const log of logs) {
      const s = timingStats.get(log.messageIndex) || { total: 0, responded: 0 };
      s.total++;
      if (log.userResponded) s.responded++;
      timingStats.set(log.messageIndex, s);
    }

    let bestTiming: number | null = null;
    let bestTimingRate = 0;
    for (const [idx, s] of timingStats.entries()) {
      const rate = s.total > 0 ? s.responded / s.total : 0;
      if (rate > bestTimingRate) {
        bestTimingRate = rate;
        bestTiming = idx;
      }
    }

    await db.aIOptimizationSummary.create({
      data: {
        sceneType,
        bestTiming,
        hitRate,
        summaryDate: new Date(),
      },
    });
    count++;
  }

  console.log(`[AI Optimization] 学习总结: ${count} 条`);
  return count;
}

/**
 * 查找数组中出现频率最高的元素
 */
function findMostFrequent(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  let maxCount = 0;
  let maxItem = arr[0] || '';
  for (const [item, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxItem = item;
    }
  }
  return maxItem;
}

/**
 * 获取指定场景的最佳策略
 */
export async function getBestStrategy(
  sceneType: string,
  referenceId?: string
): Promise<{
  bestPrompt: string | null;
  bestTiming: number | null;
  hitRate: number;
} | null> {
  const summary = await db.aIOptimizationSummary.findFirst({
    where: {
      sceneType,
      referenceId: referenceId || null,
    },
    orderBy: { summaryDate: 'desc' },
  });

  if (!summary) return null;

  return {
    bestPrompt: summary.bestPrompt,
    bestTiming: summary.bestTiming,
    hitRate: summary.hitRate,
  };
}
