import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = req.headers.get("x-guest-id");
    const userId = session?.user?.id || guestId;

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        level: true,
        sparkCount: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(apiError("NOT_FOUND", "用户不存在"), { status: 404 });
    }

    return NextResponse.json(apiResponse(user));
  } catch (error: any) {
    console.error("[User Me API] Error:", error);
    return NextResponse.json(apiError("SERVER_ERROR", "服务器错误"), { status: 500 });
  }
}
