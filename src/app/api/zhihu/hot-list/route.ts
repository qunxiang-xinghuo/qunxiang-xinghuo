import { NextRequest, NextResponse } from "next/server";
import { getHotList } from "@/lib/zhihu-dev-api";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const hotListSchema = z.object({
  limit: z.coerce.number().min(1).max(30).default(30),
});

/**
 * GET /api/zhihu/hot-list?limit=10
 * 知乎热榜
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validated = hotListSchema.parse({
      limit: searchParams.get("limit") || "30",
    });

    const result = await getHotList(validated.limit);

    if (result.Code !== 0) {
      return NextResponse.json(
        apiError(result.Message || "获取热榜失败", "HOTLIST_ERROR"),
        { status: 500 }
      );
    }

    return NextResponse.json(apiResponse({
      items: result.Data.Items,
      total: result.Data.Total,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = (error as any).issues?.[0]?.message || "验证失败";
      return NextResponse.json(
        apiError(firstError, "VALIDATION_ERROR"),
        { status: 400 }
      );
    }
    console.error("知乎热榜错误:", error);
    return NextResponse.json(
      apiError("热榜服务暂时不可用", "INTERNAL_SERVER_ERROR"),
      { status: 500 }
    );
  }
}
