/**
 * 知乎热榜脑洞抓取系统 — 核心流程
 *
 * 完整流程：抓取热榜 → 过滤 → AI转化 → 存入数据库
 * 定时策略：服务启动时执行一次，之后每6小时执行一次
 */

import { db } from '@/lib/db';
import { fetchZhihuHotList, filterHotItems } from './zhihu-hot';
import { transformHotItem } from './ai-transform';

let crawlerTimer: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * 执行一次完整的抓取+转化流程
 */
export async function runCrawlerOnce(): Promise<{
  fetched: number;
  filtered: number;
  transformed: number;
  saved: number;
}> {
  if (isRunning) {
    console.log('[Crawler] 上次任务仍在运行，跳过');
    return { fetched: 0, filtered: 0, transformed: 0, saved: 0 };
  }

  isRunning = true;
  console.log('[Crawler] ====== 开始抓取知乎热榜 ======', new Date().toISOString());

  try {
    // 1. 抓取热榜
    const hotItems = await fetchZhihuHotList(20);
    console.log(`[Crawler] 抓取到 ${hotItems.length} 条热榜话题`);

    // 2. 过滤不适合的话题
    const filtered = filterHotItems(hotItems);
    console.log(`[Crawler] 过滤后剩余 ${filtered.length} 条`);

    // 3. 转化为脑洞（串行执行，避免API限流）
    let transformed = 0;
    let saved = 0;

    for (const item of filtered.slice(0, 10)) {
      // 检查是否已存在相同标题的脑洞（24小时内）
      const existing = await db.brainhole.findFirst({
        where: {
          title: item.title,
          source: 'zhihu_hot',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (existing) {
        console.log(`[Crawler] 跳过已存在: ${item.title}`);
        continue;
      }

      const result = await transformHotItem(item);
      transformed++;

      if (!result) {
        console.warn(`[Crawler] 转化失败: ${item.title}`);
        continue;
      }

      // 4. 存入数据库
      try {
        // 先创建标签（如果不存在）
        const tagIds: string[] = [];
        for (const tagName of result.tags) {
          const tag = await db.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          tagIds.push(tag.id);
        }

        // 创建 Brainhole
        const brainhole = await db.brainhole.create({
          data: {
            title: result.title,
            scenario: result.scenario,
            difficulty: result.difficulty,
            source: 'zhihu_hot',
            category: 'zhihu_hot',
            status: 'approved',
            hotScore: 50, // 新抓取的热度基准分
          },
        });

        // 关联标签（逐个创建，避免 SQLite createMany skipDuplicates 不支持）
        for (const tagId of tagIds) {
          try {
            await db.brainholeTag.create({
              data: { brainholeId: brainhole.id, tagId },
            });
          } catch {
            // 重复关联忽略
          }
        }

        saved++;
        console.log(`[Crawler] 已保存: ${result.title}`);
      } catch (e: any) {
        console.error(`[Crawler] 保存失败: ${item.title}`, e.message);
      }

      // 每条之间间隔 1 秒，避免 API 限流
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`[Crawler] ====== 完成: ${saved}/${transformed} 条已保存 ======`);
    return { fetched: hotItems.length, filtered: filtered.length, transformed, saved };
  } catch (e: any) {
    console.error('[Crawler] 流程异常:', e.message);
    return { fetched: 0, filtered: 0, transformed: 0, saved: 0 };
  } finally {
    isRunning = false;
  }
}

/**
 * 启动定时抓取任务
 * 立即执行一次，之后每6小时执行一次
 */
export function startCrawlerSchedule(): void {
  // 立即执行一次（延迟 30 秒，等服务完全启动）
  setTimeout(() => {
    runCrawlerOnce().catch((e) => console.error('[Crawler] 首次执行失败:', e));
  }, 30000);

  // 每6小时执行一次
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  crawlerTimer = setInterval(() => {
    runCrawlerOnce().catch((e) => console.error('[Crawler] 定时执行失败:', e));
  }, SIX_HOURS);

  console.log('[Crawler] 定时任务已启动，每6小时执行一次');
}

/**
 * 停止定时任务（用于测试或优雅关闭）
 */
export function stopCrawlerSchedule(): void {
  if (crawlerTimer) {
    clearInterval(crawlerTimer);
    crawlerTimer = null;
    console.log('[Crawler] 定时任务已停止');
  }
}
