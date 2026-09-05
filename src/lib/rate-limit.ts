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
  // AI 接口限制（成本控制）
  ai: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 分钟 10 次
  },
} as const;

/**
 * 登录失败锁定存储
 * 连续登录失败会递增锁定时间
 */
const loginAttemptStore = new Map<
  string,
  { failures: number; lockedUntil: number }
>();

/**
 * 记录登录失败
 * 锁定策略：
 * - 第 1-4 次失败：不锁定
 * - 第 5 次失败：锁定 5 分钟
 * - 第 6-9 次失败：锁定 15 分钟
 * - 第 10 次及以上：锁定 1 小时
 */
export function recordLoginFailure(identifier: string): {
  locked: boolean;
  retryAfter: number;
  attemptsRemaining: number;
} {
  const now = Date.now();
  const record = loginAttemptStore.get(identifier) || {
    failures: 0,
    lockedUntil: 0,
  };

  record.failures += 1;

  if (record.failures >= 10) {
    record.lockedUntil = now + 60 * 60 * 1000; // 1 小时
  } else if (record.failures >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 分钟
  } else if (record.failures >= 3) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 分钟
  }

  loginAttemptStore.set(identifier, record);

  const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
  const attemptsRemaining = Math.max(0, 3 - (record.failures % 5));

  return {
    locked: record.lockedUntil > now,
    retryAfter: retryAfter > 0 ? retryAfter : 0,
    attemptsRemaining,
  };
}

/**
 * 检查是否被锁定
 */
export function isLockedOut(identifier: string): {
  locked: boolean;
  retryAfter: number;
} {
  const now = Date.now();
  const record = loginAttemptStore.get(identifier);

  if (!record || record.lockedUntil <= now) {
    return { locked: false, retryAfter: 0 };
  }

  return {
    locked: true,
    retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
  };
}

/**
 * 登录成功后重置失败计数
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

// 定期清理过期的登录锁定记录
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttemptStore.entries()) {
    if (record.lockedUntil < now && record.failures < 3) {
      loginAttemptStore.delete(key);
    }
  }
}, 10 * 60 * 1000); // 每 10 分钟清理

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<Response>,
  config: RateLimitConfig = RATE_LIMITS.standard,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIdentifier?: (req: any) => string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
