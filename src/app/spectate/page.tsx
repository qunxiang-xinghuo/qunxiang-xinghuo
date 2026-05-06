// v8.0-login-fix: 服务端入口，强制动态渲染 + 禁用所有缓存 + 禁用 PPR 预渲染
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const ppr = false;

import { unstable_noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SpectateClient from './SpectateClient';

export default async function SpectatePage() {
  // 禁用所有缓存，确保每次请求都经过中间件和服务端组件
  unstable_noStore();
  
  // 服务端检查登录状态：未登录直接重定向（双重保险）
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('next-auth.session-token');
  
  if (!sessionToken) {
    redirect('/login');
  }
  
  return <SpectateClient />;
}
