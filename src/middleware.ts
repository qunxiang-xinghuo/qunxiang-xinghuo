/**
 * 安全中间件
 * 提供 CSRF 保护、安全头、CORS 限制等安全功能
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 允许的域名列表（生产环境）
 */
const ALLOWED_ORIGINS = [
  'https://qunxiangxinghuo.cn',
  'https://www.qunxiangxinghuo.cn',
  'http://localhost:3000',
  'http://localhost:5000',
];

/**
 * 安全头配置
 */
const SECURITY_HEADERS = {
  // 内容安全策略
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // 防止点击劫持
  'X-Frame-Options': 'DENY',
  
  // 防止 MIME 类型嗅探
  'X-Content-Type-Options': 'nosniff',
  
  // 启用 XSS 过滤
  'X-XSS-Protection': '1; mode=block',
  
  // referrer 策略
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 权限策略
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * 检查请求来源是否允许
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // 同源请求
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

/**
 * 生成 CSRF token
 */
function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * 验证 CSRF token
 */
function validateCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

/**
 * 添加安全头到响应
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * CORS 中间件
 */
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  
  // 检查来源是否允许
  if (origin && !isOriginAllowed(origin)) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24小时
    }
    
    return addSecurityHeaders(response);
  }
  
  return null;
}

/**
 * CSRF 保护中间件
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // 只对修改数据的请求进行 CSRF 检查
  const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!unsafeMethods.includes(request.method)) {
    return null;
  }
  
  // 获取 CSRF token
  const csrfToken = request.headers.get('X-CSRF-Token');
  const sessionToken = request.cookies.get('csrf-token')?.value;
  
  // 对于 API 路由，暂时跳过 CSRF 检查（因为使用 JWT）
  // 生产环境可以启用
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  // 验证 CSRF token
  if (!validateCSRFToken(csrfToken, sessionToken)) {
    return new NextResponse('Forbidden: Invalid CSRF token', { status: 403 });
  }
  
  return null;
}

/**
 * 速率限制器
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  
  let record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(key, record);
  } else {
    record.count++;
  }
  
  if (record.count > limit) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    response.headers.set('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)));
    return addSecurityHeaders(response);
  }
  
  return null;
}

/**
 * 设置 CSRF token cookie
 */
export function setCSRFToken(response: NextResponse): NextResponse {
  const token = generateCSRFToken();
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1小时
    path: '/',
  });
  return response;
}

/**
 * 审计日志中间件
 */
export function auditLogMiddleware(request: NextRequest, userId?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    userId: userId || 'anonymous',
  };
  
  // 记录到控制台（生产环境可以发送到日志服务）
  console.log('[AUDIT]', JSON.stringify(logEntry));
}
