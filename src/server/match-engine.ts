import { db } from "@/lib/db";
import { MatchCriteriaInput } from "@/lib/validators/match";

export interface MatchResult {
  matched: boolean;
  matchId?: string;
  roomId?: string;
  matchedUserId?: string;
  matchedUserIdentity?: string;
  matchedCount?: number;
  roomType?: string;
  message?: string;
  strategy?: string;       // 匹配策略阶段: same_brainhole | same_category | random_engaged | random_any
  brainholeId?: string;   // 最终使用的brainholeId
  brainholeTitle?: string; // 最终使用的brainhole标题
}

/**
 * v6.0 匹配引擎 — 四级降级策略
 * 
 * 阶段1（0-3秒）: 同brainhole精确匹配
 *   → 找到 → 立刻匹配，文案："找到同样对这个话题感兴趣的人"
 * 
 * 阶段2（3-6秒）: 同分类兴趣匹配
 *   → 找到 → 立刻匹配，文案："你们都喜欢【分类】类话题"
 * 
 * 阶段3（6-10秒）: 任意活跃用户 + 双方未参与的随机brainhole
 *   → 从"已有人参与"的热门brainhole中随机选
 *   → 找到 → 立刻匹配，文案："为你匹配了一位新朋友"
 * 
 * 阶段4（10-15秒）: 扩大搜索范围
 *   → 仍无 → 进入等待，文案："正在扩大搜索范围..."
 */
export async function findMatch(
  userId: string,
  criteria: MatchCriteriaInput
): Promise<MatchResult> {
  const {
    brainholeId,
    excludeUserId,
    preferDifferentIdentity,
    timeoutMinutes,
    mode,
    identity,
  } = criteria;

  console.log("[MatchEngine v6.0] findMatch 开始 - userId:", userId, "mode:", mode, "brainholeId:", brainholeId, "identity:", identity);

  // === 0. 检查用户是否已有活跃匹配 ===
  const existingMatch = await db.matchRequest.findFirst({
    where: {
      userId,
      status: "waiting",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingMatch) {
    console.log("[MatchEngine] 用户已有活跃匹配:", existingMatch.id);
    return {
      matched: false,
      message: "MATCH_ALREADY_EXISTS",
    };
  }

  // === 1. 获取用户选择的brainhole信息 ===
  let userBrainhole = null;
  if (brainholeId) {
    userBrainhole = await db.brainhole.findUnique({
      where: { id: brainholeId },
      select: { id: true, title: true, category: true },
    });
  }

  // === 2. 创建新的匹配请求 ===
  console.log("[MatchEngine] 无活跃匹配，创建新请求");
  const matchRequest = await db.matchRequest.create({
    data: {
      userId,
      brainholeId: brainholeId || null,
      identity: identity || "default",
      preferDifferent: preferDifferentIdentity,
      status: "waiting",
      expiresAt: new Date(Date.now() + (timeoutMinutes || 1) * 60 * 1000),
    },
  });

  const now = new Date();
  const baseWhere: any = {
    status: "waiting",
    expiresAt: { gt: now },
    userId: { not: excludeUserId || userId },
  };

  if (preferDifferentIdentity) {
    baseWhere.OR = [{ identity: { not: identity || "default" } }];
  }

  // ========== 阶段1: 同brainhole精确匹配 ==========
  console.log("[MatchEngine] ===== 阶段1: 同brainhole精确匹配 =====");
  if (brainholeId) {
    const stage1Where = { ...baseWhere, brainholeId };
    const stage1Matches = await db.matchRequest.findMany({
      where: stage1Where,
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (stage1Matches.length > 0) {
      console.log("[MatchEngine] 阶段1成功! 匹配到同brainhole用户:", stage1Matches[0].userId);
      return await createDuetMatch(
        userId, matchRequest.id, stage1Matches[0],
        brainholeId, userBrainhole?.title || "",
        "same_brainhole", identity || "default"
      );
    }
  }

  // ========== 阶段2: 同分类兴趣匹配 ==========
  console.log("[MatchEngine] ===== 阶段2: 同分类兴趣匹配 =====");
  if (userBrainhole?.category) {
    // 找到等待中且选择了同分类brainhole的用户
    const stage2Matches = await db.matchRequest.findMany({
      where: {
        ...baseWhere,
        brainhole: {
          category: userBrainhole.category,
        },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (stage2Matches.length > 0) {
      const matchedBrainholeId = stage2Matches[0].brainholeId || brainholeId;
      let matchedBrainholeTitle = userBrainhole?.title || "";
      if (stage2Matches[0].brainholeId && stage2Matches[0].brainholeId !== brainholeId) {
        const bh = await db.brainhole.findUnique({
          where: { id: stage2Matches[0].brainholeId },
          select: { title: true },
        });
        matchedBrainholeTitle = bh?.title || matchedBrainholeTitle;
      }
      console.log("[MatchEngine] 阶段2成功! 匹配到同分类用户:", stage2Matches[0].userId, "分类:", userBrainhole.category);
      return await createDuetMatch(
        userId, matchRequest.id, stage2Matches[0],
        matchedBrainholeId || brainholeId || "", matchedBrainholeTitle,
        "same_category", identity || "default"
      );
    }
  }

  // ========== 阶段3: 任意等待用户 + 已有人参与的随机brainhole ==========
  console.log("[MatchEngine] ===== 阶段3: 任意用户 + 热门brainhole =====");
  const stage3Matches = await db.matchRequest.findMany({
    where: baseWhere,
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (stage3Matches.length > 0) {
    const matchedRequest = stage3Matches[0];
    
    // 确定最终brainhole：优先从"已有人参与"的热门brainhole中选
    let finalBrainholeId = brainholeId || matchedRequest.brainholeId || "";
    let finalBrainholeTitle = userBrainhole?.title || "";

    // 如果双方都没有指定brainhole，或想换个新话题，从已有人参与的brainhole中选
    if (!finalBrainholeId) {
      const engagedBrainhole = await pickRandomEngagedBrainhole(userId, matchedRequest.userId);
      if (engagedBrainhole) {
        finalBrainholeId = engagedBrainhole.id;
        finalBrainholeTitle = engagedBrainhole.title;
        console.log("[MatchEngine] 从已参与brainhole中随机选择:", finalBrainholeTitle);
      }
    }

    // 如果还是选不到，从approved池中热度加权随机选
    if (!finalBrainholeId) {
      const randomBh = await pickRandomBrainhole();
      if (randomBh) {
        finalBrainholeId = randomBh.id;
        finalBrainholeTitle = randomBh.title;
        console.log("[MatchEngine] 从approved池中热度加权随机选择:", finalBrainholeTitle);
      }
    }

    console.log("[MatchEngine] 阶段3成功! 匹配到用户:", matchedRequest.userId, "brainhole:", finalBrainholeTitle);
    return await createDuetMatch(
      userId, matchRequest.id, matchedRequest,
      finalBrainholeId, finalBrainholeTitle,
      "random_engaged", identity || "default"
    );
  }

  // ========== 阶段4: 没有等待用户，进入等待状态 ==========
  console.log("[MatchEngine] ===== 阶段4: 无匹配用户，进入等待 =====");
  
  // 为用户分配一个"已有人参与"的热门brainhole作为等待话题
  let waitingBrainholeId = brainholeId || "";
  let waitingBrainholeTitle = userBrainhole?.title || "";
  
  if (!waitingBrainholeId) {
    const engagedBh = await pickRandomEngagedBrainhole(userId, null);
    if (engagedBh) {
      waitingBrainholeId = engagedBh.id;
      waitingBrainholeTitle = engagedBh.title;
      // 更新matchRequest的brainholeId
      await db.matchRequest.update({
        where: { id: matchRequest.id },
        data: { brainholeId: waitingBrainholeId },
      });
    }
  }

  console.log("[MatchEngine] 未找到匹配，进入等待. matchId:", matchRequest.id, "brainhole:", waitingBrainholeTitle);
  return {
    matched: false,
    matchId: matchRequest.id,
    roomType: mode,
    message: "waiting",
    strategy: "waiting_for_any",
    brainholeId: waitingBrainholeId,
    brainholeTitle: waitingBrainholeTitle,
  };
}

/**
 * 创建双人匹配房间
 */
async function createDuetMatch(
  userId: string,
  matchRequestId: string,
  matchedRequest: any,
  brainholeId: string,
  brainholeTitle: string,
  strategy: string,
  identity: string
): Promise<MatchResult> {
  const room = await db.room.create({
    data: {
      brainholeId: brainholeId || undefined,
      type: "duet",
      status: "created",
      maxRound: 10,
      currentRound: 0,
    },
  });

  await Promise.all([
    db.matchRequest.update({
      where: { id: matchRequestId },
      data: {
        status: "matched",
        matchedUserId: matchedRequest.userId,
        roomId: room.id,
        resolvedAt: new Date(),
      },
    }),
    db.matchRequest.update({
      where: { id: matchedRequest.id },
      data: {
        status: "matched",
        matchedUserId: userId,
        roomId: room.id,
        resolvedAt: new Date(),
      },
    }),
  ]);

  await Promise.all([
    db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        identity: identity || "default",
        role: "actor",
        isOnline: true,
      },
    }),
    db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: matchedRequest.userId,
        identity: matchedRequest.identity || "default",
        role: "actor",
        isOnline: true,
      },
    }),
  ]);

  console.log("[MatchEngine] 双人房间创建成功, ID:", room.id, "策略:", strategy);
  return {
    matched: true,
    matchId: matchRequestId,
    roomId: room.id,
    matchedUserId: matchedRequest.userId,
    matchedUserIdentity: matchedRequest.identity,
    matchedCount: 2,
    roomType: "duet",
    message: strategy === "same_brainhole" 
      ? "找到同样对这个话题感兴趣的人"
      : strategy === "same_category"
      ? "你们都喜欢这类话题"
      : "为你匹配了一位新朋友",
    strategy,
    brainholeId,
    brainholeTitle,
  };
}

/**
 * 从"已有人参与"的brainhole中随机选一个（排除已参与的双方）
 */
async function pickRandomEngagedBrainhole(excludeUserId1: string | null, excludeUserId2: string | null) {
  // 获取"已有人参与"的热门brainhole（有reaction或collection）
  const engaged = await db.brainhole.findMany({
    where: {
      status: "approved",
      OR: [
        { reactionCount: { gt: 0 } },
        { collectionCount: { gt: 0 } },
      ],
    },
    orderBy: { hotScore: "desc" },
    take: 30,
  });

  if (engaged.length === 0) return null;

  // 排除双方已经参与过的brainhole
  const excludeIds = new Set<string>();
  if (excludeUserId1) {
    const reacted1 = await db.reaction.findMany({
      where: { userId: excludeUserId1 },
      select: { brainholeId: true },
      take: 100,
    });
    reacted1.forEach(r => { if (r.brainholeId) excludeIds.add(r.brainholeId); });
  }
  if (excludeUserId2) {
    const reacted2 = await db.reaction.findMany({
      where: { userId: excludeUserId2 },
      select: { brainholeId: true },
      take: 100,
    });
    reacted2.forEach(r => { if (r.brainholeId) excludeIds.add(r.brainholeId); });
  }

  const candidates = engaged.filter(b => !excludeIds.has(b.id));
  const pool = candidates.length > 0 ? candidates : engaged;

  // 热度加权随机
  const totalScore = pool.reduce((sum, b) => sum + (b.hotScore || 1), 0);
  let randomPoint = Math.random() * totalScore;
  for (const b of pool) {
    randomPoint -= (b.hotScore || 1);
    if (randomPoint <= 0) return b;
  }
  return pool[0];
}

/**
 * 从approved池中热度加权随机选brainhole
 */
async function pickRandomBrainhole() {
  const pool = await db.brainhole.findMany({
    where: { status: "approved" },
    orderBy: { hotScore: "desc" },
    take: 50,
  });
  if (pool.length === 0) return null;

  const totalScore = pool.reduce((sum, b) => sum + (b.hotScore || 1), 0);
  let randomPoint = Math.random() * totalScore;
  for (const b of pool) {
    randomPoint -= (b.hotScore || 1);
    if (randomPoint <= 0) return b;
  }
  return pool[0];
}

export async function cancelMatch(matchId: string, userId: string): Promise<boolean> {
  const match = await db.matchRequest.findFirst({
    where: { id: matchId, userId },
  });

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  if (match.status !== "waiting") {
    throw new Error("MATCH_ALREADY_RESOLVED");
  }

  await db.matchRequest.update({
    where: { id: matchId },
    data: {
      status: "cancelled",
      resolvedAt: new Date(),
    },
  });

  return true;
}

export async function checkMatchStatus(matchId: string, userId: string) {
  const match = await db.matchRequest.findFirst({
    where: { id: matchId, userId },
    include: {
      brainhole: true,
    },
  });

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  // 检查是否超时
  if (match.status === "waiting" && match.expiresAt < new Date()) {
    await db.matchRequest.update({
      where: { id: matchId },
      data: {
        status: "timeout",
        resolvedAt: new Date(),
      },
    });
    match.status = "timeout";
  }

  return match;
}
