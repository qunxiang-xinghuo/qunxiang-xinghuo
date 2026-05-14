import { NextRequest } from "next/server";
import { getToken as getJwtToken } from "next-auth/jwt";

/**
 * 共享 getToken 封装，确保 secureCookie: false 与 auth.ts cookie 配置一致。
 * 所有 API 路由统一使用此函数，而非直接调用 next-auth/jwt 的 getToken。
 */
export async function getToken(req: NextRequest) {
  return getJwtToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });
}
