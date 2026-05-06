import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/stories/mine?type=created|participated
 * 我的故事：我创建的 / 我参与的
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "participated"; // created | participated

    let list: any[] = [];

    if (type === "created") {
      const stories = await db.story.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" as const },
        include: {
          roles: { select: { name: true, claimedBy: true } },
        },
      });
      list = stories.map((s) => ({
        id: s.id,
        title: s.title,
        eraBackground: s.eraBackground || "",
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        roleCount: s.roles.length,
        hotScore: s.hotScore || 0,
        isCreator: true,
      }));
    } else {
      // participated: 通过 StoryRole.claimedBy 查找
      const roles = await db.storyRole.findMany({
        where: { claimedBy: userId },
        include: {
          story: {
            include: {
              roles: { select: { name: true, claimedBy: true } },
            },
          },
        },
      });
      list = roles.map((r) => ({
        id: r.story.id,
        title: r.story.title,
        eraBackground: r.story.eraBackground || "",
        status: r.story.status,
        myRole: r.name,
        createdAt: r.story.createdAt.toISOString(),
        roleCount: r.story.roles.length,
        hotScore: r.story.hotScore || 0,
        isCreator: r.story.creatorId === userId,
      }));
    }

    return NextResponse.json(apiResponse({ list }));
  } catch (error: any) {
    console.error("[Stories Mine] Error:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", error.message || "获取失败"), { status: 500 });
  }
}
