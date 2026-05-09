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
    const effectiveUserId = userId || guestId;
    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { identity, brainholeId } = body;

    if (!identity) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数"), { status: 400 });
    }

    // 确保用户存在
    await db.user.upsert({
      where: { id: effectiveUserId },
      update: { name: identity },
      create: { id: effectiveUserId, name: identity, email: `${effectiveUserId}@guest.local` },
    });

    // v7.0-test15: 使用try/catch捕获P2002唯一约束冲突，结合重试生成邀请码
    let inviteCode = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      try {
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

        await db.roomParticipant.create({
          data: {
            roomId: room.id,
            userId: effectiveUserId,
            identity: identity || "我",
            role: "actor",
            isOnline: true,
          },
        });

        return NextResponse.json(apiResponse({
          roomId: room.id,
          inviteCode,
        }), { status: 201 });
      } catch (err: any) {
        if (err?.code === 'P2002' && err?.meta?.target?.includes('inviteCode')) {
          inviteCode = generateInviteCode();
          attempts++;
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json(apiError("CONFLICT", "邀请码生成失败，请重试"), { status: 409 });
  } catch (error: any) {
    console.error("[Invite API] 错误:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建邀请房间失败"), { status: 500 });
  }
}
