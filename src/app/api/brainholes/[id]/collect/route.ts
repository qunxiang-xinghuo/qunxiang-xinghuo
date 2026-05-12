import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const brainhole = await db.brainhole.findUnique({
      where: { id },
    });

    if (!brainhole) {
      return NextResponse.json(apiError("BRAINHOLE_NOT_FOUND", "脑洞不存在"), { status: 404 });
    }

    const existingCollection = await db.brainholeCollection.findUnique({
      where: {
        userId_brainholeId: {
          userId,
          brainholeId: id,
        },
      },
    });

    if (existingCollection) {
      return NextResponse.json(apiError("BRAINHOLE_ALREADY_COLLECTED", "已收藏该脑洞"), { status: 400 });
    }

    const collection = await db.brainholeCollection.create({
      data: {
        userId,
        brainholeId: id,
      },
    });

    await db.brainhole.update({
      where: { id },
      data: {
        collectionCount: { increment: 1 },
      },
    });

    return NextResponse.json(apiResponse({ success: true }), { status: 201 });
  } catch (error) {
    console.error("收藏脑洞失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "收藏脑洞失败"), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const collection = await db.brainholeCollection.findUnique({
      where: {
        userId_brainholeId: {
          userId,
          brainholeId: id,
        },
      },
    });

    if (!collection) {
      return NextResponse.json(apiError("BRAINHOLE_NOT_COLLECTED", "未收藏该脑洞"), { status: 404 });
    }

    await db.brainholeCollection.delete({
      where: {
        userId_brainholeId: {
          userId,
          brainholeId: id,
        },
      },
    });

    await db.brainhole.update({
      where: { id },
      data: {
        collectionCount: { decrement: 1 },
      },
    });

    return NextResponse.json(apiResponse({ success: true }));
  } catch (error) {
    console.error("取消收藏脑洞失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "取消收藏脑洞失败"), { status: 500 });
  }
}