import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 全局认证中间件
 * 
 * v6.3-auth-fix3: 强制登录墙
 * 规则：
 * 1. 未登录用户只能访问 / 和 /register
 * 2. 已登录用户访问 / 或 /register 时，重定向到 /home
 * 3. 静态资源直接放行
 */

// 公开路由：不需要登录即可访问
const PUBLIC_PATHS = ['/', '/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 next-auth JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // v7.0-fix7: 强制 spectate 路由经过中间件
  console.log('[Middleware]', pathname, 'isLoggedIn=', isLoggedIn, 'token=', token ? 'yes' : 'no');

  // 已登录用户访问登录页/注册页 → 重定向到首页
  if (isLoggedIn && PUBLIC_PATHS.includes(pathname)) {
    console.log('[Middleware] 已登录用户访问', pathname, '→ 重定向到 /home');
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 未登录用户访问非公开页面 → 重定向到登录页
  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) {
    console.log('[Middleware] 未登录用户访问', pathname, '→ 重定向到 /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// v6.3-auth-fix3: 使用更可靠的 matcher，匹配所有页面路径
// 排除 API 路由、静态资源、图片等
export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/home',
    '/library/:path*',
    '/story-hall/:path*',
    '/profile',
    '/profile/sparks',
    '/settings',
    '/settings/:path*',
    '/solo-match',
    '/duo-match',
    '/duo-waiting',
    '/duo-timeout',
    '/multi-match',
    '/multi-waiting',
    '/room/:path*',
    '/healing/:path*',
    '/identity',
    '/earnings',
    '/match',
    '/messages',
    '/multiplayer',
    '/roadshow',
    '/story',
    '/feedback',
    '/zhihu-search',
    '/zhihu-zhida',
    '/zhihu-ring',
    '/brainhole/:path*',
    '/spectate',
    '/spectate/:path*',
  ],
};
