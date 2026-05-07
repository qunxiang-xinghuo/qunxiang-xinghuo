/**
 * AI 实时学习记录服务
 *
 * 在 AI 发出消息后，记录交互数据到 AILearningLog 表。
 * 用于后续的总结优化和反哺进化。
 */

import { db } from '@/lib/db';

type SceneType = 'healing' | 'brainhole' | 'story' | 'catalyst';

interface LearningLogEntry {
  sceneType: SceneType;
  referenceId?: string; // 脑洞ID/故事ID/房间ID
  aiContent: string;
  messageIndex: number;
  userResponded?: boolean;
  userReplyLength?: number;
  sparked?: boolean;
}

/**
 * 记录 AI 交互日志
 */
export async function recordLearningLog(entry: LearningLogEntry): Promise<void> {
  try {
    await db.aILearningLog.create({
      data: {
        sceneType: entry.sceneType,
        referenceId: entry.referenceId || null,
        aiContent: entry.aiContent.slice(0, 500), // 限制长度
        messageIndex: entry.messageIndex,
        userResponded: entry.userResponded ?? false,
        userReplyLength: entry.userReplyLength ?? 0,
        sparked: entry.sparked ?? false,
      },
    });
  } catch (e: any) {
    console.error('[AI Learning] 记录失败:', e.message);
    // 学习日志记录失败不应影响主流程
  }
}

/**
 * 记录催化效果日志
 */
export async function recordCatalystLog(params: {
  roomId: string;
  storyId?: string;
  prompt: string;
  phase: string;
  msgCount: number;
}): Promise<string> {
  try {
    const log = await db.catalystLog.create({
      data: {
        roomId: params.roomId,
        storyId: params.storyId || null,
        prompt: params.prompt.slice(0, 500),
        phase: params.phase,
        msgCount: params.msgCount,
      },
    });
    return log.id;
  } catch (e: any) {
    console.error('[AI Catalyst] 记录失败:', e.message);
    return '';
  }
}

/**
 * 更新催化效果（用户回应后调用）
 */
export async function updateCatalystResponse(
  logId: string,
  responded: boolean,
  sparked: boolean
): Promise<void> {
  if (!logId) return;
  try {
    await db.catalystLog.update({
      where: { id: logId },
      data: { responded, sparked },
    });
  } catch (e: any) {
    console.error('[AI Catalyst] 更新失败:', e.message);
  }
}

/**
 * 批量记录学习日志（用于高并发场景）
 */
export async function batchRecordLearningLogs(
  entries: LearningLogEntry[]
): Promise<void> {
  if (entries.length === 0) return;
  try {
    await db.aILearningLog.createMany({
      data: entries.map((e) => ({
        sceneType: e.sceneType,
        referenceId: e.referenceId || null,
        aiContent: e.aiContent.slice(0, 500),
        messageIndex: e.messageIndex,
        userResponded: e.userResponded ?? false,
        userReplyLength: e.userReplyLength ?? 0,
        sparked: e.sparked ?? false,
      })),
    });
  } catch (e: any) {
    console.error('[AI Learning] 批量记录失败:', e.message);
  }
}
