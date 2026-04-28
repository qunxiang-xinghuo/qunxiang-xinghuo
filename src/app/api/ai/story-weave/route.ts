import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { weaveStory } from "@/lib/ai/story-weaver";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    
    // 验证请求数据
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
  } catch (error) {
    console.error("生成故事失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "生成故事失败"), { status: 500 });
  }
}