import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || id.length > 100) {
      return NextResponse.json(apiError("BAD_REQUEST", "无效的ID"), { status: 400 });
    }
    const brainhole = await db.brainhole.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            level: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            collections: true,
          },
        },
      },
    });

    if (!brainhole) {
      return NextResponse.json(apiError("BRAINHOLE_NOT_FOUND", "脑洞不存在"), { status: 404 });
    }

    const formattedBrainhole = {
      ...brainhole,
      tags: brainhole.tags.map((bt) => bt.tag),
      reactionCount: brainhole._count.reactions,
      collectionCount: brainhole._count.collections,
    };

    return NextResponse.json(apiResponse(formattedBrainhole));
  } catch (error) {
    console.error("获取脑洞详情失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取脑洞详情失败"), { status: 500 });
  }
}