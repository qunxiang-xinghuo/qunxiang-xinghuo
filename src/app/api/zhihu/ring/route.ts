import { NextRequest, NextResponse } from "next/server";
import { getRingDetail } from "@/lib/zhihu-api";

/**
 * GET /api/zhihu/ring?ringId=xxx&pageNum=1&pageSize=20
 * 获取知乎圈子详情和内容列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ringId = searchParams.get("ringId") || undefined;
    const pageNum = parseInt(searchParams.get("pageNum") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    const data = await getRingDetail(ringId, pageNum, pageSize);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取知乎圈子失败";
    return NextResponse.json({ status: 1, msg: message, data: null }, { status: 500 });
  }
}
