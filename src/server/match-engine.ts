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
  strategy?: string;
  brainholeId?: string;
  brainholeTitle?: string;
}

/**
 * v6.0-fix 匹配引擎 — 从已参与脑洞匹配
 * 
 * 核心逻辑：
 * 1. 用户A发起匹配（带brainholeId）
 * 2. 系统查找：是否有其他等待用户B也选择了「已被参与过」的brainhole
 * 3. 如果没有：找任意等待用户B + 随机一个「已被参与过」的brainhole（排除双方已用过的）
 * 4. 如果完全没有等待用户：进入等待状态
 * 
 * 「已参与脑洞」定义：有matchRequest、reaction或collection记录的brainhole
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

  console.log("[MatchEngine v6.0-fix] findMatch start - userId:", userId, "brainholeId:", brainholeId, "identity:", identity);

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

  // === 2. 获取「已参与」的热门brainhole列表 ===
  const engagedBrainholes = await getEngagedBrainholes();
  console.log("[MatchEngine] 已参与brainhole数:", engagedBrainholes.length);

  // === 3. 创建新的匹配请求 ===
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

  // ========== 阶段1: 同brainhole精确匹配（且该brainhole已被参与过）==========
  if (brainholeId && engagedBrainholes.some(b => b.id === brainholeId)) {
    const stage1Matches = await db.matchRequest.findMany({
      where: { ...baseWhere, brainholeId },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (stage1Matches.length > 0) {
      console.log("[MatchEngine] 阶段1成功! 同brainhole匹配:", stage1Matches[0].userId);
      return await createDuetMatch(
        userId, matchRequest.id, stage1Matches[0],
        brainholeId, userBrainhole?.title || "",
        "same_brainhole", identity || "default"
      );
    }
  }

  // ========== 阶段2: 从「已参与」的brainhole中找等待用户 ==========
  console.log("[MatchEngine] ===== 阶段2: 已参与brainhole匹配 =====");
  const engagedIds = engagedBrainholes.map(b => b.id);
  
  if (engagedIds.length > 0) {
    const stage2Matches = await db.matchRequest.findMany({
      where: {
        ...baseWhere,
        brainholeId: { in: engagedIds },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (stage2Matches.length > 0) {
      const matchedBhId = stage2Matches[0].brainholeId || brainholeId || engagedIds[0];
      const matchedBh = engagedBrainholes.find(b => b.id === matchedBhId) || engagedBrainholes[0];
      console.log("[MatchEngine] 阶段2成功! 已参与brainhole匹配:", stage2Matches[0].userId, "brainhole:", matchedBh?.title);
      return await createDuetMatch(
        userId, matchRequest.id, stage2Matches[0],
        matchedBhId, matchedBh?.title || "",
        "engaged_brainhole", identity || "default"
      );
    }
  }

  // ========== 阶段3: 任意等待用户 + 「已参与」的随机brainhole ==========
  console.log("[MatchEngine] ===== 阶段3: 任意用户 + 随机已参与brainhole =====");
  const stage3Matches = await db.matchRequest.findMany({
    where: baseWhere,
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (stage3Matches.length > 0) {
    const matchedRequest = stage3Matches[0];
    
    // 确定最终brainhole：优先从「已参与」列表中选（排除双方已用过的）
    let finalBrainholeId = brainholeId || matchedRequest.brainholeId || "";
    let finalBrainholeTitle = userBrainhole?.title || "";

    if (!finalBrainholeId && engagedIds.length > 0) {
      // 排除双方已参与过的
      const excludeIds = await getUserUsedBrainholeIds(userId, matchedRequest.userId);
      const candidates = engagedBrainholes.filter(b => !excludeIds.has(b.id));
      const pool = candidates.length > 0 ? candidates : engagedBrainholes;
      const selected = pool[Math.floor(Math.random() * pool.length)];
      if (selected) {
        finalBrainholeId = selected.id;
        finalBrainholeTitle = selected.title;
      }
    }

    // 如果还是选不到，随机选一个approved的brainhole
    if (!finalBrainholeId) {
      const randomBh = await pickRandomBrainhole();
      if (randomBh) {
        finalBrainholeId = randomBh.id;
        finalBrainholeTitle = randomBh.title;
      }
    }

    console.log("[MatchEngine] 阶段3成功! 用户:", matchedRequest.userId, "brainhole:", finalBrainholeTitle);
    return await createDuetMatch(
      userId, matchRequest.id, matchedRequest,
      finalBrainholeId, finalBrainholeTitle,
      "random_pairing", identity || "default"
    );
  }

  // ========== 阶段4: 没有等待用户，进入等待状态 ==========
  console.log("[MatchEngine] ===== 阶段4: 无匹配用户，进入等待 =====");
  
  let waitingBrainholeId = brainholeId || "";
  let waitingBrainholeTitle = userBrainhole?.title || "";
  
  if (!waitingBrainholeId && engagedIds.length > 0) {
    const selected = engagedBrainholes[Math.floor(Math.random() * engagedBrainholes.length)];
    waitingBrainholeId = selected.id;
    waitingBrainholeTitle = selected.title;
    await db.matchRequest.update({
      where: { id: matchRequest.id },
      data: { brainholeId: waitingBrainholeId },
    });
  }

  if (!waitingBrainholeId) {
    const randomBh = await pickRandomBrainhole();
    if (randomBh) {
      waitingBrainholeId = randomBh.id;
      waitingBrainholeTitle = randomBh.title;
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

  console.log("[MatchEngine] 房间创建成功, ID:", room.id, "策略:", strategy);
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
      : strategy === "engaged_brainhole"
      ? "从热门参与话题中为你匹配"
      : "为你匹配了一位新朋友",
    strategy,
    brainholeId,
    brainholeTitle,
  };
}

/**
 * 获取「已参与」的brainhole列表（有matchRequest/reaction/collection的）
 */
async function getEngagedBrainholes() {
  // 获取有matchRequest的brainhole（groupBy自动包含null分组，后续用if过滤）
  const matchedBhIds = await db.matchRequest.groupBy({
    by: ['brainholeId'],
    _count: { brainholeId: true },
  });

  const reactionBhIds = await db.reaction.groupBy({
    by: ['brainholeId'],
    _count: { brainholeId: true },
  });

  const collectionBhIds = await db.brainholeCollection.groupBy({
    by: ['brainholeId'],
    _count: { brainholeId: true },
  });

  const engagedIds = new Set<string>();
  matchedBhIds.forEach(m => { if (m.brainholeId) engagedIds.add(m.brainholeId); });
  reactionBhIds.forEach(r => { if (r.brainholeId) engagedIds.add(r.brainholeId); });
  collectionBhIds.forEach(c => { if (c.brainholeId) engagedIds.add(c.brainholeId); });

  if (engagedIds.size === 0) {
    // 没有已参与的，返回热门的approved brainhole
    return await db.brainhole.findMany({
      where: { status: "approved" },
      orderBy: { hotScore: "desc" },
      take: 30,
    });
  }

  return await db.brainhole.findMany({
    where: {
      id: { in: Array.from(engagedIds) },
      status: "approved",
    },
    orderBy: { hotScore: "desc" },
    take: 30,
  });
}

/**
 * 获取两个用户已使用过的brainhole id集合
 */
async function getUserUsedBrainholeIds(userId1: string, userId2: string) {
  const excludeIds = new Set<string>();
  
  const [reacted1, reacted2] = await Promise.all([
    db.reaction.findMany({ where: { userId: userId1 }, select: { brainholeId: true }, take: 100 }),
    db.reaction.findMany({ where: { userId: userId2 }, select: { brainholeId: true }, take: 100 }),
  ]);
  
  reacted1.forEach(r => { if (r.brainholeId) excludeIds.add(r.brainholeId); });
  reacted2.forEach(r => { if (r.brainholeId) excludeIds.add(r.brainholeId); });
  
  return excludeIds;
}

/**
 * 从approved池中随机选brainhole
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
