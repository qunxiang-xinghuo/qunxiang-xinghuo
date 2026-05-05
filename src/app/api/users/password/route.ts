import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";
import bcrypt from "bcryptjs";

const passwordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
  confirmPassword: z.string().min(6).max(100),
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
    const parsed = passwordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("BAD_REQUEST", "密码格式不正确（新密码至少6个字符）"),
        { status: 400 }
      );
    }

    const { oldPassword, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return NextResponse.json(apiError("BAD_REQUEST", "两次输入的新密码不一致"), { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(apiError("NOT_FOUND", "用户不存在"), { status: 404 });
    }

    // 验证旧密码
    if (!user.password) {
      return NextResponse.json(apiError("BAD_REQUEST", "当前账号未设置密码"), { status: 400 });
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return NextResponse.json(apiError("UNAUTHORIZED", "旧密码不正确"), { status: 401 });
    }

    // bcrypt 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json(apiResponse({ message: "密码修改成功" }));
  } catch (error: any) {
    console.error("[Update Password API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
