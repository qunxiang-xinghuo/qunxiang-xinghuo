/**
 * AI 自我修炼系统 — 星火进化链
 *
 * 主入口，整合所有模块：
 * 1. 基础能力投喂（冷启动）
 * 2. 实时学习记录
 * 3. 定期总结优化
 * 4. 反哺进化（读取历史最佳策略）
 */

import { feedBaseKnowledge } from './feed-base-knowledge';
import { runDailyOptimization } from './optimization-summary';

let optimizationTimer: NodeJS.Timeout | null = null;

/**
 * 启动 AI 进化链定时任务
 * - 服务启动时执行基础能力投喂（延迟 60 秒）
 * - 每天凌晨 3 点执行总结优化
 */
export function startAIEvolutionSchedule(): void {
  // 延迟 60 秒执行基础能力投喂（等服务完全启动）
  setTimeout(() => {
    feedBaseKnowledge().catch((e) =>
      console.error('[AI Evolution] 基础投喂失败:', e)
    );
  }, 60000);

  // 每天凌晨 3 点执行总结优化
  const now = new Date();
  const next3am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 3, 0, 0);
  const msUntil3am = next3am.getTime() - now.getTime();

  setTimeout(() => {
    runDailyOptimization().catch((e) =>
      console.error('[AI Evolution] 首次总结失败:', e)
    );

    // 之后每 24 小时执行一次
    optimizationTimer = setInterval(() => {
      runDailyOptimization().catch((e) =>
        console.error('[AI Evolution] 定时总结失败:', e)
      );
    }, 24 * 60 * 60 * 1000);
  }, msUntil3am);

  console.log('[AI Evolution] 星火进化链已启动，下次总结:', next3am.toISOString());
}

/**
 * 停止定时任务
 */
export function stopAIEvolutionSchedule(): void {
  if (optimizationTimer) {
    clearInterval(optimizationTimer);
    optimizationTimer = null;
    console.log('[AI Evolution] 定时任务已停止');
  }
}

// 导出子模块
export { feedBaseKnowledge } from './feed-base-knowledge';
export {
  recordLearningLog,
  recordCatalystLog,
  updateCatalystResponse,
} from './learning-log';
export { runDailyOptimization, getBestStrategy } from './optimization-summary';
export { getTrainingKnowledge } from './feed-base-knowledge';
