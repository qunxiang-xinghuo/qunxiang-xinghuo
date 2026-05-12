import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/stories/:storyId/catalyst?roomId=xxx
 * AI DM 驱动四幕催化：根据当前消息数和剧情阶段，生成推动剧情发展的催化提示。
 * 调用 DeepSeek/知乎直答生成自然、沉浸式的环境事件提示。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { storyId } = await params;
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(apiError("BAD_REQUEST", "缺少 roomId"), { status: 400 });
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: {
        title: true, eraBackground: true, storySummary: true,
        act1Reveal: true, act2Reveal: true, act3Reveal: true, act4Truth: true,
      },
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

    // 判断当前幕
    const phase: 'act1' | 'act2' | 'act3' | 'act4' =
      msgCount <= 5 ? 'act1' : msgCount <= 10 ? 'act2' : msgCount <= 15 ? 'act3' : 'act4';

    // 构建 DM 催化 prompt，让 AI 生成沉浸式环境事件
    const dmPrompt = buildDmPrompt(story, phase, msgCount);

    // 尝试调用 AI 生成催化提示
    let prompt = "";
    let source = "local";

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: dmPrompt.system },
              { role: "user", content: dmPrompt.user },
            ],
            temperature: 0.9,
            max_tokens: 80,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const result = await res.json();
          prompt = result.choices?.[0]?.message?.content || "";
          source = "deepseek";
        } else {
          const errText = await res.text().catch(() => "");
          console.error("[Catalyst] DeepSeek API 错误:", res.status, errText.slice(0, 200));
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[Catalyst] DeepSeek 失败:", msg);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    // DeepSeek 失败，尝试知乎直答
    if (!prompt) {
      let t: ReturnType<typeof setTimeout> | null = null;
      try {
        const { zhidaChat } = await import("@/lib/zhihu-dev-api");
        const ctrl = new AbortController();
        t = setTimeout(() => ctrl.abort(), 8000);
        const result = await zhidaChat([
          { role: "user", content: `[系统设定] ${dmPrompt.system}\n\n${dmPrompt.user}` },
        ], "zhida-fast-1p5", ctrl.signal);
        prompt = result.choices?.[0]?.message?.content || "";
        source = "zhida";
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[Catalyst] 知乎直答 失败:", msg);
      } finally {
        if (t) clearTimeout(t);
      }
    }

    // AI 全部失败，使用本地兜底
    if (!prompt) {
      prompt = getFallbackPrompt(story, phase);
    }

    return NextResponse.json(apiResponse({
      msgCount,
      prompt,
      phase,
      source,
    }));
  } catch (error: any) {
    console.error("[Story Catalyst] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "获取催化提示失败"), { status: 500 });
  }
}

function buildDmPrompt(story: any, phase: string, msgCount: number) {
  const actMap: Record<string, string> = {
    act1: story.act1Reveal || "",
    act2: story.act2Reveal || "",
    act3: story.act3Reveal || "",
    act4: story.act4Truth || "",
  };

  const phaseGoals: Record<string, string> = {
    act1: "建立角色之间的初步信任，铺垫背景信息，制造轻微的悬疑感",
    act2: "让角色发现信息不对等的地方，产生第一个真正的疑点",
    act3: "引入外部事件打破平衡，推动角色进入更深层冲突",
    act4: "引导角色面对核心真相，做出关键选择",
  };

  const system = `你是一位沉浸式剧本杀DM（主持人），擅长用环境事件和NPC介入来推动剧情。
你的提示应该像场景描述一样自然，不超过40字。
不要直接告诉玩家该做什么，而是制造一个情境让他们自己反应。
风格：悬疑、电影感、留白。`;

  const user = `故事：《${story.title}》
时代：${story.eraBackground || "未知"}
当前阶段：第${phase.replace('act', '')}幕（${phaseGoals[phase]}）
已发生对话数：${msgCount}条

本幕关键信息：${actMap[phase] || "逐步揭示真相"}

请生成一个环境事件或氛围变化，用来自然推动剧情向下发展。只输出事件描述，不要解释。`;

  return { system, user };
}

function getFallbackPrompt(story: any, phase: string): string {
  const fallbacks: Record<string, string[]> = {
    act1: [
      "窗外突然传来一阵异响，你注意到对方的眼神闪烁了一下",
      "一阵风吹过，桌上的纸片飘落在地，上面写着一个你不认识的名字",
      "对方的手指无意识地敲打着桌面，节奏和你心跳一样快",
    ],
    act2: [
      "桌上烛火突然摇曳了一下，你意识到对方说的某句话和之前矛盾",
      "对方突然沉默了，目光移向窗外。你知道他在隐瞒什么",
      "你无意间碰到了一个抽屉，里面露出的一角照片让你停住了",
    ],
    act3: [
      "门外传来脚步声，又停住了。你知道有人在听",
      "手机突然响了，是一条未知号码发来的消息。对方也看到了",
      "灯闪了一下，再亮时你发现对方的手里多了一样东西",
    ],
    act4: [
      "空气仿佛凝固了。你们都知道，再往下问，就没有回头路了",
      "对方深吸一口气，像是终于下定了决心。你知道，答案要来了",
      "远处传来钟声，每一声都像倒计时。你准备好面对真相了吗？",
    ],
  };
  const list = fallbacks[phase] || fallbacks.act1;
  return list[Math.floor(Math.random() * list.length)];
}
