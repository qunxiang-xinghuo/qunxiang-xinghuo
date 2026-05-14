// v8.0-login-fix: 服务端入口，强制动态渲染 + 禁用所有缓存
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { unstable_noStore } from 'next/cache';
import { cookies } from 'next/headers';
import SpectateClient from './SpectateClient';

export default async function SpectatePage() {
  // 禁用所有缓存，确保每次请求都经过中间件和服务端组件
  unstable_noStore();

  // 服务端检查登录状态
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('next-auth.session-token');

  // 未登录时返回客户端重定向页面（即使被预渲染/缓存，客户端也会立即跳转）
  if (!sessionToken) {
    return (
      <html lang="zh-CN">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>群像·星火</title>
          <script dangerouslySetInnerHTML={{ __html: 'window.location.replace("/login")' }} />
          <noscript>
            <meta httpEquiv="refresh" content="0;url=/login" />
          </noscript>
        </head>
        <body style={{ background: '#0c0c0e', margin: 0 }} />
      </html>
    );
  }

  return <SpectateClient />;
}
