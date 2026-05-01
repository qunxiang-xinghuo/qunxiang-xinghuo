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
}

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

  // 快速匹配模式：不指定脑洞，系统随机分配
  const isQuickMatch = mode === "quick";

  // 创建新的匹配请求（v4.3: 无论是否quick模式，都保存brainholeId）
  const matchRequest = await db.matchRequest.create({
    data: {
      userId,
      brainholeId: brainholeId || null,
      identity: criteria.identity || "default",
      preferDifferent: preferDifferentIdentity,
      status: "waiting",
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
    },
  });

  // 构建匹配查询条件
  const matchWhere: any = {
    status: "waiting",
    expiresAt: { gt: new Date() },
    userId: { not: excludeUserId || userId },
  };

  // 快速匹配模式：不限制脑洞；同脑洞模式：必须同脑洞
  if (!isQuickMatch && brainholeId) {
    matchWhere.brainholeId = brainholeId;
  }

  if (preferDifferentIdentity) {
    matchWhere.OR = [{ identity: { not: criteria.identity || "default" } }];
  }

  // 尝试寻找匹配
  const potentialMatches = await db.matchRequest.findMany({
    where: matchWhere,
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (potentialMatches.length > 0) {
    // ===== 多人模式：尝试找2-4个其他玩家（总共3-5人）=====
    if (mode === "multi" && potentialMatches.length >= 2) {
      const matchedRequests = potentialMatches.slice(0, 4);

      // 确定房间使用的脑洞ID（快速模式随机选一个）
      let roomBrainholeId = brainholeId;
      if (isQuickMatch || !brainholeId) {
        const randomBrainhole = await db.brainhole.findFirst({
          where: { status: "approved" },
          orderBy: { hotScore: "desc" },
        });
        roomBrainholeId = randomBrainhole?.id || brainholeId || "";
      }

      const room = await db.room.create({
        data: {
          brainholeId: roomBrainholeId || undefined,
          type: "multi",
          status: "created",
          maxRound: 10,
          currentRound: 0,
        },
      });

      await Promise.all([
        db.matchRequest.update({
          where: { id: matchRequest.id },
          data: {
            status: "matched",
            matchedUserId: matchedRequests[0].userId,
            roomId: room.id,
            resolvedAt: new Date(),
          },
        }),
        ...matchedRequests.map((m) =>
          db.matchRequest.update({
            where: { id: m.id },
            data: {
              status: "matched",
              matchedUserId: userId,
              roomId: room.id,
              resolvedAt: new Date(),
            },
          })
        ),
      ]);

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
        ...matchedRequests.map((m) =>
          db.roomParticipant.create({
            data: {
              roomId: room.id,
              userId: m.userId,
              identity: m.identity,
              role: "actor",
              isOnline: true,
            },
          })
        ),
      ]);

      return {
        matched: true,
        matchId: matchRequest.id,
        roomId: room.id,
        matchedCount: matchedRequests.length + 1,
        roomType: "multi",
        message: "群像组队成功",
      };
    }

    // ===== 双人模式 / 多人降级为双人 / 快速匹配 =====
    const matchedRequest = potentialMatches[0];

    // 确定房间使用的脑洞ID
    let roomBrainholeId = brainholeId;
    if (isQuickMatch || !brainholeId) {
      // 快速模式：优先使用对方的brainholeId，如果对方也没有则随机选
      roomBrainholeId = matchedRequest.brainholeId || brainholeId;
      if (!roomBrainholeId) {
        const randomBrainhole = await db.brainhole.findFirst({
          where: { status: "approved" },
          orderBy: { hotScore: "desc" },
        });
        roomBrainholeId = randomBrainhole?.id || "";
      }
    }

    const room = await db.room.create({
      data: {
        brainholeId: roomBrainholeId || undefined,
        type: "duet",
        status: "created",
        maxRound: 10,
        currentRound: 0,
      },
    });

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
      matchedCount: 2,
      roomType: "duet",
      message: isQuickMatch ? "快速匹配成功" : mode === "multi" ? "双人匹配成功（多人不足自动降级）" : "匹配成功",
    };
  }

  // 没有找到匹配
  return {
    matched: false,
    matchId: matchRequest.id,
    roomType: mode,
    message: mode === "multi" ? "等待组队中..." : isQuickMatch ? "快速匹配中..." : "等待匹配中...",
  };
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
