import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(30),
});

export async function PUT(req: NextRequest) {
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
      return NextResponse.json(apiError("BAD_REQUEST", "昵称格式不正确（1-30个字符）"), { status: 400 });
    }

    const { name } = parsed.data;

    // 检查用户名是否已存在（如果修改的是 username 字段）
    // 这里只修改 name（昵称），不修改 username（登录名）
    // 昵称不需要全局唯一

    const updated = await db.user.update({
      where: { id: userId },
      data: { name },
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
