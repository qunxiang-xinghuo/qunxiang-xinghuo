import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { withCallbackParams } from "@/lib/auth/callback-store";

const handler = NextAuth(authOptions);

async function wrappedHandler(req: NextRequest, ctx: any) {
  const url = new URL(req.url);
  if (url.pathname.includes("/callback/zhihu")) {
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    console.log("[Auth Route] 拦截知乎回调, params:", JSON.stringify(params));
    return withCallbackParams(params, () => handler(req, ctx));
  }
  return handler(req, ctx);
}

export { wrappedHandler as GET, wrappedHandler as POST };
