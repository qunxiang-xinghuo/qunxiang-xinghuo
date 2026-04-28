import { db } from "@/lib/db";
import { MatchCriteriaInput } from "@/lib/validators/match";

export interface MatchResult {
  matched: boolean;
  matchId?: string;
  roomId?: string;
  matchedUserId?: string;
  matchedUserIdentity?: string;
  message?: string;
}

export async function findMatch(
  userId: string,
  criteria: MatchCriteriaInput
): Promise<MatchResult> {
  const {
    brainholeId,
    excludeUserId,
    minLevel,
    maxLevel,
    preferDifferentIdentity,
    timeoutMinutes,
  } = criteria;

  // 检查用户是否已有活跃匹配
  const existingMatch = await db.matchRequest.findFirst({
    where: {
      userId,
      status: "waiting",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingMatch) {
    return {
      matched: false,
      message: "MATCH_ALREADY_EXISTS",
    };
  }

  // 创建新的匹配请求
  const matchRequest = await db.matchRequest.create({
    data: {
      userId,
      brainholeId,
      identity: criteria.identity || "default",
      preferDifferent: preferDifferentIdentity,
      status: "waiting",
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
    },
  });

  // 尝试寻找匹配
  const potentialMatches = await db.matchRequest.findMany({
    where: {
      brainholeId,
      status: "waiting",
      expiresAt: { gt: new Date() },
      userId: { not: excludeUserId || userId },
      OR: preferDifferentIdentity
        ? [{ identity: { not: criteria.identity || "default" } }]
        : undefined,
      // Filter by user level through the user relation
      // Note: This requires a join query
    },

    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (potentialMatches.length > 0) {
    // 找到匹配，选择最早的一个
    const matchedRequest = potentialMatches[0];

    // 创建房间
    const room = await db.room.create({
      data: {
        brainholeId,
        type: "duet",
        status: "created",
        maxRound: 10,
        currentRound: 0,
      },
    });

    // 更新两个匹配请求
    await Promise.all([
      db.matchRequest.update({
        where: { id: matchRequest.id },
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

    // 添加参与者
    await Promise.all([
      db.roomParticipant.create({
        data: {
          roomId: room.id,
          userId,
          identity: criteria.identity || "default",
          role: "actor",
          isOnline: true,
        },
      }),
      db.roomParticipant.create({
        data: {
          roomId: room.id,
          userId: matchedRequest.userId,
          identity: matchedRequest.identity,
          role: "actor",
          isOnline: true,
        },
      }),
    ]);

    return {
      matched: true,
      matchId: matchRequest.id,
      roomId: room.id,
      matchedUserId: matchedRequest.userId,
      matchedUserIdentity: matchedRequest.identity,
    };
  }

  // 没有找到匹配
  return {
    matched: false,
    matchId: matchRequest.id,
    message: "等待匹配中...",
  };
}

export async function cancelMatch(matchId: string, userId: string): Promise<boolean> {
  const match = await db.matchRequest.findUnique({
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
  const match = await db.matchRequest.findUnique({
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