import { NextResponse } from "next/server";
import { getHackathonStoryList } from "@/lib/zhihu-api";

/**
 * GET /api/zhihu/hackathon-stories
 * 获取知乎黑客松故事内容库概要列表
 */
export async function GET() {
  try {
    const data = await getHackathonStoryList();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[Hackathon Stories] 获取失败:", err.message);
    return NextResponse.json(
      { status: 1, msg: err.message || "获取故事列表失败", data: null },
      { status: 500 }
    );
  }
}
