import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

/**
 * POST /api/admin/delete
 * 管理员删除资源
 * Body: { type: 'room' | 'spark' | 'story', id: string }
 */
export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(apiError("BAD_REQUEST", "参数错误"), { status: 400 });
    }

    switch (type) {
      case "room": {
        await db.roomComment.deleteMany({ where: { roomId: id } });
        await db.roomMessage.deleteMany({ where: { roomId: id } });
        await db.roomParticipant.deleteMany({ where: { roomId: id } });
        await db.asset.deleteMany({ where: { roomId: id } });
        await db.reaction.deleteMany({ where: { roomId: id } });
        await db.room.delete({ where: { id } });
        return NextResponse.json(apiResponse({ message: "房间已删除" }));
      }
      case "spark": {
        await db.assetLike.deleteMany({ where: { assetId: id } });
        await db.asset.delete({ where: { id } });
        return NextResponse.json(apiResponse({ message: "火花已删除" }));
      }
      case "user": {
        return NextResponse.json(apiError("BAD_REQUEST", "用户删除请使用 /api/admin/users?id=xxx"), { status: 400 });
      }
      case "story": {
        const rooms = await db.room.findMany({ where: { storyId: id }, select: { id: true } });
        for (const room of rooms) {
          await db.roomComment.deleteMany({ where: { roomId: room.id } });
          await db.roomMessage.deleteMany({ where: { roomId: room.id } });
          await db.roomParticipant.deleteMany({ where: { roomId: room.id } });
          await db.asset.deleteMany({ where: { roomId: room.id } });
          await db.reaction.deleteMany({ where: { roomId: room.id } });
        }
        await db.room.deleteMany({ where: { storyId: id } });
        await db.storyRole.deleteMany({ where: { storyId: id } });
        await db.storyChapter.deleteMany({ where: { storyId: id } });
        await db.storyMessage.deleteMany({ where: { storyId: id } });
        await db.storyInspiration.deleteMany({ where: { storyId: id } });
        await db.storyBranch.deleteMany({ where: { storyId: id } });
        await db.storyLike.deleteMany({ where: { storyId: id } });
        await db.story.delete({ where: { id } });
        return NextResponse.json(apiResponse({ message: "故事已删除" }));
      }
      default:
        return NextResponse.json(apiError("BAD_REQUEST", "不支持的类型"), { status: 400 });
    }
  } catch (error: unknown) {
    console.error("[Admin Delete] Error:", error);
    if (getErrorCode(error) === "P2025") {
      return NextResponse.json(apiResponse({ message: "资源不存在或已删除" }));
    }
    return NextResponse.json(apiError("SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
