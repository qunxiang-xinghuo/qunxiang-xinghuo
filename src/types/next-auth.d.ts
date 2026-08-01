/**
 * @file NextAuth 类型扩展
 * @description 扩展 NextAuth 默认的 Session 和 JWT 类型定义
 * 添加用户 id 字段，方便在客户端和服务端获取当前用户 ID
 */

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
