import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

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
    const { inviteCode, identity } = body;

    if (!inviteCode || !identity) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少邀请码或身份参数"), { status: 400 });
    }

    // 查找房间
    const room = await db.room.findUnique({
      where: { inviteCode },
      include: { participants: true },
    });

    if (!room) {
      return NextResponse.json(apiError("NOT_FOUND", "房间不存在，请检查邀请码"), { status: 404 });
    }

    if (room.status === "closed") {
      return NextResponse.json(apiError("GONE", "房间已关闭"), { status: 410 });
    }

    // 检查是否已满员（邀请房间最多2人）
    const actorCount = room.participants.filter((p) => p.role === "actor").length;
    if (actorCount >= 2) {
      return NextResponse.json(apiError("FORBIDDEN", "房间已满员"), { status: 403 });
    }

    // 检查是否已经在房间里
    const alreadyIn = room.participants.some((p) => p.userId === userId);
    if (alreadyIn) {
      return NextResponse.json(apiResponse({ roomId: room.id, alreadyJoined: true }), { status: 200 });
    }

    // 确保用户存在
    await db.user.upsert({
      where: { id: userId },
      update: { name: identity },
      create: { id: userId, name: identity, email: `${userId}@guest.local` },
    });

    // 添加参与者
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        identity,
        role: "actor",
        isOnline: true,
      },
    });

    return NextResponse.json(apiResponse({
      roomId: room.id,
      alreadyJoined: false,
    }), { status: 200 });
  } catch (error: any) {
    console.error("[Join API] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "加入房间失败"), { status: 500 });
  }
}
