import { NextRequest, NextResponse } from "next/server";
import { zhidaChat } from "@/lib/zhihu-dev-api";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const zhidaSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ).min(1),
  model: z.enum(["zhida-fast-1p5", "zhida-thinking-1p5"]).default("zhida-thinking-1p5"),
});

/**
 * POST /api/zhihu/zhida
 * 知乎直答（OpenAI-compatible 格式）
 *
 * Body:
 * {
 *   "messages": [{"role": "user", "content": "怎么理解rave文化"}],
 *   "model": "zhida-thinking-1p5" // optional
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = zhidaSchema.parse(body);

    const result = await zhidaChat(validated.messages, validated.model);

    return NextResponse.json(apiResponse({
      id: result.id,
      model: result.model,
      content: result.choices[0]?.message?.content || "",
      reasoningContent: result.choices[0]?.message?.reasoning_content || "",
      finishReason: result.choices[0]?.finish_reason,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = (error as any).issues?.[0]?.message || "验证失败";
      return NextResponse.json(
        apiError(firstError, "VALIDATION_ERROR"),
        { status: 400 }
      );
    }
    console.error("知乎直答错误:", error);
    return NextResponse.json(
      apiError("直答服务暂时不可用", "INTERNAL_SERVER_ERROR"),
      { status: 500 }
    );
  }
}
