import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(request: NextRequest) {
  try {
    console.log("[AI Room API] ========== 开始创建AI房间 ==========");

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }
    console.log("[AI Room API] userId:", userId, "token存在:", !!token, "guestId:", guestId);

    let body;
    try {
      body = await request.json();
      console.log("[AI Room API] 请求体:", JSON.stringify(body));
    } catch (parseErr: any) {
      console.error("[AI Room API] 请求体解析失败:", parseErr.message);
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const createAiRoomSchema = z.object({
      brainholeId: z.string().optional(),
      identity: z.string().min(1, "身份不能为空").max(100, "身份不能超过100字").optional(),
      agents: z.array(z.object({
        name: z.string().min(1).max(50),
        persona: z.string().min(1).max(50),
      })).max(5, "最多5个Agent").optional(),
    });

    const validation = createAiRoomSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数格式错误"), { status: 400 });
    }

    // v8.1: identity 可选，未传时从用户记录获取
    let { brainholeId, identity, agents: agentConfigs } = validation.data;
    if (!identity) {
      const userRecord = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
      identity = userRecord?.name || '我';
    }

    // v6.1: 多Agent协作支持
    const agents = Array.isArray(agentConfigs) && agentConfigs.length > 0
      ? agentConfigs
      : [{ name: '刘看山', persona: 'catalyst' }];

    // v4.7-fix: 确保用户记录在User表中存在（Prisma外键约束要求）
    console.log("[AI Room API] 检查/创建用户记录...");
    try {
      await db.user.upsert({
        where: { id: userId },
        update: { name: identity },
        create: {
          id: userId,
          name: identity,
          email: `${userId}@guest.local`,
        },
      });
      console.log("[AI Room API] 用户记录已确认:", userId);
    } catch (userErr: any) {
      // v7.0-test2: 仅吞掉唯一约束冲突（用户已存在），其他错误向上抛出
      if (userErr.code === 'P2002') {
        console.log("[AI Room API] 用户已存在，继续:", userId);
      } else {
        console.error("[AI Room API] 用户记录创建失败:", userErr.message);
        throw userErr;
      }
    }

    // v6.1: 确保所有AI Agent用户记录在User表中存在
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
        console.log("[AI Room API] AI Agent用户记录已确认:", agentUserId);
      } catch (aiUserErr: any) {
        console.error("[AI Room API] AI Agent用户记录创建失败:", aiUserErr.message);
        // v8.0-fix: 不再静默吞掉，抛出错误避免后续外键约束崩溃
        throw aiUserErr;
      }
    }

    // 如果没有指定脑洞，随机抽取一个
    let finalBrainholeId = brainholeId;
    let brainholeTitle = "未知脑洞";
    let brainholeScenario = "";

    if (finalBrainholeId) {
      const brainhole = await db.brainhole.findUnique({
        where: { id: finalBrainholeId },
      });
      if (brainhole) {
        brainholeTitle = brainhole.title;
        brainholeScenario = brainhole.scenario || "";
        console.log("[AI Room API] 使用指定脑洞:", brainholeTitle);
      } else {
        console.warn("[AI Room API] 指定脑洞不存在:", finalBrainholeId);
        finalBrainholeId = undefined;
      }
    }

    if (!finalBrainholeId) {
      console.log("[AI Room API] 未指定脑洞，热度加权随机抽取...");
      // v5.0-fix: 避免总是返回最热脑洞，改为热度加权随机
      let pool = await db.brainhole.findMany({
        where: { status: "approved" },
        orderBy: { hotScore: "desc" },
        take: 50,
      });
      // v8.0-fix: 如果没有 approved 脑洞，从所有脑洞中抽取
      if (pool.length === 0) {
        console.warn("[AI Room API] 无approved脑洞，尝试从所有脑洞抽取...");
        pool = await db.brainhole.findMany({
          orderBy: { hotScore: "desc" },
          take: 50,
        });
      }
      if (pool.length > 0) {
        const totalScore = pool.reduce((sum, b) => sum + (b.hotScore || 1), 0);
        let randomPoint = Math.random() * totalScore;
        let selected = pool[0];
        for (const b of pool) {
          randomPoint -= (b.hotScore || 1);
          if (randomPoint <= 0) {
            selected = b;
            break;
          }
        }
        finalBrainholeId = selected.id;
        brainholeTitle = selected.title;
        brainholeScenario = selected.scenario || "";
        console.log("[AI Room API] 热度加权随机抽取脑洞:", brainholeTitle, "(从", pool.length, "个脑洞中)");
      } else {
        console.warn("[AI Room API] 数据库中无脑洞，使用默认");
      }
    }

    // v8.0-fix: 使用 $transaction 原子创建房间+参与者+消息，防止孤儿数据
    console.log("[AI Room API] 创建房间...");
    const room = await db.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          brainholeId: finalBrainholeId || null,
          type: "ai_duet",
          status: "active",
          maxRound: 10,
          currentRound: 0,
          scene: brainholeScenario,
          isAiRoom: true,
        },
      });

      // 添加用户参与者
      await tx.roomParticipant.create({
        data: {
          roomId: newRoom.id,
          userId,
          identity: identity || "我",
          role: "actor",
          isOnline: true,
        },
      });

      // 添加AI Agent参与者
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

      // 第一个Agent的欢迎消息
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
    console.error("[AI Room API] ========== 创建AI房间失败 ==========");
    console.error("[AI Room API] 错误消息:", error.message);
    console.error("[AI Room API] 错误堆栈:", error.stack);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建AI房间失败: " + (error.message || "未知错误")), { status: 500 });
  }
}
