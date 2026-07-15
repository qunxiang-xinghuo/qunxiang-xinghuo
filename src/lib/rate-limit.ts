/**
 * 简单的内存级 Rate Limiting 实现
 * 适用于单服务器部署场景
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 内存存储（服务器重启会重置）
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number; // 最大请求数
  windowMs: number; // 时间窗口（毫秒）
}

// 预设配置
export const RATE_LIMITS = {
  // 严格限制：登录、注册等敏感操作
  strict: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 分钟 5 次
  },
  // 标准限制：普通 API
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 分钟 60 次
  },
  // 宽松限制：公开接口
  lenient: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 分钟 100 次
  },
} as const;

/**
 * 检查是否超过速率限制
 * @param identifier 标识符（IP 地址或用户 ID）
 * @param config 速率限制配置
 * @returns 是否允许请求
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // 清理过期记录
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(identifier);
  }

  // 获取或创建记录
  const currentEntry = rateLimitStore.get(identifier) || {
    count: 0,
    resetTime: now + config.windowMs,
  };

  // 检查是否超限
  if (currentEntry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
    };
  }

  // 更新计数
  currentEntry.count += 1;
  rateLimitStore.set(identifier, currentEntry);

  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime,
  };
}

/**
 * 获取客户端 IP 地址
 */
export function getClientIP(headers: Headers): string {
  // 优先使用 X-Forwarded-For（代理场景）
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 使用 X-Real-IP
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Rate Limiting 中间件工厂
 */
export function withRateLimit(
  handler: (...args: any[]) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.standard,
  getIdentifier?: (req: any) => string
) {
  return async (...args: any[]): Promise<Response> => {
    const req = args[0];
    const identifier = getIdentifier
      ? getIdentifier(req)
      : getClientIP(req.headers);

    const result = checkRateLimit(identifier, config);

    // 添加速率限制响应头
    const headers = new Headers({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.floor(result.resetTime / 1000).toString(),
    });

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(headers),
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(
              (result.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    return handler(...args);
  };
}

/**
 * 定期清理过期记录（防止内存泄漏）
 * 每 5 分钟执行一次
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
