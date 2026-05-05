import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

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

    const { brainholeId, identity, agents: agentConfigs } = body;

    // v6.1: 多Agent协作支持
    const agents = Array.isArray(agentConfigs) && agentConfigs.length > 0
      ? agentConfigs
      : [{ name: '刘看山', persona: 'catalyst' }];

    if (!identity) {
      console.error("[AI Room API] 缺少identity参数");
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数(identity)"), { status: 400 });
    }

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
      console.error("[AI Room API] 用户记录创建失败:", userErr.message);
      // 继续尝试，也许用户已存在
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
        finalBrainholeId = null;
      }
    }

    if (!finalBrainholeId) {
      console.log("[AI Room API] 未指定脑洞，热度加权随机抽取...");
      // v5.0-fix: 避免总是返回最热脑洞，改为热度加权随机
      const pool = await db.brainhole.findMany({
        where: { status: "approved" },
        orderBy: { hotScore: "desc" },
        take: 50,
      });
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
        console.warn("[AI Room API] 数据库中无approved脑洞，使用默认");
      }
    }

    // 创建AI房间
    console.log("[AI Room API] 创建房间...");
    const room = await db.room.create({
      data: {
        brainholeId: finalBrainholeId || null,
        type: "ai_duet",
        status: "active",
        maxRound: 10,
        currentRound: 0,
        scene: brainholeScenario,
      },
    });
    console.log("[AI Room API] 房间创建成功, roomId:", room.id);

    // 添加用户参与者
    console.log("[AI Room API] 添加用户参与者...");
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        identity: identity || "我",
        role: "actor",
        isOnline: true,
      },
    });
    console.log("[AI Room API] 用户参与者添加成功");

    // v6.1: 添加AI Agent参与者
    console.log("[AI Room API] 添加AI Agent参与者...");
    for (const agent of agents) {
      await db.roomParticipant.create({
        data: {
          roomId: room.id,
          userId: `agent_${agent.persona}`,
          identity: agent.name,
          role: "ai_agent",
          isOnline: true,
        },
      });
      console.log("[AI Room API] AI Agent添加成功:", agent.name, `agent_${agent.persona}`);
    }

    // v6.1: 第一个Agent的欢迎消息
    console.log("[AI Room API] 添加欢迎消息...");
    const welcomeAgent = agents[0];
    await db.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: `agent_${welcomeAgent.persona}`,
        content: `"${brainholeTitle}"...这个话题我正好有点想法。你先说，我听着。`,
        identity: welcomeAgent.name,
        isAiPrompt: false,
      },
    });
    console.log("[AI Room API] 欢迎消息添加成功");

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
