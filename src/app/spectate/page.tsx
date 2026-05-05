// v7.0-fix7: 服务端入口，强制动态渲染确保中间件执行
// 同时在服务端组件中检查登录状态，作为中间件的兜底
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SpectateClient from './SpectateClient';

export default async function SpectatePage() {
  // 服务端检查登录状态：未登录直接重定向（双重保险）
  console.log('[SpectatePage] rendering start');
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('next-auth.session-token');
  console.log('[SpectatePage] sessionToken=', sessionToken ? 'EXISTS' : 'NONE');
  
  if (!sessionToken) {
    console.log('[SpectatePage] redirecting to /login');
    redirect('/login');
  }
  
  console.log('[SpectatePage] rendering client');
  return <SpectateClient />;
}
