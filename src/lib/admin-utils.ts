import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * v8.2: 管理员权限检查
 * 返回 { isAdmin: true, userId: string } 或 { isAdmin: false, userId: null }
 */
export async function checkAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId: string | null }> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: false });
  const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);

  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  return { isAdmin: user?.isAdmin ?? false, userId };
}
