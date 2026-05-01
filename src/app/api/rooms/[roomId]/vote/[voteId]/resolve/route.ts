import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import { db } from "@/lib/db";

const resolveVoteSchema = z.object({
  winnerOptionIndex: z.number().int().min(0, "无效的获胜选项索引"),
  moveToInspiration: z.array(z.number().int().min(0, "无效的选项索引")).default([]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; voteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validation = resolveVoteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数验证失败"), { status: 400 });
    }

    const { winnerOptionIndex, moveToInspiration } = validation.data;
    const { roomId, voteId } = await params;

    // 检查投票是否存在且处于开放状态
    const vote = await db.vote.findFirst({
      where: { id: voteId, roomId },
      include: {
        options: true,
        casts: true,
      },
    });

    if (!vote) {
      return NextResponse.json(apiError("VOTE_NOT_FOUND", "投票不存在"), { status: 404 });
    }

    if (vote.status !== "open") {
      return NextResponse.json(apiError("VOTE_CLOSED", "投票已结束"), { status: 400 });
    }

    // 检查用户是否是房间导演
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    if (room.directorId !== session.user.id) {
      return NextResponse.json(apiError("NOT_DIRECTOR", "不是房间导演"), { status: 403 });
    }

    // 检查选项索引是否有效
    if (winnerOptionIndex >= vote.options.length) {
      return NextResponse.json(apiError("INVALID_WINNER_OPTION", "无效的获胜选项"), { status: 400 });
    }

    // 检查要移动到灵感库的选项索引是否有效
    for (const optionIdx of moveToInspiration) {
      if (optionIdx >= vote.options.length) {
        return NextResponse.json(apiError("INVALID_INSPIRATION_OPTION", `无效的灵感选项索引: ${optionIdx}`), { status: 400 });
      }
    }

    // 更新投票状态
    const updatedVote = await db.vote.update({
      where: { id: voteId },
      data: {
        status: "closed",
        winnerOptionIdx: winnerOptionIndex,
        closedAt: new Date(),
      },
      include: {
        options: true,
      },
    });

    // 将选中的选项添加到灵感库
    for (const optionIdx of moveToInspiration) {
      if (optionIdx === winnerOptionIndex) continue; // 跳过获胜选项
      
      const option = vote.options[optionIdx];
      await db.inspirationItem.create({
        data: {
          roomId,
          content: option.text,
          voteId,
          addedBy: session.user.id,
        },
      });
    }

    // 更新房间状态回进行中
    await db.room.update({
      where: { id: roomId },
      data: {
        status: "active",
      },
    });

    return NextResponse.json(apiResponse(updatedVote));
  } catch (error: any) {
    console.error("结束投票失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "结束投票失败"), { status: 500 });
  }
}