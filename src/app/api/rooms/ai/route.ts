import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

// v9.3-emergency-fix: AI房间创建API — 暴力清理+无脑新建+兜底报错
export async function POST(request: NextRequest) {
  try {
    console.log("[AI Room API] ========== 开始创建AI房间 ==========");

    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }
    console.log("[AI Room API] userId:", userId);

    // v9.3-emergency-fix: 暴力清理 — 先把所有卡死的AI房间踢下线
    try {
      const closedCount = await db.room.updateMany({
        where: { type: "ai_duet", status: "active" },
        data: { status: "closed", closedAt: new Date() },
      });
      console.log("[AI Room API] 清理卡死AI房间:", closedCount.count, "个");
    } catch (cleanupErr: any) {
      console.warn("[AI Room API] 清理旧房间失败（非致命）:", cleanupErr.message);
    }

    // 兼容空 body
    let body: any = {};
    try {
      body = await request.json();
      console.log("[AI Room API] 请求体:", JSON.stringify(body));
    } catch {
      console.log("[AI Room API] 请求体为空，使用默认值");
      body = {};
    }

    const createAiRoomSchema = z.object({
      brainholeId: z.string().optional(),
      identity: z.string().min(1).max(100).optional(),
      agents: z.array(z.object({
        name: z.string().min(1).max(50),
        persona: z.string().min(1).max(50),
      })).max(5).optional(),
    });

    const validation = createAiRoomSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数格式错误"),
        { status: 400 }
      );
    }

    let { brainholeId, identity, agents: agentConfigs } = validation.data;
    if (!identity) {
      const userRecord = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      identity = userRecord?.name || '我';
    }

    const agents = Array.isArray(agentConfigs) && agentConfigs.length > 0
      ? agentConfigs
      : [{ name: '刘看山', persona: 'catalyst' }];

    // 确保用户记录存在
    try {
      // v9.5a-fix: 不覆盖用户 name（identity 用于房间内角色扮演，不应改变用户真实姓名）
      await db.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          name: identity,
          email: `${userId}@guest.local`,
        },
      });
    } catch (userErr: any) {
      if (userErr.code !== 'P2002') {
        console.error("[AI Room API] 用户记录创建失败:", userErr.message);
        throw userErr;
      }
    }

    // 确保AI Agent用户记录存在
    for (const agent of agents) {
      const agentUserId = `agent_${agent.persona}`;
      try {
        await db.user.upsert({
          where: { id: agentUserId },
          update: {},
          create: {
            id: agentUserId,
            name: agent.name,
            email: `${agentUserId}@system.local`,
          },
        });
      } catch (aiUserErr: any) {
        if (aiUserErr.code !== 'P2002') {
          console.error("[AI Room API] AI Agent用户记录失败:", aiUserErr.message);
          throw aiUserErr;
        }
      }
    }

    // 查找或随机选择脑洞
    let finalBrainholeId = brainholeId;
    let brainholeTitle = "未知脑洞";
    let brainholeScenario = "";

    if (finalBrainholeId) {
      const brainhole = await db.brainhole.findUnique({ where: { id: finalBrainholeId } });
      if (brainhole) {
        brainholeTitle = brainhole.title;
        brainholeScenario = brainhole.scenario || "";
      } else {
        finalBrainholeId = undefined;
      }
    }

    if (!finalBrainholeId) {
      let pool = await db.brainhole.findMany({
        where: { status: "approved" },
        orderBy: { hotScore: "desc" },
        take: 50,
      });
      if (pool.length === 0) {
        pool = await db.brainhole.findMany({ orderBy: { hotScore: "desc" }, take: 50 });
      }
      if (pool.length > 0) {
        const totalScore = pool.reduce((sum, b) => sum + (b.hotScore || 1), 0);
        let randomPoint = Math.random() * totalScore;
        let selected = pool[0];
        for (const b of pool) {
          randomPoint -= (b.hotScore || 1);
          if (randomPoint <= 0) { selected = b; break; }
        }
        finalBrainholeId = selected.id;
        brainholeTitle = selected.title;
        brainholeScenario = selected.scenario || "";
      }
    }

    // v9.3-emergency-fix: 无脑新建 — 不管旧房间，直接事务创建
    console.log("[AI Room API] 创建房间...");
    const room = await db.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          brainholeId: finalBrainholeId || null,
          type: "ai_duet",
          status: "active",        // 强制 active
          maxRound: 10,
          currentRound: 0,
          scene: brainholeScenario,
          isAiRoom: true,          // 强制 true
        },
      });

      await tx.roomParticipant.create({
        data: {
          roomId: newRoom.id,
          userId,
          identity: identity || "我",
          role: "actor",
          isOnline: true,
        },
      });

      for (const agent of agents) {
        await tx.roomParticipant.create({
          data: {
            roomId: newRoom.id,
            userId: `agent_${agent.persona}`,
            identity: agent.name,
            role: "ai_agent",
            isOnline: true,
          },
        });
      }

      const welcomeAgent = agents[0];
      await tx.roomMessage.create({
        data: {
          roomId: newRoom.id,
          senderId: `agent_${welcomeAgent.persona}`,
          content: `"${brainholeTitle}"...这个话题我正好有点想法。你先说，我听着。`,
          identity: welcomeAgent.name,
          isAiPrompt: false,
        },
      });

      return newRoom;
    });

    console.log("[AI Room API] 房间创建成功, roomId:", room.id);
    console.log("[AI Room API] ========== AI房间创建完成 ==========");

    return NextResponse.json(apiResponse({
      roomId: room.id,
      brainholeTitle,
      brainholeScenario,
      brainholeId: finalBrainholeId,
      userId,
      agents,
    }), { status: 201 });

  } catch (error: any) {
    // v9.3-emergency-fix: 兜底报错 — 打印具体错误到日志，返回友好提示
    console.error("[AI Room API] ========== 创建AI房间失败 ==========");
    console.error("[AI Room API] 错误类型:", error?.constructor?.name || "Unknown");
    console.error("[AI Room API] 错误消息:", error?.message || "无错误消息");
    console.error("[AI Room API] 错误代码:", error?.code || "无错误代码");
    console.error("[AI Room API] 错误堆栈:", error?.stack || "无堆栈");

    // 尝试提取 Prisma 具体错误信息
    if (error?.meta) {
      console.error("[AI Room API] Prisma meta:", JSON.stringify(error.meta));
    }
    if (error?.message?.includes("Foreign key constraint")) {
      console.error("[AI Room API] 外键约束失败 — 检查关联表数据是否存在");
    }
    if (error?.message?.includes("Unique constraint")) {
      console.error("[AI Room API] 唯一约束冲突 — 检查重复数据");
    }

    return NextResponse.json(
      apiError(
        "INTERNAL_SERVER_ERROR",
        `创建失败：${error?.message || "未知错误"}。请找开发人员查看服务器日志。`
      ),
      { status: 500 }
    );
  }
}
