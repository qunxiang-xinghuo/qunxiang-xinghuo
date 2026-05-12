import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const createIdentitySchema = z.object({
  label: z.string().min(1, "身份标签不能为空").max(100, "身份标签不能超过100字"),
});

// v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const identities = await db.userIdentity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiResponse(identities));
  } catch (error) {
    console.error("获取用户身份失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "获取用户身份失败"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ secureCookie: false, req: request, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);
    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validatedData = createIdentitySchema.parse(body);

    // 检查是否已存在相同标签的身份
    const existingIdentity = await db.userIdentity.findFirst({
      where: {
        userId,
        label: validatedData.label,
      },
    });

    if (existingIdentity) {
      return NextResponse.json(apiError("IDENTITY_ALREADY_EXISTS", "该身份标签已存在"), { status: 400 });
    }

    const identity = await db.userIdentity.create({
      data: {
        userId,
        label: validatedData.label,
        verified: false,
      },
    });

    return NextResponse.json(apiResponse(identity), { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstError = (error as any).issues?.[0]?.message || "验证失败";
      return NextResponse.json(apiError("VALIDATION_ERROR", firstError), { status: 400 });
    }
    console.error("创建用户身份失败:", error);
    return NextResponse.json(apiError("INTERNAL_SERVER_ERROR", "创建用户身份失败"), { status: 500 });
  }
}