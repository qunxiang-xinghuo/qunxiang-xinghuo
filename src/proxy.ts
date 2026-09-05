/**
 * @file Next.js 代理（proxy）
 * @description 全局安全代理：请求过滤、IP 限流、敏感路由保护
 * 注：Next.js 16 中 middleware 约定已更名为 proxy
 * @security
 * - 阻止可疑请求路径（路径遍历攻击）
 * - 全局 API 速率限制
 * - 敏感路由认证检查
 * - 安全响应头补充
 * - 请求 ID 追踪
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 需要认证的路由前缀
 * 未登录用户访问这些路径会被重定向到登录页
 */
const PROTECTED_PREFIXES = [
  '/profile',
  '/room/create',
  '/room/join',
  '/match',
];

/**
 * 敏感 API 路径（严格限流）
 */
const SENSITIVE_API_PATHS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/change-password',
  '/api/reports',
];

/**
 * 危险路径模式（路径遍历、注入攻击特征）
 * 同时检测路径和查询字符串
 */
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // 路径遍历 ../
  /\.\.\\/, // Windows 路径遍历 ..\
  /%2e%2e/i, // 编码的路径遍历
  /<script/i, // XSS 脚本注入
  /javascript:/i, // javascript: 协议注入
  /on(error|load|click)\s*=/i, // 事件处理器注入
  /union\s+select/i, // SQL 注入
  /;\s*drop\s+table/i, // SQL 删除表
  /'\s*or\s*'?\d+'?\s*=\s*'?\d+/i, // SQL 万能密码
  /\x00/, // null 字节
  /\$\{.*\}/, // 模板注入 ${...}
  /\.\.\//, // 重复防御
];

/**
 * 内存限流存储（代理级别）
 * 注意：Edge Runtime 使用不同的存储机制
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * 检查代理级别的速率限制
 */
function checkMiddlewareRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // 清理过期记录
  if (entry && now > entry.resetTime) {
    rateLimitMap.delete(identifier);
  }

  const current = rateLimitMap.get(identifier) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  rateLimitMap.set(identifier, current);
  return true;
}

/**
 * 获取客户端真实 IP
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * 代理主函数（Next.js 16 proxy 约定）
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = getClientIP(request);

  // 检测目标包含完整路径 + 查询字符串（注入常藏在 query 中）
  const fullPath = pathname + search;

  // ===== 1. 阻止可疑请求 =====
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(fullPath)) {
      console.warn(`[安全拦截] 可疑请求: ${fullPath} from ${ip}`);
      return NextResponse.json(
        { error: '请求被拒绝' },
        { status: 403 }
      );
    }
  }

  // ===== 1.1 限制请求体大小（防巨型 payload 攻击）=====
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 200 * 1024) {
    // 超过 200KB 的请求体直接拒绝（正常业务最大为故事内容）
    console.warn(`[安全拦截] 请求体过大: ${contentLength} bytes from ${ip}`);
    return NextResponse.json(
      { error: '请求内容过大' },
      { status: 413 }
    );
  }

  // ===== 2. API 速率限制 =====
  if (pathname.startsWith('/api/')) {
    const isSensitive = SENSITIVE_API_PATHS.some((p) => pathname.startsWith(p));

    // 敏感接口：1 分钟 10 次
    // 普通 API：1 分钟 100 次
    const maxRequests = isSensitive ? 10 : 100;
    const windowMs = 60 * 1000;

    const allowed = checkMiddlewareRateLimit(
      `api:${ip}:${isSensitive ? 'sensitive' : 'normal'}`,
      maxRequests,
      windowMs
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: '请求过于频繁，请稍后再试',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // ===== 3. 敏感路由认证检查 =====
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtected) {
    // 检查 NextAuth 会话 Token
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ===== 4. 安全响应头（补充） =====
  const response = NextResponse.next();

  // 请求 ID（用于日志追踪）
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);

  return response;
}

/**
 * 代理匹配配置
 * 排除静态资源、Next.js 内部路由
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态资源)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 目录下的静态文件（图片、字体等）
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:jpe?g|png|gif|webp|svg|ico|woff2?|ttf|eot|mp4|webm)).*)',
  ],
};
