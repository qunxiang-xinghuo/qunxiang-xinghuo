import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(30),
});

/**
 * PATCH /api/users/profile
 * 修改用户名（带唯一性检查）
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

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

    const updated = await db.user.update({
      where: { id: userId },
      data: { username },
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

    return NextResponse.json(apiResponse(updated));
  } catch (error: any) {
    console.error("[Update Profile API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
