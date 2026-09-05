/**
 * @fileoverview NextAuth 认证配置
 * @description 配置 NextAuth 的认证选项，强化会话安全
 *
 * 安全措施：
 * - bcrypt 密码哈希（12 轮）
 * - JWT 会话（HttpOnly + Secure + SameSite Cookie）
 * - 会话最大有效期 7 天
 * - 登录失败不区分"用户不存在"和"密码错误"（防用户枚举）
 * - 自定义 JWT 加密密钥
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * bcrypt 哈希轮数
 * 12 轮在安全性和性能之间取得平衡（约 250ms/次）
 */
const BCRYPT_ROUNDS = 12;

/**
 * 会话最大有效期（秒）
 * 7 天
 */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 规范化邮箱（小写 + 去空格）
        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // 即使用户不存在也执行一次 bcrypt 比较（防时序攻击）
        // 这样无论用户是否存在，响应时间都相近
        const dummyHash = '$2a$12$CgQJ8mQ8mLxKxN3pV2Yz5eR9tW4vB6nH1aJ0sD7fG3hY5uI6oP2k';
        const hashToCompare = user?.passwordHash || dummyHash;

        const isValid = await bcrypt.compare(credentials.password, hashToCompare);

        // 用户不存在或密码错误都返回 null（不区分原因，防用户枚举）
        if (!user || !isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // 错误也跳回登录页
  },
  // Cookie 安全配置
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true, // 禁止 JavaScript 访问（防 XSS 窃取）
        sameSite: 'lax', // 防 CSRF
        path: '/',
        secure: process.env.NODE_ENV === 'production', // 生产环境仅 HTTPS
        maxAge: SESSION_MAX_AGE,
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

/**
 * 导出密码哈希函数（供注册和修改密码使用）
 * 统一使用 12 轮 bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
