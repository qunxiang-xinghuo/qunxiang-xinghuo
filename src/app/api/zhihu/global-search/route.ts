import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/zhihu-dev-api";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  count: z.coerce.number().min(1).max(10).default(10),
});

/**
 * GET /api/zhihu/global-search?query=xxx&count=5
 * 全网搜索
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validated = searchQuerySchema.parse({
      query: searchParams.get("query"),
      count: searchParams.get("count") || "10",
    });

    const result = await globalSearch(validated.query, validated.count);

    if (result.Code !== 0) {
      return NextResponse.json(
        apiError(result.Message || "全网搜索失败", "GLOBAL_SEARCH_ERROR"),
        { status: 500 }
      );
    }

    return NextResponse.json(apiResponse({
      items: result.Data.Items,
      hasMore: result.Data.HasMore,
      searchHashId: result.Data.SearchHashId,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = (error as any).issues?.[0]?.message || "验证失败";
      return NextResponse.json(
        apiError(firstError, "VALIDATION_ERROR"),
        { status: 400 }
      );
    }
    console.error("全网搜索错误:", error);
    return NextResponse.json(
      apiError("搜索服务暂时不可用", "INTERNAL_SERVER_ERROR"),
      { status: 500 }
    );
  }
}
