/**
 * POST /api/ai-training — 手动触发 AI 基础能力投喂
 * GET /api/ai-training — 查看 AI 修炼系统统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { feedBaseKnowledge, runDailyOptimization } from '@/lib/ai-training';
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils';

const ADMIN_KEY = process.env.CRAWLER_ADMIN_KEY || 'dev-crawler-key';

function checkAuth(req: NextRequest): boolean {
  return req.headers.get('x-admin-key') === ADMIN_KEY;
}

// POST — 手动触发基础能力投喂或总结优化
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(apiError('UNAUTHORIZED', '未授权'), { status: 401 });
  }

  try {
    const { action } = await request.json().catch(() => ({ action: 'feed' }));

    if (action === 'summary') {
      const result = await runDailyOptimization();
      return NextResponse.json(apiResponse(result));
    }

    const result = await feedBaseKnowledge();
    return NextResponse.json(apiResponse(result));
  } catch (e: any) {
    console.error('[AI Training API] 失败:', e.message);
    return NextResponse.json(apiError('INTERNAL_SERVER_ERROR', '执行失败'), { status: 500 });
  }
}

// GET — 查看统计
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(apiError('UNAUTHORIZED', '未授权'), { status: 401 });
  }

  try {
    const [trainingCount, learningCount, summaryCount, catalystCount] = await Promise.all([
      db.aITrainingData.count(),
      db.aILearningLog.count(),
      db.aIOptimizationSummary.count(),
      db.catalystLog.count(),
    ]);

    return NextResponse.json(
      apiResponse({
        trainingData: trainingCount,
        learningLogs: learningCount,
        optimizationSummaries: summaryCount,
        catalystLogs: catalystCount,
      })
    );
  } catch (e: any) {
    console.error('[AI Training API] 统计失败:', e.message);
    return NextResponse.json(apiError('INTERNAL_SERVER_ERROR', '查询失败'), { status: 500 });
  }
}
