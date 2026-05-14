import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { brainholeQuerySchema } from "@/lib/validators/brainhole";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = brainholeQuerySchema.parse(queryParams);

    const { page, limit, sortBy, sortOrder } = validatedQuery;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      db.brainholeCollection.findMany({
        where: { userId },
        include: {
          brainhole: {
            include: {
              tags: {
                include: { tag: true },
              },
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.brainholeCollection.count({
        where: { userId },
      }),
    ]);

    const brainholes = collections.map((collection) => ({
      ...collection.brainhole,
      tags: collection.brainhole.tags.map((bt) => bt.tag),
      collectedAt: collection.createdAt,
    }));

    return NextResponse.json(
      apiResponse({
        items: brainholes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      })
    );
  } catch (error) {
    console.error("获取收藏脑洞失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取收藏脑洞失败"), { status: 500 });
  }
}