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
const PUBLIC_PATHS = ['/', '/login', '/register', '/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 next-auth JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // v8.0-login-fix: spectate 路由调试（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    if (pathname === '/spectate' || pathname.startsWith('/spectate/')) {
      console.log('[Middleware-Spectate]', pathname, 'isLoggedIn=', isLoggedIn);
    }
    console.log('[Middleware]', pathname, 'isLoggedIn=', isLoggedIn, 'token=', token ? 'yes' : 'no');
  }

  // 已登录用户访问登录页/注册页 → 重定向到首页
  if (isLoggedIn && PUBLIC_PATHS.includes(pathname)) {
    // console.log('[Middleware] 已登录用户访问', pathname, '→ 重定向到 /home');
    const response = NextResponse.redirect(new URL('/home', request.url));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 未登录用户访问非公开页面 → 重定向到登录页
  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) {
    console.log('[Middleware] 未登录用户访问', pathname, '→ 重定向到 /login');
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Middleware-Guard', 'redirect-to-login');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export const config = {
  // 覆盖所有页面路由，排除 API、Next 静态资源和带扩展名的文件。
  // 这样新增页面时不会因为忘记更新 matcher 而出现认证绕过或行为不一致。
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
