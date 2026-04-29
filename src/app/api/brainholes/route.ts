import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { brainholeCreateSchema, brainholeQuerySchema } from "@/lib/validators/brainhole";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = brainholeQuerySchema.parse(queryParams);

    const {
      page,
      limit,
      difficulty,
      status = "approved",
      tag,
      search,
      sortBy,
      sortOrder,
      category,
      mode,
    } = validatedQuery;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = { status };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { scenario: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // 泡泡模式：按热度排序，返回更多字段
    const orderBy = mode === 'bubble' 
      ? { hotScore: 'desc' as const }
      : { [sortBy]: sortOrder };

    // 获取脑洞列表
    const [brainholes, total] = await Promise.all([
      db.brainhole.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy,
        skip: mode === 'bubble' ? 0 : skip,
        take: mode === 'bubble' ? 50 : limit,
      }),
      db.brainhole.count({ where }),
    ]);

    // 格式化响应数据
    const formattedBrainholes = brainholes.map((brainhole: any) => ({
      ...brainhole,
      tags: brainhole.tags.map((bt: any) => bt.tag),
    }));

    // 泡泡模式响应格式
    if (mode === 'bubble') {
      return NextResponse.json(
        apiResponse({
          brainholes: formattedBrainholes,
          total,
        })
      );
    }

    return NextResponse.json(
      apiResponse({
        items: formattedBrainholes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      })
    );
  } catch (error) {
    console.error("获取脑洞列表失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取脑洞列表失败"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validatedData = brainholeCreateSchema.parse(body);

    // 创建脑洞
    const brainhole = await db.brainhole.create({
      data: {
        title: validatedData.title,
        scenario: validatedData.scenario,
        contextTime: validatedData.contextTime,
        contextLocation: validatedData.contextLocation,
        contextCharacters: validatedData.contextCharacters,
        difficulty: validatedData.difficulty,
        authorId: session.user.id,
        status: "pending",
        source: "user",
      },
    });

    // 创建标签关联
    if (validatedData.tags && validatedData.tags.length > 0) {
      // 首先确保标签存在
      const tagPromises = validatedData.tags.map(async (tagName) => {
        const tag = await db.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });

        await db.brainholeTag.create({
          data: {
            brainholeId: brainhole.id,
            tagId: tag.id,
          },
        });
      });

      await Promise.all(tagPromises);
    }

    return NextResponse.json(apiResponse(brainhole), { status: 201 });
  } catch (error) {
    console.error("创建脑洞失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建脑洞失败"), { status: 500 });
  }
}