import { db } from "./db";

interface HotScoreParams {
  sparkCount: number;
  messageCount: number;
  likeCount: number;
  commentCount: number;
  conversationRounds: number;
  createdAt: Date;
}

/**
 * 综合热度计算公式（v10.0）
 *
 * 权重设计：
 * - sparkCount * 15     — 火花标记是核心价值指标
 * - messageCount * 3    — 消息量反映参与度
 * - likeCount * 8       — 点赞反映质量认可
 * - commentCount * 5    — 评论反映讨论深度
 * - conversationRounds * 10 — 对话轮次反映互动深度（新增）
 * - timeDecay           — 时间衰减，每天减 2 分（上限 30 天）
 */
export function calculateHotScore(params: HotScoreParams): number {
  const {
    sparkCount,
    messageCount,
    likeCount,
    commentCount,
    conversationRounds,
    createdAt,
  } = params;

  const daysSinceCreation = Math.min(
    Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    30
  );
  const timeDecay = daysSinceCreation * 2;

  const score =
    sparkCount * 15 +
    messageCount * 3 +
    likeCount * 8 +
    commentCount * 5 +
    conversationRounds * 10 -
    timeDecay;

  return Math.max(0, Math.round(score));
}

/**
 * 计算对话轮次：统计发言者切换次数
 * 两条相邻消息如果 senderId 或 identity 不同，算一轮新对话
 */
export function countConversationRounds(
  messages: { senderId: string | null; identity: string | null }[]
): number {
  if (messages.length <= 1) return 0;

  let rounds = 0;
  let currentSpeaker = messages[0].senderId || messages[0].identity || "";

  for (let i = 1; i < messages.length; i++) {
    const speaker = messages[i].senderId || messages[i].identity || "";
    if (speaker && speaker !== currentSpeaker) {
      rounds++;
      currentSpeaker = speaker;
    }
  }

  return rounds;
}

/**
 * 重新计算并更新某个 Asset 的 hotScore
 * 会从数据库拉取最新关联数据（likes、comments、messages）
 */
export async function recalculateAssetHotScore(assetId: string): Promise<number> {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    include: {
      room: {
        include: {
          messages: {
            select: { senderId: true, identity: true },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { comments: true },
          },
        },
      },
      likes: true,
    },
  });

  if (!asset) return 0;

  const likeCount = asset.likes.length;
  const commentCount = asset.room?._count.comments || 0;
  const conversationRounds = asset.room?.messages
    ? countConversationRounds(asset.room.messages)
    : 0;

  const hotScore = calculateHotScore({
    sparkCount: asset.sparkCount || 0,
    messageCount: asset.messageCount || 0,
    likeCount,
    commentCount,
    conversationRounds,
    createdAt: asset.createdAt,
  });

  await db.asset.update({
    where: { id: assetId },
    data: { hotScore },
  });

  return hotScore;
}
