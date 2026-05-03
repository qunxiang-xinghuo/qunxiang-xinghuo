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
 * v6.0-fix2 匹配引擎 — 修复并发匹配bug
 * 
 * 核心修复：创建自己的matchRequest后，再次查找其他waiting用户。
 * 解决"两个用户几乎同时匹配但未匹配上"的问题。
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

  console.log("[MatchEngine v6.0-fix2] findMatch start - userId:", userId, "brainholeId:", brainholeId, "identity:", identity);

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
  if (brainholeId) {
    const stage1Matches = await db.matchRequest.findMany({
      where: { ...baseWhere, brainholeId },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (stage1Matches.length > 0) {
      console.log("[MatchEngine] 阶段1成功! 同brainhole匹配:", stage1Matches[0].userId);
      return await createDuetMatch(
        userId, "", stage1Matches[0],
        brainholeId, userBrainhole?.title || "",
        "same_brainhole", identity || "default"
      );
    }
  }

  // ========== 阶段2: 任意等待用户匹配 ==========
  const stage2Matches = await db.matchRequest.findMany({
    where: baseWhere,
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (stage2Matches.length > 0) {
    const matchedRequest = stage2Matches[0];
    let finalBrainholeId = brainholeId || matchedRequest.brainholeId || "";
    let finalBrainholeTitle = userBrainhole?.title || "";

    if (!finalBrainholeId) {
      const randomBh = await pickRandomBrainhole();
      if (randomBh) {
        finalBrainholeId = randomBh.id;
        finalBrainholeTitle = randomBh.title;
      }
    }

    console.log("[MatchEngine] 阶段2成功! 用户:", matchedRequest.userId, "brainhole:", finalBrainholeTitle);
    return await createDuetMatch(
      userId, "", matchedRequest,
      finalBrainholeId, finalBrainholeTitle,
      "random_pairing", identity || "default"
    );
  }

  // ========== 阶段3: 没有等待用户，创建自己的请求 ==========
  console.log("[MatchEngine] 无等待用户，创建waiting请求...");
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

  // ========== v6.0-fix2: 二次匹配 —— 修复并发bug ==========
  // 原因：如果对方在我们查询和创建请求之间也创建了请求，
  // 那么我们在阶段1/2中看不到对方。创建自己的请求后，
  // 再次查找，确保能和对方匹配上。
  console.log("[MatchEngine] v6.0-fix2 二次匹配检查...");
  const retryWhere = {
    status: "waiting",
    expiresAt: { gt: new Date() },
    userId: { not: userId },
    id: { not: matchRequest.id }, // 排除自己刚创建的请求
  };

  const retryMatches = await db.matchRequest.findMany({
    where: retryWhere,
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (retryMatches.length > 0) {
    const matchedRequest = retryMatches[0];
    let finalBrainholeId = brainholeId || matchedRequest.brainholeId || "";
    let finalBrainholeTitle = userBrainhole?.title || "";

    if (!finalBrainholeId) {
      const randomBh = await pickRandomBrainhole();
      if (randomBh) {
        finalBrainholeId = randomBh.id;
        finalBrainholeTitle = randomBh.title;
      }
    }

    console.log("[MatchEngine] 二次匹配成功! 用户:", matchedRequest.userId);
    return await createDuetMatch(
      userId, matchRequest.id, matchedRequest,
      finalBrainholeId, finalBrainholeTitle,
      "retry_pairing", identity || "default"
    );
  }

  // ========== 阶段4: 真正进入等待状态 ==========
  console.log("[MatchEngine] 进入等待状态. matchId:", matchRequest.id);

  let waitingBrainholeId = brainholeId || "";
  let waitingBrainholeTitle = userBrainhole?.title || "";

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

  const updates: Promise<any>[] = [
    db.matchRequest.update({
      where: { id: matchedRequest.id },
      data: {
        status: "matched",
        matchedUserId: userId,
        roomId: room.id,
        resolvedAt: new Date(),
      },
    }),
  ];

  // 如果当前用户也创建了matchRequest，也更新它
  if (matchRequestId) {
    updates.push(
      db.matchRequest.update({
        where: { id: matchRequestId },
        data: {
          status: "matched",
          matchedUserId: matchedRequest.userId,
          roomId: room.id,
          resolvedAt: new Date(),
        },
      })
    );
  } else {
    // 如果没创建（阶段1/2直接命中），创建一个已匹配的请求
    updates.push(
      db.matchRequest.create({
        data: {
          userId,
          brainholeId: brainholeId || null,
          identity: identity || "default",
          status: "matched",
          matchedUserId: matchedRequest.userId,
          roomId: room.id,
          resolvedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 1000),
        },
      })
    );
  }

  await Promise.all(updates);

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
    matchId: matchRequestId || "direct",
    roomId: room.id,
    matchedUserId: matchedRequest.userId,
    matchedUserIdentity: matchedRequest.identity,
    matchedCount: 2,
    roomType: "duet",
    message: strategy === "same_brainhole"
      ? "找到同样对这个话题感兴趣的人"
      : strategy === "retry_pairing"
      ? "匹配成功"
      : "为你匹配了一位新朋友",
    strategy,
    brainholeId,
    brainholeTitle,
  };
}

/**
 * 获取「已参与」的brainhole列表
 */
async function getEngagedBrainholes() {
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
