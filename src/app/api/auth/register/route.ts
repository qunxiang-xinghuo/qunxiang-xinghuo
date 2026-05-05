import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(2).max(30),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  console.log("[Register API] ====== 收到注册请求 ======");

  try {
    const body = await req.json();
    console.log("[Register API] 请求体:", { username: body?.username, passwordLength: body?.password?.length });

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[Register API] 参数校验失败:", parsed.error.issues);
      return NextResponse.json(
        { success: false, message: "用户名或密码格式不正确（用户名2-30字符，密码至少6位）" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    console.log("[Register API] 参数校验通过，username:", username);

    // 检查用户名是否已存在
    console.log("[Register API] 正在查询数据库...");
    const existing = await db.user.findFirst({
      where: { username },
    });
    console.log("[Register API] 查询结果:", existing ? "用户名已存在" : "用户名可用");

    if (existing) {
      return NextResponse.json(
        { success: false, message: "用户名已被注册，请更换后重试" },
        { status: 409 }
      );
    }

    // bcrypt 加密密码
    console.log("[Register API] 正在加密密码...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[Register API] 密码加密完成");

    // 创建用户
    console.log("[Register API] 正在创建用户...");
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name: username,
        level: 1,
        sparkCount: 0,
      },
    });
    console.log("[Register API] 用户创建成功, id:", user.id);

    return NextResponse.json({
      success: true,
      message: "注册成功",
      data: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error("[Register API] ====== 注册异常 ======");
    console.error("[Register API] Error:", error);
    console.error("[Register API] Error message:", error.message);
    if (error.code) console.error("[Register API] Error code:", error.code);
    if (error.meta) console.error("[Register API] Error meta:", error.meta);

    // Prisma 唯一约束冲突
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "用户名已被注册，请更换后重试" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
