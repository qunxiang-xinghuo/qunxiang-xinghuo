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

    // v7.0-test15: 使用事务包裹，消除并发竞态条件
    const result = await db.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { inviteCode },
        include: { participants: true },
      });

      if (!room) return { error: "NOT_FOUND" as const };
      if (room.status === "closed") return { error: "GONE" as const };

      const actorCount = room.participants.filter((p) => p.role === "actor").length;
      if (actorCount >= 2) return { error: "FULL" as const };

      const alreadyIn = room.participants.some((p) => p.userId === userId);
      if (alreadyIn) return { roomId: room.id, alreadyJoined: true };

      await tx.user.upsert({
        where: { id: userId },
        update: { name: identity },
        create: { id: userId, name: identity, email: `${userId}@guest.local` },
      });

      await tx.roomParticipant.create({
        data: {
          roomId: room.id,
          userId,
          identity,
          role: "actor",
          isOnline: true,
        },
      });

      return { roomId: room.id, alreadyJoined: false };
    });

    if (result.error === "NOT_FOUND") {
      return NextResponse.json(apiError("NOT_FOUND", "房间不存在，请检查邀请码"), { status: 404 });
    }
    if (result.error === "GONE") {
      return NextResponse.json(apiError("GONE", "房间已关闭"), { status: 410 });
    }
    if (result.error === "FULL") {
      return NextResponse.json(apiError("FORBIDDEN", "房间已满员"), { status: 403 });
    }

    return NextResponse.json(apiResponse({
      roomId: result.roomId,
      alreadyJoined: result.alreadyJoined,
    }), { status: 200 });
  } catch (error: any) {
    console.error("[Join API] 错误:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "加入房间失败"), { status: 500 });
  }
}
