import { NextAuthOptions } from "next-auth";
import { db } from "./db";
import ZhihuProvider from "./auth/zhihu-provider";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      level: number;
      sparkCount: number;
      isAdmin?: boolean;
    };
  }

  interface User {
    id: string;
    level: number;
    sparkCount: number;
    username?: string | null;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    level?: number;
    sparkCount?: number;
    username?: string | null;
    isAdmin?: boolean;
  }
}

// v8.0-fix: 确保 NEXTAUTH_SECRET 在生产环境中已设置
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (!NEXTAUTH_SECRET || NEXTAUTH_SECRET.length < 32) {
  throw new Error('[Auth] NEXTAUTH_SECRET 未设置或长度不足32字符，应用无法启动。请在 .env 中设置强密钥。');
}

export const authOptions: NextAuthOptions = {
  // v8.0-fix: 移除 PrismaAdapter。我们使用 JWT + CredentialsProvider，
  // 不需要数据库存储 session/account。PrismaAdapter v2 与 next-auth v4 不兼容。
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // v6.3-auth-fix3: JWT 有效期 24 小时，避免长期会话残留
    maxAge: 24 * 60 * 60,
    // 每 6 小时更新一次 session
    updateAge: 6 * 60 * 60,
  },
  jwt: {
    // JWT 签名密钥（fallback 到 NEXTAUTH_SECRET）
    secret: process.env.NEXTAUTH_SECRET,
  },
  // v7.0-fix5: cookie 设为 session cookie（关闭浏览器即失效），
  // 同时 JWT 仍保持 24 小时服务端有效期
  // v8.0-fix: 生产环境使用 HTTP（非 HTTPS），secure 必须设为 false
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // v9.4: 仅支持知乎 OAuth 登录
    ZhihuProvider({
      clientId: process.env.ZHIHU_APP_ID || "",
      clientSecret: process.env.ZHIHU_APP_KEY || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // v9.3: 知乎 OAuth 用户自动创建/关联
      if (account?.provider === "zhihu" && user.id) {
        try {
          const existing = await db.user.findUnique({ where: { id: user.id } });
          if (!existing) {
            await db.user.create({
              data: {
                id: user.id,
                name: user.name || "知乎用户",
                email: user.email || `${user.id}@zhihu.oauth`,
                username: (user as any).username || user.name || "知乎用户",
                level: 1,
                sparkCount: 0,
                isAdmin: false,
                // 知乎用户没有密码，标记为 OAuth 用户
                password: null,
              },
            });
            console.log("[Auth] 知乎用户自动创建:", user.id);
          } else {
            console.log("[Auth] 知乎用户已存在:", user.id);
          }
        } catch (err: any) {
          console.error("[Auth] 知乎用户创建失败:", err.message);
          // 不阻断登录，继续用 JWT
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.level = user.level;
        token.sparkCount = user.sparkCount;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
      }
      // v9.3: 知乎 OAuth 登录时，从 account 补充信息
      if (account?.provider === "zhihu" && account.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.level = (token.level as number) ?? 1;
        session.user.sparkCount = (token.sparkCount as number) ?? 0;
        session.user.username = token.username as string | null;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
};
