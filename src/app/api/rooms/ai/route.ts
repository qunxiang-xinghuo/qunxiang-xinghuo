import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    let { brainholeId, identity } = body;

    // v4.3: 如果没有指定脑洞，随机抽取一个
    let brainholeTitle = "未知脑洞";
    let brainholeScenario = "";

    if (brainholeId) {
      const brainhole = await db.brainhole.findUnique({
        where: { id: brainholeId },
      });
      if (brainhole) {
        brainholeTitle = brainhole.title;
        brainholeScenario = brainhole.scenario || "";
      }
    } else {
      // 随机抽取一个 approved 脑洞
      const randomBrainhole = await db.brainhole.findFirst({
        where: { status: "approved" },
        orderBy: { hotScore: "desc" },
      });
      if (randomBrainhole) {
        brainholeId = randomBrainhole.id;
        brainholeTitle = randomBrainhole.title;
        brainholeScenario = randomBrainhole.scenario || "";
      }
    }

    // 创建AI房间
    const room = await db.room.create({
      data: {
        brainholeId: brainholeId || null,
        type: "ai_duet",
        status: "active",
        maxRound: 10,
        currentRound: 0,
        scene: brainholeScenario,
      },
    });

    // 添加用户参与者
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        identity: identity || "我",
        role: "actor",
        isOnline: true,
      },
    });

    // 添加AI参与者（刘看山）
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: "liu_kanshan_ai",
        identity: "刘看山",
        role: "actor",
        isOnline: true,
      },
    });

    // 添加欢迎消息
    await db.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: "liu_kanshan_ai",
        content: `你好！我是刘看山，很高兴和你探讨"${brainholeTitle}”。我们可以慢慢聊，不用着急。`,
        identity: "刘看山",
        isAiPrompt: false,
      },
    });

    return NextResponse.json(apiResponse({
      roomId: room.id,
      brainholeTitle,
      brainholeScenario,
      brainholeId,
    }), { status: 201 });
  } catch (error) {
    console.error("创建AI房间失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建AI房间失败"), { status: 500 });
  }
}
