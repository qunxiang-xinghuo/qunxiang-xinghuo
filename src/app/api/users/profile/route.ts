import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(30),
});

/**
 * PATCH /api/users/profile
 * 修改用户名（带唯一性检查）
 * v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guestId = req.headers.get("x-guest-id");
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined) || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(apiError("BAD_REQUEST", "用户名格式不正确（1-30个字符）"), { status: 400 });
    }

    const { username } = parsed.data;

    // 唯一性检查：排除当前用户自己
    const existing = await db.user.findFirst({
      where: {
        username,
        id: { not: userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        apiError("USERNAME_EXISTS", "用户名已存在，请重新输入"),
        { status: 409 }
      );
    }

    // 先获取当前用户名，用于更新 Asset 记录
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true },
    });
    const oldName = currentUser?.name || currentUser?.username || '';

    const updated = await db.user.update({
      where: { id: userId },
      data: { username, name: username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        level: true,
        sparkCount: true,
      },
    });

    // 同步更新该用户所有 Asset 记录中的 identity 字段
    if (oldName && oldName !== username) {
      try {
        await db.asset.updateMany({
          where: { userId, identity: oldName },
          data: { identity: username },
        });
        console.log(`[Update Profile] 已同步更新 Asset identity: ${oldName} → ${username}`);
      } catch (e) {
        console.error('[Update Profile] 更新 Asset identity 失败:', e);
        // 不影响主流程，只记录日志
      }
    }

    return NextResponse.json(apiResponse(updated));
  } catch (error: any) {
    console.error("[Update Profile API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
