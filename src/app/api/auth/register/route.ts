import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(2).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "用户名或密码格式不正确" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // 检查用户名是否已存在
    const existing = await db.user.findFirst({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "用户名已被注册" },
        { status: 409 }
      );
    }

    // bcrypt 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name: username,
        level: 1,
        sparkCount: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "注册成功",
      data: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error("[Register API] Error:", error);
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
