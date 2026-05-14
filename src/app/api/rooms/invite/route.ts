import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符 0O1I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    const guestId = request.headers.get("x-guest-id");
    const effectiveUserId = userId || guestId;
    if (!effectiveUserId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { identity } = body;
    let { brainholeId } = body;

    if (!identity) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数"), { status: 400 });
    }

    // v8.3-fix: 验证 brainholeId 是否存在，不存在则清空避免外键约束失败
    if (brainholeId) {
      const bh = await db.brainhole.findUnique({ where: { id: brainholeId }, select: { id: true } });
      if (!bh) {
        console.warn(`[Invite API] brainholeId ${brainholeId} 不存在，清空`);
        brainholeId = undefined;
      }
    }

    // v8.5-fix: 没有指定脑洞时随机分配一个
    if (!brainholeId) {
      const randomBh = await db.brainhole.findFirst({
        where: { status: 'approved' },
        orderBy: { hotScore: 'desc' },
      });
      if (randomBh) {
        brainholeId = randomBh.id;
        console.log('[Invite API] 未指定脑洞，随机分配:', randomBh.title);
      }
    }

    // 确保用户存在
    try {
      // v8.5-fix: email 去除特殊字符，避免格式错误
      const safeEmail = `${effectiveUserId.replace(/[^a-zA-Z0-9_-]/g, '')}@guest.local`;
      // v9.5a-fix: 不覆盖用户 name（identity 用于房间内角色扮演，不应改变用户真实姓名）
      await db.user.upsert({
        where: { id: effectiveUserId },
        update: {},
        create: { id: effectiveUserId, name: identity, email: safeEmail },
      });
    } catch (userErr: unknown) {
      console.error('[Invite API] 用户创建失败:', getErrorMessage(userErr), 'userId=', effectiveUserId);
      return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "用户创建失败: " + getErrorMessage(userErr)), { status: 500 });
    }

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
      } catch (err: unknown) {
        if (getErrorCode(err)  === 'P2002') {
          // P2002 可能是 inviteCode 重复，重试
          console.log(`[Invite API] inviteCode 冲突，重试 (${attempts + 1}/${maxAttempts})`);
          inviteCode = generateInviteCode();
          attempts++;
          continue;
        }
        console.error('[Invite API] 创建房间失败:', getErrorMessage(err));
        throw err;
      }
    }

    return NextResponse.json(apiError("CONFLICT", "邀请码生成失败，请重试"), { status: 409 });
  } catch (error: unknown) {
    console.error("[Invite API] 错误:", error instanceof Error ? getErrorMessage(error) : String(error));
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建邀请房间失败"), { status: 500 });
  }
}
