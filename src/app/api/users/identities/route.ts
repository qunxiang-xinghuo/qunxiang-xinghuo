import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const createIdentitySchema = z.object({
  label: z.string().min(1, "身份标签不能为空").max(100, "身份标签不能超过100字"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const identities = await db.userIdentity.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await request.json();
    const validatedData = createIdentitySchema.parse(body);

    // 检查是否已存在相同标签的身份
    const existingIdentity = await db.userIdentity.findFirst({
      where: {
        userId: session.user.id,
        label: validatedData.label,
      },
    });

    if (existingIdentity) {
      return NextResponse.json(apiError("IDENTITY_ALREADY_EXISTS", "该身份标签已存在"), { status: 400 });
    }

    const identity = await db.userIdentity.create({
      data: {
        userId: session.user.id,
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