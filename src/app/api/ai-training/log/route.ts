/**
 * POST /api/ai-training/log — 接收客户端发送的 AI 学习日志
 *
 * 客户端通过此 API 记录学习日志，避免直接访问 Prisma。
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordLearningLog, recordCatalystLog } from '@/lib/ai-training';
import { apiResponse, apiError } from '@/lib/utils';
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === 'catalyst') {
      const logId = await recordCatalystLog({
        roomId: body.roomId,
        storyId: body.storyId,
        prompt: body.prompt,
        phase: body.phase,
        msgCount: body.msgCount,
      });
      return NextResponse.json(apiResponse({ logId }));
    }

    if (body.type === 'learning') {
      await recordLearningLog({
        sceneType: body.sceneType,
        referenceId: body.referenceId,
        aiContent: body.aiContent,
        messageIndex: body.messageIndex,
      });
      return NextResponse.json(apiResponse({ success: true }));
    }

    return NextResponse.json(apiError('BAD_REQUEST', '未知日志类型'), { status: 400 });
  } catch (e: unknown) {
    console.error('[AI Training Log API] 失败:', getErrorMessage(e));
    return NextResponse.json(apiError('INTERNAL_SERVER_ERROR', '记录失败'), { status: 500 });
  }
}
