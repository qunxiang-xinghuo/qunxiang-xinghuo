import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { checkAdmin } from "@/lib/admin-utils";
import { hash } from "bcryptjs";

// GET: 用户列表 + 搜索
export async function GET(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: {
          select: { assets: true, createdStories: true },
        },
      },
    });

    const list = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      image: u.image,
      isAdmin: u.isAdmin,
      level: u.level,
      sparkCount: u._count.assets,
      storyCount: u._count.createdStories,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(apiResponse({ list }));
  } catch (error) {
    console.error("[Admin Users GET] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "获取失败"), { status: 500 });
  }
}

// POST: 创建用户
export async function POST(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, name, email, password, isAdmin: setAdmin } = body;

    if (!username || !password) {
      return NextResponse.json(apiError("BAD_REQUEST", "用户名和密码必填"), { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(apiError("BAD_REQUEST", "密码至少6位"), { status: 400 });
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ username }, { email: email || undefined }] },
    });
    if (existing) {
      return NextResponse.json(apiError("CONFLICT", "用户名或邮箱已存在"), { status: 409 });
    }

    const hashed = await hash(password, 10);
    const user = await db.user.create({
      data: {
        username,
        name: name || username,
        email: email || `${username}@admin.created`,
        password: hashed,
        isAdmin: !!setAdmin,
      },
    });

    return NextResponse.json(apiResponse({
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    }), { status: 201 });
  } catch (error) {
    console.error("[Admin Users POST] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "创建失败"), { status: 500 });
  }
}

// PUT: 更新用户
export async function PUT(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, username, name, password, isAdmin: setAdmin } = body;

    if (!id) {
      return NextResponse.json(apiError("BAD_REQUEST", "用户ID必填"), { status: 400 });
    }

    const data: any = {};
    if (username !== undefined) data.username = username;
    if (name !== undefined) data.name = name;
    if (password) data.password = await hash(password, 10);
    if (setAdmin !== undefined) data.isAdmin = setAdmin;

    const user = await db.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(apiResponse({
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
    }));
  } catch (error: any) {
    console.error("[Admin Users PUT] Error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "用户不存在"), { status: 404 });
    }
    return NextResponse.json(apiError("SERVER_ERROR", "更新失败"), { status: 500 });
  }
}

// DELETE: 删除用户及关联数据
export async function DELETE(request: NextRequest) {
  const { isAdmin } = await checkAdmin(request);
  if (!isAdmin) {
    return NextResponse.json(apiError("FORBIDDEN", "无权限"), { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(apiError("BAD_REQUEST", "用户ID必填"), { status: 400 });
    }

    // 不能删除自己
    const token = await checkAdmin(request);
    // @ts-ignore
    const adminUserId = token?.userId;
    if (id === adminUserId) {
      return NextResponse.json(apiError("FORBIDDEN", "不能删除自己"), { status: 403 });
    }

    await db.$transaction(async (tx) => {
      // 1. 清理用户的关联数据
      await tx.reaction.deleteMany({ where: { userId: id } });
      await tx.roomParticipant.deleteMany({ where: { userId: id } });
      await tx.voteCast.deleteMany({ where: { userId: id } });
      await tx.brainholeCollection.deleteMany({ where: { userId: id } });
      await tx.storyRole.updateMany({ where: { claimedBy: id }, data: { claimedBy: null, claimStatus: "unclaimed" } });
      await tx.healingSession.deleteMany({ where: { userId: id } });
      await tx.roomMessage.deleteMany({ where: { senderId: id } });

      // 2. 将用户创建的 stories/brainholes/assets 的 ownership 置空
      await tx.story.updateMany({ where: { creatorId: id }, data: { creatorId: null } });
      await tx.story.updateMany({ where: { directorId: id }, data: { directorId: null } });
      await tx.brainhole.updateMany({ where: { authorId: id }, data: { authorId: "system" } });
      await tx.asset.updateMany({ where: { userId: id }, data: { userId: "system" } });

      // 3. 删除其他关联数据
      await tx.assetLike.deleteMany({ where: { userId: id } });
      await tx.roomComment.deleteMany({ where: { userId: id } });
      await tx.userIdentity.deleteMany({ where: { userId: id } });
      await tx.account.deleteMany({ where: { userId: id } });
      await tx.session.deleteMany({ where: { userId: id } });

      // 4. 删除用户
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json(apiResponse({ message: "用户已删除" }));
  } catch (error: any) {
    console.error("[Admin Users DELETE] Error:", error);
    if (error.code === "P2025") {
      return NextResponse.json(apiResponse({ message: "用户不存在或已删除" }));
    }
    return NextResponse.json(apiError("SERVER_ERROR", "删除失败"), { status: 500 });
  }
}
