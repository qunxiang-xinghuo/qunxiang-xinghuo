import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/utils";
import { getAIPrompt } from "@/lib/ai";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brainholeId = searchParams.get("brainholeId") || undefined;
    const category = searchParams.get("category") || undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;

    const prompt = await getAIPrompt(brainholeId, category, tags);

    return NextResponse.json(apiResponse(prompt));
  } catch (error) {
    console.error("获取AI提示失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取AI提示失败"), { status: 500 });
  }
}