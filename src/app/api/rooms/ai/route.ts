import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    console.log("[AI Room API] ========== 开始创建AI房间 ==========");

    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId || `guest-${Date.now()}`;
    console.log("[AI Room API] userId:", userId, "session存在:", !!session, "guestId:", guestId);

    let body;
    try {
      body = await request.json();
      console.log("[AI Room API] 请求体:", JSON.stringify(body));
    } catch (parseErr: any) {
      console.error("[AI Room API] 请求体解析失败:", parseErr.message);
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }

    const { brainholeId, identity } = body;

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

    // v4.7-fix: 确保AI用户记录在User表中存在
    try {
      await db.user.upsert({
        where: { id: "liu_kanshan_ai" },
        update: {},
        create: {
          id: "liu_kanshan_ai",
          name: "刘看山",
          email: "liu_kanshan_ai@system.local",
        },
      });
      console.log("[AI Room API] AI用户记录已确认: liu_kanshan_ai");
    } catch (aiUserErr: any) {
      console.error("[AI Room API] AI用户记录创建失败:", aiUserErr.message);
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
      console.log("[AI Room API] 未指定脑洞，随机抽取...");
      const randomBrainhole = await db.brainhole.findFirst({
        where: { status: "approved" },
        orderBy: { hotScore: "desc" },
      });
      if (randomBrainhole) {
        finalBrainholeId = randomBrainhole.id;
        brainholeTitle = randomBrainhole.title;
        brainholeScenario = randomBrainhole.scenario || "";
        console.log("[AI Room API] 随机抽取脑洞:", brainholeTitle);
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

    // 添加AI参与者（刘看山）
    console.log("[AI Room API] 添加AI参与者...");
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: "liu_kanshan_ai",
        identity: "刘看山",
        role: "actor",
        isOnline: true,
      },
    });
    console.log("[AI Room API] AI参与者添加成功");

    // 添加欢迎消息
    console.log("[AI Room API] 添加欢迎消息...");
    await db.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: "liu_kanshan_ai",
        content: `你好！我是刘看山，很高兴和你探讨"${brainholeTitle}"。我们可以慢慢聊，不用着急。`,
        identity: "刘看山",
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
    }), { status: 201 });
  } catch (error: any) {
    console.error("[AI Room API] ========== 创建AI房间失败 ==========");
    console.error("[AI Room API] 错误消息:", error.message);
    console.error("[AI Room API] 错误堆栈:", error.stack);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建AI房间失败: " + (error.message || "未知错误")), { status: 500 });
  }
}
