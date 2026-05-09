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
 * v8.3-fix: 进程级队列序列化匹配请求
 * SQLite 是单写者，交互式事务的读快照在 BEGIN 时固定。
 * 两个同时到达的请求会互相看不到对方的 waiting 记录，导致双双进入等待死锁。
 * 用 Promise 链将 findMatch 串行化，从根本上消除并发竞态窗口。
 */
let matchQueue = Promise.resolve();

export async function findMatch(
  userId: string,
  criteria: MatchCriteriaInput
): Promise<MatchResult> {
  return new Promise((resolve, reject) => {
    matchQueue = matchQueue
      .then(async () => {
        try {
          const result = await _findMatch(userId, criteria);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {}); // 防止队列中某个失败阻塞后续请求
  });
}

/**
 * v6.2-transaction: 匹配引擎 — 交互式事务化改造，根治并发竞态
 *
 * 核心修复：
 * 1. 整个匹配流程包裹在 Prisma $transaction 中，保证原子性
 * 2. 查找 → 认领 → 创建房间 全部在事务内完成，消除竞态窗口
 * 3. 创建 waiting 后立即在同一事务中二次查找，捕获并发请求
 * 4. 事务隔离确保并发请求串行化，不会出现双方同时创建独立房间
 */
async function _findMatch(
  userId: string,
  criteria: MatchCriteriaInput
): Promise<MatchResult> {
  let {
    brainholeId,
    excludeUserId,
    preferDifferentIdentity,
    timeoutMinutes,
    mode,
    identity,
  } = criteria;

  console.log(
    "[MatchEngine v8.3-queue] findMatch start - userId:",
    userId,
    "brainholeId:",
    brainholeId,
    "identity:",
    identity
  );

  // === 整个匹配流程包裹在交互式事务中 ===
  // v8.3-fix: 移除 maxWait/timeout 选项，SQLite 交互式事务对这些选项支持不稳定
  return await db.$transaction(
    async (tx) => {
      // === 0. 检查用户是否已有活跃匹配 ===
      const existingMatch = await tx.matchRequest.findFirst({
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

      // === 1. 获取用户选择的 brainhole 信息 ===
      let userBrainhole = null;
      if (brainholeId) {
        userBrainhole = await tx.brainhole.findUnique({
          where: { id: brainholeId },
          select: { id: true, title: true, category: true },
        });
      }
      // v8.3-fix: 如果 brainholeId 无效，清空以避免外键约束失败
      if (brainholeId && !userBrainhole) {
        console.log(`[MatchEngine] brainholeId ${brainholeId} 不存在，清空`);
        brainholeId = undefined;
      }

      const now = new Date();
      const baseWhere: any = {
        status: "waiting",
        expiresAt: { gt: now },
        userId: { not: excludeUserId || userId },
      };

      // v8.3-fix: preferDifferentIdentity 从硬性过滤改为优先排序
      // 先查全部 waiting 用户，再在内存中优先选不同身份的

      // ========== 阶段1: 同 brainhole 精确匹配 ==========
      if (brainholeId) {
        const stage1Matches = await tx.matchRequest.findMany({
          where: { ...baseWhere, brainholeId },
          orderBy: { createdAt: "asc" },
          take: 5,
        });

        // 优先不同身份，但相同身份也能匹配
        const orderedMatches = preferDifferentIdentity
          ? [
              ...stage1Matches.filter((c: any) => c.identity !== (identity || "default")),
              ...stage1Matches.filter((c: any) => c.identity === (identity || "default")),
            ]
          : stage1Matches;

        for (const candidate of orderedMatches) {
          const claimed = await claimMatchRequestTx(tx, candidate.id);
          if (claimed) {
            console.log(
              "[MatchEngine] 阶段1成功! 同 brainhole 匹配:",
              candidate.userId
            );
            const room = await createDuetMatchTx(
              tx,
              userId,
              "",
              candidate,
              brainholeId,
              userBrainhole?.title || "",
              "same_brainhole",
              identity || "default"
            );
            return {
              matched: true,
              matchId: "direct",
              roomId: room.id,
              matchedUserId: candidate.userId,
              matchedUserIdentity: candidate.identity,
              matchedCount: 2,
              roomType: "duet",
              message: "找到同样对这个话题感兴趣的人",
              strategy: "same_brainhole",
              brainholeId,
              brainholeTitle: userBrainhole?.title || "",
            };
          }
        }
      }

      // ========== 阶段2: 任意等待用户匹配 ==========
      const stage2Matches = await tx.matchRequest.findMany({
        where: baseWhere,
        orderBy: { createdAt: "asc" },
        take: 5,
      });

      // 优先不同身份，但相同身份也能匹配
      const orderedStage2 = preferDifferentIdentity
        ? [
            ...stage2Matches.filter((c: any) => c.identity !== (identity || "default")),
            ...stage2Matches.filter((c: any) => c.identity === (identity || "default")),
          ]
        : stage2Matches;

      for (const candidate of orderedStage2) {
        const claimed = await claimMatchRequestTx(tx, candidate.id);
        if (claimed) {
          let finalBrainholeId = brainholeId || candidate.brainholeId || "";
          let finalBrainholeTitle = userBrainhole?.title || "";

          if (!finalBrainholeId) {
            const randomBh = await pickRandomBrainholeTx(tx);
            if (randomBh) {
              finalBrainholeId = randomBh.id;
              finalBrainholeTitle = randomBh.title;
            }
          }

          console.log(
            "[MatchEngine] 阶段2成功! 用户:",
            candidate.userId,
            "brainhole:",
            finalBrainholeTitle
          );
          const room = await createDuetMatchTx(
            tx,
            userId,
            "",
            candidate,
            finalBrainholeId,
            finalBrainholeTitle,
            "random_pairing",
            identity || "default"
          );
          return {
            matched: true,
            matchId: "direct",
            roomId: room.id,
            matchedUserId: candidate.userId,
            matchedUserIdentity: candidate.identity,
            matchedCount: 2,
            roomType: "duet",
            message: "为你匹配了一位新朋友",
            strategy: "random_pairing",
            brainholeId: finalBrainholeId,
            brainholeTitle: finalBrainholeTitle,
          };
        }
      }

      // ========== 阶段3: 没有等待用户，创建自己的请求 ==========
      console.log("[MatchEngine] 无等待用户，创建 waiting 请求...");
      const matchRequest = await tx.matchRequest.create({
        data: {
          userId,
          brainholeId: brainholeId || null,
          identity: identity || "default",
          preferDifferent: preferDifferentIdentity,
          status: "waiting",
          expiresAt: new Date(
            Date.now() + (timeoutMinutes || 1) * 60 * 1000
          ),
        },
      });

      // ========== v6.2-fix: 二次匹配 —— 创建请求后立即在事务内抢占 ==========
      console.log("[MatchEngine] v6.2-fix 二次匹配检查...");
      const retryMatches = await tx.matchRequest.findMany({
        where: {
          status: "waiting",
          expiresAt: { gt: new Date() },
          userId: { not: userId },
          id: { not: matchRequest.id },
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      });

      for (const candidate of retryMatches) {
        const claimed = await claimMatchRequestTx(tx, candidate.id);
        if (claimed) {
          let finalBrainholeId = brainholeId || candidate.brainholeId || "";
          let finalBrainholeTitle = userBrainhole?.title || "";

          if (!finalBrainholeId) {
            const randomBh = await pickRandomBrainholeTx(tx);
            if (randomBh) {
              finalBrainholeId = randomBh.id;
              finalBrainholeTitle = randomBh.title;
            }
          }

          // 同时抢占自己的请求，确保不会被别人匹配到
          await claimMatchRequestTx(tx, matchRequest.id);

          console.log(
            "[MatchEngine] 二次匹配成功! 用户:",
            candidate.userId
          );
          const room = await createDuetMatchTx(
            tx,
            userId,
            matchRequest.id,
            candidate,
            finalBrainholeId,
            finalBrainholeTitle,
            "retry_pairing",
            identity || "default"
          );
          return {
            matched: true,
            matchId: matchRequest.id,
            roomId: room.id,
            matchedUserId: candidate.userId,
            matchedUserIdentity: candidate.identity,
            matchedCount: 2,
            roomType: "duet",
            message: "匹配成功",
            strategy: "retry_pairing",
            brainholeId: finalBrainholeId,
            brainholeTitle: finalBrainholeTitle,
          };
        }
      }

      // ========== 阶段4: 真正进入等待状态 ==========
      console.log("[MatchEngine] 进入等待状态. matchId:", matchRequest.id);

      let waitingBrainholeId = brainholeId || "";
      let waitingBrainholeTitle = userBrainhole?.title || "";

      if (!waitingBrainholeId) {
        const randomBh = await pickRandomBrainholeTx(tx);
        if (randomBh) {
          waitingBrainholeId = randomBh.id;
          waitingBrainholeTitle = randomBh.title;
          await tx.matchRequest.update({
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
  );
}

/**
 * 事务内乐观锁抢占匹配请求
 */
async function claimMatchRequestTx(tx: any, requestId: string): Promise<boolean> {
  const result = await tx.matchRequest.updateMany({
    where: { id: requestId, status: "waiting" },
    data: { status: "matched" },
  });
  return result.count > 0;
}

/**
 * 事务内创建双人匹配房间 —— 所有DB写操作在事务中原子执行
 */
async function createDuetMatchTx(
  tx: any,
  userId: string,
  matchRequestId: string,
  matchedRequest: any,
  brainholeId: string,
  brainholeTitle: string,
  strategy: string,
  identity: string
): Promise<any> {
  const room = await tx.room.create({
    data: {
      brainholeId: brainholeId || undefined,
      type: "duet",
      status: "created",
      maxRound: 10,
      currentRound: 0,
    },
  });

  // 更新 matchedRequest
  const updates: Promise<any>[] = [
    tx.matchRequest.update({
      where: { id: matchedRequest.id },
      data: {
        status: "matched",
        matchedUserId: userId,
        roomId: room.id,
        resolvedAt: new Date(),
      },
    }),
  ];

  if (matchRequestId) {
    updates.push(
      tx.matchRequest.update({
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
    updates.push(
      tx.matchRequest.create({
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
    tx.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        identity: identity || "default",
        role: "actor",
        isOnline: true,
      },
    }),
    tx.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: matchedRequest.userId,
        identity: matchedRequest.identity || "default",
        role: "actor",
        isOnline: true,
      },
    }),
  ]);

  console.log(
    "[MatchEngine] 房间创建成功, ID:",
    room.id,
    "策略:",
    strategy
  );
  return room;
}

/**
 * 事务内从 approved 池中随机选 brainhole
 * v8.0-crawler: 优先从最近7天的知乎热榜脑洞中选取（70%概率）
 */
async function pickRandomBrainholeTx(tx: any): Promise<any> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 策略：70% 概率优先从最近7天的 zhihu_hot 选取
  const useRecentHot = Math.random() < 0.7;

  let pool;
  if (useRecentHot) {
    pool = await tx.brainhole.findMany({
      where: {
        status: "approved",
        source: "zhihu_hot",
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { hotScore: "desc" },
      take: 30,
    });
  }

  // 如果近期热榜脑洞不足，回退到全量池
  if (!pool || pool.length === 0) {
    pool = await tx.brainhole.findMany({
      where: { status: "approved" },
      orderBy: { hotScore: "desc" },
      take: 50,
    });
  }

  if (pool.length === 0) return null;

  // 热度加权随机
  const totalScore = pool.reduce((sum: number, b: any) => sum + (b.hotScore || 1), 0);
  let randomPoint = Math.random() * totalScore;
  for (const b of pool) {
    randomPoint -= (b.hotScore || 1);
    if (randomPoint <= 0) return b;
  }
  return pool[0];
}

export async function cancelMatch(
  matchId: string,
  userId: string
): Promise<boolean> {
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
  let match = await db.matchRequest.findFirst({
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
    return match;
  }

  // v8.3-fix: 轮询时尝试主动配对 — 处理两个已 waiting 用户互相发现的情况
  if (match.status === "waiting") {
    const paired = await new Promise<any | null>((resolve, reject) => {
      matchQueue = matchQueue
        .then(async () => {
          try {
            const result = await db.$transaction(async (tx) => {
              // 重新确认自己仍是 waiting
              const self = await tx.matchRequest.findFirst({
                where: { id: matchId, userId, status: "waiting" },
              });
              if (!self) return null;

              const candidates = await tx.matchRequest.findMany({
                where: {
                  status: "waiting",
                  expiresAt: { gt: new Date() },
                  userId: { not: userId },
                  id: { not: matchId },
                },
                orderBy: { createdAt: "asc" },
                take: 3,
              });

              for (const candidate of candidates) {
                const claimed = await claimMatchRequestTx(tx, candidate.id);
                if (claimed) {
                  await claimMatchRequestTx(tx, matchId);

                  let finalBrainholeId = self.brainholeId || candidate.brainholeId || "";
                  let finalBrainholeTitle = "";

                  if (!finalBrainholeId) {
                    const randomBh = await pickRandomBrainholeTx(tx);
                    if (randomBh) {
                      finalBrainholeId = randomBh.id;
                      finalBrainholeTitle = randomBh.title;
                    }
                  } else {
                    const bh = await tx.brainhole.findUnique({
                      where: { id: finalBrainholeId },
                      select: { title: true },
                    });
                    finalBrainholeTitle = bh?.title || "";
                  }

                  await createDuetMatchTx(
                    tx,
                    userId,
                    matchId,
                    candidate,
                    finalBrainholeId,
                    finalBrainholeTitle,
                    "poll_pairing",
                    self.identity || "default"
                  );

                  return tx.matchRequest.findFirst({
                    where: { id: matchId },
                    include: { brainhole: true },
                  });
                }
              }

              return null;
            });
            resolve(result);
          } catch (e) {
            reject(e);
          }
        })
        .catch(() => {});
    });

    if (paired) {
      return paired;
    }
  }

  return match;
}
