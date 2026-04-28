import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendMessage } from "@/server/room-manager";

const sendMessageSchema = z.object({
  content: z.string().min(1, "消息内容不能为空").max(2000, "消息内容不能超过2000字"),
  identity: z.string().min(1, "身份不能为空").max(100, "身份不能超过100字"),
  roleCharacter: z.string().max(100, "角色名称不能超过100字").optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数验证失败"), { status: 400 });
    }

    const { content, identity, roleCharacter } = validation.data;
    const { roomId } = await params;

    // 检查房间是否存在且状态正常
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(apiError("ROOM_NOT_FOUND", "房间不存在"), { status: 404 });
    }

    if (room.status === "closed" || room.status === "finished") {
      return NextResponse.json(apiError("ROOM_CLOSED", "房间已关闭"), { status: 400 });
    }

    // 检查用户是否是房间参与者
    const participant = await db.roomParticipant.findFirst({
      where: {
        roomId,
        userId: session.user.id,
        isOnline: true,
      },
    });

    if (!participant) {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }

    // 发送消息
    const message = await sendMessage(roomId, session.user.id, content, identity, {
      roleCharacter,
    });

    return NextResponse.json(apiResponse(message));
  } catch (error: any) {
    console.error("发送消息失败:", error);
    
    if (error.message === "ROOM_PAUSED") {
      return NextResponse.json(apiError("ROOM_PAUSED", "房间已暂停，只有导演可以发送备注"), { status: 400 });
    } else if (error.message === "ROOM_CLOSED") {
      return NextResponse.json(apiError("ROOM_CLOSED", "房间已关闭"), { status: 400 });
    } else if (error.message === "NOT_PARTICIPANT") {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }
    
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "发送消息失败"), { status: 500 });
  }
}