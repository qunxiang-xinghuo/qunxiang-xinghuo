import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

// GET: 获取疗愈会话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const healingSession = await db.healingSession.findUnique({
      where: { id: sessionId },
    });
    if (!healingSession || healingSession.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权访问此会话"), { status: 403 });
    }

    return NextResponse.json(apiResponse({
      id: healingSession.id,
      status: healingSession.status,
      title: healingSession.title,
      topic: healingSession.topic,
      createdAt: healingSession.createdAt,
      closedAt: healingSession.closedAt,
    }));
  } catch (error: any) {
    console.error("[Healing Session GET] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取会话失败"), { status: 500 });
  }
}

// PATCH: 关闭疗愈会话
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const healingSession = await db.healingSession.findUnique({
      where: { id: sessionId },
    });
    if (!healingSession || healingSession.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权访问此会话"), { status: 403 });
    }

    const updated = await db.healingSession.update({
      where: { id: sessionId },
      data: { status: "closed", closedAt: new Date() },
    });

    return NextResponse.json(apiResponse({
      id: updated.id,
      status: updated.status,
      closedAt: updated.closedAt,
    }));
  } catch (error: any) {
    console.error("[Healing Session PATCH] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "关闭会话失败"), { status: 500 });
  }
}

// DELETE: 删除疗愈会话及其消息
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guestId = request.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const healingSession = await db.healingSession.findUnique({
      where: { id: sessionId },
    });
    if (!healingSession || healingSession.userId !== userId) {
      return NextResponse.json(apiError("FORBIDDEN", "无权访问此会话"), { status: 403 });
    }

    // 级联删除消息和会话
    await db.healingMessage.deleteMany({ where: { sessionId } });
    await db.healingSession.delete({ where: { id: sessionId } });

    return NextResponse.json(apiResponse({ message: "疗愈记录已删除" }));
  } catch (error: any) {
    console.error("[Healing Session DELETE] 错误:", error.message);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
