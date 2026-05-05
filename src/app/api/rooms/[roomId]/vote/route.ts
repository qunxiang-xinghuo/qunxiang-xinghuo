import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import { db } from "@/lib/db";

const createVoteSchema = z.object({
  question: z.string().min(1, "投票问题不能为空").max(500, "投票问题不能超过500字"),
  options: z.array(
    z.string().min(1, "选项文本不能为空").max(200, "选项文本不能超过200字")
  ).min(2, "至少需要2个选项").max(6, "最多6个选项"),
  targetMessageId: z.string().cuid("无效的消息ID").optional(),
});

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validation = createVoteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数验证失败"), { status: 400 });
    }

    const { question, options, targetMessageId } = validation.data;
    const { roomId } = await params;

    // 检查房间是否存在
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    // 检查用户是否是房间导演
    if (room.directorId !== userId) {
      return NextResponse.json(apiError("NOT_DIRECTOR", "不是房间导演"), { status: 403 });
    }

    // 检查房间状态是否允许创建投票
    if (room.status !== "active" && room.status !== "paused") {
      return NextResponse.json(apiError("INVALID_ROOM_STATUS", "房间状态不允许创建投票"), { status: 400 });
    }

    // 创建投票
    const vote = await db.vote.create({
      data: {
        roomId,
        initiatorId: userId,
        question,
        status: "open",
        options: {
          create: options.map((text, idx) => ({
            idx,
            text,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    // 更新房间状态为投票中
    await db.room.update({
      where: { id: roomId },
      data: {
        status: "voting",
      },
    });

    return NextResponse.json(apiResponse(vote));
  } catch (error: any) {
    console.error("创建投票失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建投票失败"), { status: 500 });
  }
}