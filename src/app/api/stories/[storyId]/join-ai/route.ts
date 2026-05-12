import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * POST /api/stories/:storyId/join-ai
 * 用户确认与刘看山对戏后调用。
 * 创建 AI 房间（isAiRoom=true），刘看山扮演另一个角色。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { storyId } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(apiError("BAD_REQUEST", "请求体格式错误"), { status: 400 });
    }
    const { roleId } = body;

    const story = await db.story.findUnique({
      where: { id: storyId },
      include: { roles: true },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    const userRole = story.roles.find((r) => r.id === roleId);
    if (!userRole) {
      return NextResponse.json(apiError("BAD_REQUEST", "角色不存在"), { status: 400 });
    }

    // 检查是否已有该用户的活跃 AI 房间（防重复创建）
    // v8.0-fix: 使用 interactive transaction 原子执行检查+创建，防止并发穿透
    const aiRole = story.roles.find((r) => r.id !== roleId);
    const aiName = aiRole?.name || "刘看山";

    const result = await db.$transaction(async (tx) => {
      const existingAiRoom = await tx.room.findFirst({
        where: {
          storyId: story.id,
          isAiRoom: true,
          status: "active",
          participants: { some: { userId, role: "actor" } },
        },
      });
      if (existingAiRoom) {
        return { type: 'existing' as const, roomId: existingAiRoom.id };
      }

      const room = await tx.room.create({
        data: {
          storyId: story.id,
          type: "ai_duet",
          status: "active",
          isAiRoom: true,
          scene: story.eraBackground || story.storySummary || "",
          maxRound: 10,
        },
      });

      await tx.roomParticipant.create({
        data: { roomId: room.id, userId, identity: userRole.name, role: "actor", isOnline: true },
      });

      await tx.roomParticipant.create({
        data: { roomId: room.id, userId: `agent_${story.id}`, identity: aiName, role: "ai_agent", isOnline: true },
      });

      await tx.roomMessage.create({
        data: {
          roomId: room.id,
          senderId: `agent_${story.id}`,
          content: aiRole?.openingInfo || `"${story.title}"...这个话题我正好有点想法。你先说，我听着。`,
          identity: aiName,
          isAiPrompt: false,
        },
      });

      return { type: 'created' as const, roomId: room.id };
    });

    if (result.type === 'existing') {
      return NextResponse.json(apiResponse({
        roomId: result.roomId,
        storyId: story.id,
        roleName: userRole.name,
        openingInfo: userRole.openingInfo || "",
      }));
    }
    const roomId = result.roomId;

    return NextResponse.json(apiResponse({
      roomId,
      storyId: story.id,
      roleName: userRole.name,
      openingInfo: userRole.openingInfo || "",
      aiRoleName: aiName,
    }));
  } catch (error: any) {
    console.error("[Story Join AI] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "创建AI房间失败"), { status: 500 });
  }
}
