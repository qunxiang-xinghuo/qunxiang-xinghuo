import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// v8.5-fix: 邀请码加入房间 — 加固血型匹配 + 移除 SQLite 交互式事务
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
    const { inviteCode, identity } = body;

    // 1. 邀请码格式校验（6位大写字母数字）
    const normalizedCode = typeof inviteCode === 'string' ? inviteCode.toUpperCase().trim() : '';
    if (!normalizedCode || !/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      return NextResponse.json(apiError("BAD_REQUEST", "邀请码格式不正确，请输入6位字母数字组合"), { status: 400 });
    }
    if (!identity || typeof identity !== 'string' || identity.trim().length === 0) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少身份参数"), { status: 400 });
    }

    // 2. 查找房间
    const room = await db.room.findUnique({
      where: { inviteCode: normalizedCode },
      include: { participants: true },
    });

    // 血型匹配①：码不存在
    if (!room) {
      return NextResponse.json(apiError("NOT_FOUND", "邀请码无效或房间已过期"), { status: 404 });
    }

    // 血型匹配②：房间已结束
    if (room.status === "closed" || room.status === "finished") {
      return NextResponse.json(apiError("GONE", "对白已结束"), { status: 410 });
    }

    // 血型匹配③：房间已满
    const actorCount = room.participants.filter((p) => p.role === "actor").length;
    if (actorCount >= 2) {
      return NextResponse.json(apiError("FORBIDDEN", "房间已满"), { status: 403 });
    }

    // 血型匹配④：自己邀请自己
    const isSelfInvite = room.participants.length === 1 &&
      room.participants[0].userId === effectiveUserId;
    if (isSelfInvite) {
      return NextResponse.json(apiError("CONFLICT", "这是你自己的房间，快去分享邀请码给好友吧"), { status: 409 });
    }

    // 血型匹配⑤：已在房间中 → 直接送进去
    const alreadyIn = room.participants.some((p) => p.userId === effectiveUserId);
    if (alreadyIn) {
      return NextResponse.json(apiResponse({
        roomId: room.id,
        alreadyJoined: true,
      }), { status: 200 });
    }

    // 3. 确保用户存在（upsert）
    const safeEmail = `${effectiveUserId.replace(/[^a-zA-Z0-9_-]/g, '')}@guest.local`;
    await db.user.upsert({
      where: { id: effectiveUserId },
      update: { name: identity.trim() },
      create: { id: effectiveUserId, name: identity.trim(), email: safeEmail },
    });

    // 4. 加入房间
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: effectiveUserId,
        identity: identity.trim(),
        role: "actor",
        isOnline: true,
      },
    });

    return NextResponse.json(apiResponse({
      roomId: room.id,
      alreadyJoined: false,
    }), { status: 200 });
  } catch (error: any) {
    console.error("[Join API] 错误:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "服务器错误，请稍后重试"), { status: 500 });
  }
}
