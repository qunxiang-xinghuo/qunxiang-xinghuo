import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 全局认证中间件
 * 
 * 规则：
 * 1. 未登录用户只能访问 /login, /register, /api/auth/* 等公开页面
 * 2. 已登录用户访问 / 或 /register 时，重定向到 /home
 * 3. 静态资源、API 公开接口不受限制
 */

// 公开路由：不需要登录即可访问
const PUBLIC_PATHS = [
  '/',
  '/register',
  '/api/auth',
  '/api/brainholes/bubble',
  '/api/sparks/public',
  '/api/assets/public',
  '/_next',
  '/favicon.ico',
  '/liukanshan.jpg',
  '/avatars',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静态资源和公开 API 直接放行
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/avatars/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 检查是否是公开页面
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // 获取 next-auth JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // 已登录用户访问登录页/注册页 → 重定向到首页
  if (isLoggedIn && (pathname === '/' || pathname === '/register')) {
    console.log('[Middleware] 已登录用户访问', pathname, '→ 重定向到 /home');
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 未登录用户访问非公开页面 → 重定向到登录页
  if (!isLoggedIn && !isPublicPath) {
    console.log('[Middleware] 未登录用户访问', pathname, '→ 重定向到 /');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
