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

    // 叙事风格催化提示：包装成环境事件/NPC介入，保持角色扮演沉浸感
    let prompt = "";
    if (msgCount <= 5) {
      prompt = story.act1Reveal
        ? `你注意到对方话中有一些不寻常的细节——这和${story.act1Reveal.slice(0, 30)}...有关。试着追问下去。`
        : "窗外突然传来一阵异响，你注意到对方的眼神闪烁了一下。也许该问问他的来历了。";
    } else if (msgCount <= 10) {
      prompt = story.act2Reveal
        ? `你们聊得越来越深入，一些信息开始对不上了。${story.act2Reveal.slice(0, 30)}...这背后似乎另有隐情。`
        : "桌上烛火突然摇曳了一下，你意识到对方说的某句话和之前矛盾。是时候摊牌了。";
    } else if (msgCount <= 15) {
      prompt = story.act3Reveal
        ? `真相开始浮出水面，但事情比想象的更复杂。${story.act3Reveal.slice(0, 30)}...继续追问，别停下。`
        : "门外传来脚步声，又停住了。你知道有人在听。趁现在，把最关键的问题问出来。";
    } else {
      prompt = "空气仿佛凝固了。你们都知道，再往下问，就没有回头路了。如果现在要一个答案——你准备好面对它了吗？";
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
