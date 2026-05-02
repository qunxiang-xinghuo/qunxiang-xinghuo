import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { weaveStory, generateBranchOptions } from "@/lib/ai/story-weaver";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode || "weave";

    // v5.0: 分支生成模式（故事大厅AI分支剧情）
    if (mode === "branch") {
      if (!body.messages) {
        return NextResponse.json(apiError("INVALID_INPUT", "需要提供对话内容"), { status: 400 });
      }
      const branch = await generateBranchOptions({
        messages: body.messages,
        storyTitle: body.storyTitle || "",
      });
      return NextResponse.json(apiResponse({ branch }));
    }

    // 原有模式：火花串联成故事
    if (!body.sparks || !Array.isArray(body.sparks) || body.sparks.length === 0) {
      return NextResponse.json(apiError("INVALID_INPUT", "需要提供火花数据"), { status: 400 });
    }

    const result = await weaveStory({
      sparks: body.sparks,
      format: body.format || "script",
      tone: body.tone,
      length: body.length || "medium",
    });

    return NextResponse.json(apiResponse(result));
  } catch (error: any) {
    console.error("[StoryWeave API] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "生成失败: " + error.message), { status: 500 });
  }
}