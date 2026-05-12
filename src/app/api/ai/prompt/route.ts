import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiResponse, apiError } from "@/lib/utils";
import { getAIPrompt } from "@/lib/ai";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
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