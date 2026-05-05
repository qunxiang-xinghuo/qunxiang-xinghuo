import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

function generateInviteCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { identity, brainholeId } = body;

    if (!identity) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数"), { status: 400 });
    }

    // 确保用户存在
    await db.user.upsert({
      where: { id: userId },
      update: { name: identity },
      create: { id: userId, name: identity, email: `${userId}@guest.local` },
    });

    // 生成唯一邀请码
    let inviteCode = generateInviteCode();
    let existing = await db.room.findUnique({ where: { inviteCode } });
    let attempts = 0;
    while (existing && attempts < 10) {
      inviteCode = generateInviteCode();
      existing = await db.room.findUnique({ where: { inviteCode } });
      attempts++;
    }
    if (existing) {
      return NextResponse.json(apiError("CONFLICT", "邀请码生成失败，请重试"), { status: 409 });
    }

    // 创建邀请房间
    const room = await db.room.create({
      data: {
        type: "invite_duet",
        status: "active",
        brainholeId: brainholeId || null,
        inviteCode,
        maxRound: 10,
        currentRound: 0,
      },
    });

    // 添加创建者为参与者
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        identity: identity || "我",
        role: "actor",
        isOnline: true,
      },
    });

    return NextResponse.json(apiResponse({
      roomId: room.id,
      inviteCode,
    }), { status: 201 });
  } catch (error: any) {
    console.error("[Invite API] 错误:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建邀请房间失败"), { status: 500 });
  }
}
