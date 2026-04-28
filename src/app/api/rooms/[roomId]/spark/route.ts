import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import { markSpark } from "@/server/room-manager";
import { broadcastToRoom } from "@/server/io";

const markSparkSchema = z.object({
  messageId: z.string().cuid("无效的消息ID"),
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
    const validation = markSparkSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(apiError("VALIDATION_ERROR", validation.error.issues[0]?.message || "参数验证失败"), { status: 400 });
    }

    const { messageId } = validation.data;
    const { roomId } = await params;

    // 标记火花
    const updatedMessage = await markSpark(roomId, messageId, session.user.id);

    // 通过 Socket.io 实时广播
    try {
      broadcastToRoom(roomId, "spark-marked", {
        messageId,
        markedBy: session.user.id,
        timestamp: Date.now(),
      })
    } catch {
      // 静默失败
    }

    return NextResponse.json(apiResponse(updatedMessage));
  } catch (error: any) {
    console.error("标记火花失败:", error);
    
    if (error.message === "MESSAGE_NOT_FOUND") {
      return NextResponse.json(apiError("MESSAGE_NOT_FOUND", "消息不存在"), { status: 404 });
    } else if (error.message === "ALREADY_SPARKED") {
      return NextResponse.json(apiError("ALREADY_SPARKED", "消息已被标记为火花"), { status: 400 });
    } else if (error.message === "NOT_PARTICIPANT") {
      return NextResponse.json(apiError("NOT_PARTICIPANT", "不是房间参与者"), { status: 403 });
    }
    
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "标记火花失败"), { status: 500 });
  }
}