/**
 * @file 全局 Provider 组件
 * @description 包装 NextAuth SessionProvider，为整个应用提供认证上下文
 * 在 layout.tsx 中引用，确保所有子组件可访问会话状态
 */

'use client';

import { SessionProvider } from 'next-auth/react';

/** 全局认证 Provider，包裹所有子页面 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
