import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/stories/:storyId/catalyst?roomId=xxx
 * 根据房间消息数返回对应阶段催化提示。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少 roomId"), { status: 400 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { act1Reveal: true, act2Reveal: true, act3Reveal: true, act4Truth: true },
    });
    if (!story) {
      return NextResponse.json(apiError("NOT_FOUND", "故事不存在"), { status: 404 });
    }

    // 验证 room 是否属于该 story
    const room = await db.room.findFirst({
      where: { id: roomId, storyId },
    });
    if (!room) {
      return NextResponse.json(apiError("NOT_FOUND", "房间不属于该故事"), { status: 404 });
    }

    const msgCount = await db.roomMessage.count({ where: { roomId } });

    let prompt = "";
    if (msgCount <= 5) {
      prompt = story.act1Reveal || "先聊聊你们的开场信息，看看有没有不对劲的地方。";
    } else if (msgCount <= 10) {
      prompt = story.act2Reveal || "你们聊了一段时间了，有没有发现信息对不上？试着追问对方。";
    } else if (msgCount <= 15) {
      prompt = story.act3Reveal || "事情可能比你们想的更复杂。再深入问问，看看能不能拼出更大的图景。";
    } else {
      prompt = "你们已经聊了很多了。如果现在揭晓最终谜底，你们准备好了吗？";
    }

    return NextResponse.json(apiResponse({
      msgCount,
      prompt,
      phase: msgCount <= 5 ? "act1" : msgCount <= 10 ? "act2" : msgCount <= 15 ? "act3" : "act4",
    }));
  } catch (error: any) {
    console.error("[Story Catalyst] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "获取催化提示失败"), { status: 500 });
  }
}
