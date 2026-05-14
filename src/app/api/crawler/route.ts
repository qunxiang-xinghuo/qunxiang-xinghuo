/**
 * POST /api/crawler — 手动触发知乎热榜脑洞抓取
 * GET /api/crawler/status — 获取上次抓取状态
 *
 * 仅管理员可调用（简单认证：检查 x-admin-key header）
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCrawlerOnce } from '@/lib/crawler';
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/utils';
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

const ADMIN_KEY = process.env.CRAWLER_ADMIN_KEY || 'dev-crawler-key';

// POST — 手动触发抓取
export async function POST(request: NextRequest) {
  try {
    // 简单管理员认证
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(apiError('UNAUTHORIZED', '未授权'), { status: 401 });
    }

    const result = await runCrawlerOnce();
    return NextResponse.json(apiResponse(result));
  } catch (e: unknown) {
    console.error('[Crawler API] 手动触发失败:', getErrorMessage(e));
    return NextResponse.json(apiError('INTERNAL_SERVER_ERROR', '抓取失败'), { status: 500 });
  }
}

// GET — 获取抓取状态统计
export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(apiError('UNAUTHORIZED', '未授权'), { status: 401 });
    }

    // 统计最近7天的知乎热榜脑洞数量
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, recent, latest] = await Promise.all([
      db.brainhole.count({ where: { source: 'zhihu_hot' } }),
      db.brainhole.count({
        where: { source: 'zhihu_hot', createdAt: { gte: sevenDaysAgo } },
      }),
      db.brainhole.findFirst({
        where: { source: 'zhihu_hot' },
        orderBy: { createdAt: 'desc' },
        select: { title: true, createdAt: true },
      }),
    ]);

    return NextResponse.json(
      apiResponse({
        total,
        recent7d: recent,
        latest: latest
          ? { title: latest.title, createdAt: latest.createdAt.toISOString() }
          : null,
      })
    );
  } catch (e: unknown) {
    console.error('[Crawler API] 状态查询失败:', getErrorMessage(e));
    return NextResponse.json(apiError('INTERNAL_SERVER_ERROR', '查询失败'), { status: 500 });
  }
}
