import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import { z } from "zod";

const avatarSchema = z.object({
  image: z.string().min(1).max(5000000), // base64 最大 5MB
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const body = await req.json();
    const parsed = avatarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(apiError("BAD_REQUEST", "图片数据格式不正确"), { status: 400 });
    }

    const { image } = parsed.data;

    // 验证 base64 格式
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(apiError("BAD_REQUEST", "请上传有效的图片文件"), { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { image },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json(apiResponse(updated));
  } catch (error: any) {
    console.error("[Update Avatar API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
