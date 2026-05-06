import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { reactionCreateSchema, reactionQuerySchema } from "@/lib/validators/reaction";
import { z } from "zod";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = reactionQuerySchema.parse(queryParams);

    const { page, limit, brainholeId, roomId, userId: queryUserId, identity, isSpark, sortBy, sortOrder } = validatedQuery;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (brainholeId) where.brainholeId = brainholeId;
    if (roomId) where.roomId = roomId;
    if (queryUserId) where.userId = queryUserId;
    if (identity) where.identity = identity;
    if (isSpark !== undefined) where.isSpark = isSpark;

    const [reactions, total] = await Promise.all([
      db.reaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              level: true,
            },
          },
          brainhole: {
            select: {
              id: true,
              title: true,
              scenario: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.reaction.count({ where }),
    ]);

    return NextResponse.json(
      apiResponse({
        items: reactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiError("VALIDATION_ERROR", error.issues[0]?.message || "参数格式错误"), { status: 400 });
    }
    console.error("获取反应列表失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取反应列表失败"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validatedData = reactionCreateSchema.parse(body);

    // 检查脑洞是否存在
    const brainhole = await db.brainhole.findUnique({
      where: { id: validatedData.brainholeId },
    });

    if (!brainhole) {
      return NextResponse.json(apiError("BRAINHOLE_NOT_FOUND", "脑洞不存在"), { status: 404 });
    }

    // v7.0-test12: 使用事务确保反应创建和计数更新原子性
    const [reaction] = await db.$transaction([
      db.reaction.create({
        data: {
          content: validatedData.content,
          identity: validatedData.identity,
          emotionTag: validatedData.emotionTag,
          mediaUrl: validatedData.mediaUrl,
          mediaDuration: validatedData.mediaDuration,
          userId,
          brainholeId: validatedData.brainholeId,
          roomId: validatedData.roomId,
        },
      }),
      db.brainhole.update({
        where: { id: validatedData.brainholeId },
        data: {
          reactionCount: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json(apiResponse(reaction), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiError("VALIDATION_ERROR", error.issues[0]?.message || "请求体格式错误"), { status: 400 });
    }
    console.error("创建反应失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建反应失败"), { status: 500 });
  }
}