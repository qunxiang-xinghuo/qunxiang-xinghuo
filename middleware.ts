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

  // getToken 用 req.cookies[name] 读取，但 NextRequest.cookies 是 RequestCookies 对象
  // 不支持中括号语法，必须绕过传原始 cookie header
  const token = await getToken({
    req: {
      headers: new Headers({ cookie: request.headers.get('cookie') || '' }),
    } as any,
    secret: process.env.NEXTAUTH_SECRET!,
    secureCookie: (process.env.NEXTAUTH_URL || '').startsWith('https://'),
  });
  const isLoggedIn = !!token;

  // 调试日志（生产环境保留，排查跳转回环用）
  if (pathname.startsWith('/admin')) {
    const cookieHeader = request.headers.get('cookie');
    console.log('[Middleware-Admin]', pathname,
      'isLoggedIn:', isLoggedIn,
      'hasCookie:', !!cookieHeader,
      'tokenSub:', token?.sub || token?.id || 'none');
  }

  // 已登录用户访问登录页/注册页 → 重定向到首页
  if (isLoggedIn && PUBLIC_PATHS.includes(pathname)) {
    const redirectTo = pathname === '/admin/login' ? '/admin' : '/home';
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 未登录用户访问非公开页面 → 重定向到登录页
  if (!isLoggedIn && !PUBLIC_PATHS.includes(pathname)) {
    const redirectTo = pathname.startsWith('/admin') ? '/admin/login' : '/login';
    console.log('[Middleware] 未登录用户访问', pathname, '→ 重定向到', redirectTo);
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
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
