import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import { db } from "@/lib/db";

const castVoteSchema = z.object({
  optionIndex: z.number().int().min(0, "无效的选项索引"),
});

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; voteId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validation = castVoteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数验证失败"), { status: 400 });
    }

    const { optionIndex } = validation.data;
    const { roomId, voteId } = await params;

    // 检查投票是否存在且处于开放状态
    const vote = await db.vote.findFirst({
      where: { id: voteId, roomId },
      include: {
        options: true,
      },
    });

    if (!vote) {
      return NextResponse.json(apiError("VOTE_NOT_FOUND", "投票不存在"), { status: 404 });
    }

    if (vote.status !== "open") {
      return NextResponse.json(apiError("VOTE_CLOSED", "投票已结束"), { status: 400 });
    }

    // 检查选项索引是否有效
    if (optionIndex >= vote.options.length) {
      return NextResponse.json(apiError("INVALID_OPTION", "无效的选项"), { status: 400 });
    }

    // 检查用户是否已经投过票
    const existingVote = await db.voteCast.findFirst({
      where: {
        voteId,
        userId,
      },
    });

    if (existingVote) {
      return NextResponse.json(apiError("ALREADY_VOTED", "已经投过票了"), { status: 400 });
    }

    // 检查用户是否是房间参与者
    const participant = await db.roomParticipant.findFirst({
      where: {
        roomId,
        userId,
        isOnline: true,
      },
    });

    if (!participant) {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }

    const option = vote.options[optionIndex];

    // 记录投票
    await db.voteCast.create({
      data: {
        voteId,
        userId,
        optionId: option.id,
      },
    });

    return NextResponse.json(apiResponse({ success: true }));
  } catch (error: any) {
    console.error("投票失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "投票失败"), { status: 500 });
  }
}