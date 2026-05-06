import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcryptjs";

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
    };
  }

  interface User {
    id: string;
    level: number;
    sparkCount: number;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    level?: number;
    sparkCount?: number;
    username?: string | null;
  }
}

// v8.0-fix: 确保 NEXTAUTH_SECRET 在生产环境中已设置
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('[Auth] NEXTAUTH_SECRET 未设置，使用 fallback 密钥（不推荐用于生产环境）');
}

export const authOptions: NextAuthOptions = {
  // v8.0-fix: 移除 PrismaAdapter。我们使用 JWT + CredentialsProvider，
  // 不需要数据库存储 session/account。PrismaAdapter v2 与 next-auth v4 不兼容。
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-min-32-chars-long!!',
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
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          // 优先通过 username 查找
          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username },
              ],
            },
          });

          if (!user) {
            return null;
          }

          // 验证密码
          if (user.password) {
            const valid = await bcrypt.compare(credentials.password, user.password);
            if (!valid) {
              return null;
            }
          } else {
            // 兼容旧用户：没有密码的不能通过 credentials 登录
            return null;
          }

          return {
            id: user.id,
            name: user.name || user.username || user.email?.split("@")[0],
            email: user.email,
            username: user.username,
            level: user.level,
            sparkCount: user.sparkCount,
          };
        } catch (error) {
          console.error('[Auth] authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.level = user.level;
        token.sparkCount = user.sparkCount;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.level = (token.level as number) ?? 1;
        session.user.sparkCount = (token.sparkCount as number) ?? 0;
        session.user.username = token.username as string | null;
      }
      return session;
    },
  },
};
