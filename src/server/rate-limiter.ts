interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 内存中的限流记录（生产环境应使用Redis）
const rateLimitStore = new Map<string, RateLimitRecord>();

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAfter: number;
}> {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime <= now) {
    // 新窗口或窗口已重置
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAfter: windowMs,
    };
  }

  // 检查是否超过限制
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAfter: record.resetTime - now,
    };
  }

  // 增加计数
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: limit - record.count,
    resetAfter: record.resetTime - now,
  };
}

export function getRateLimitKey(identifier: string, action: string): string {
  return `rate:${identifier}:${action}`;
}

// 预定义的限流规则
export const RATE_LIMITS = {
  // 身份验证相关
  AUTH: {
    LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 15分钟内5次登录尝试
    SIGNUP: { limit: 3, windowMs: 60 * 60 * 1000 }, // 1小时内3次注册
  },

  // 脑洞相关
  BRAINHOLE: {
    CREATE: { limit: 10, windowMs: 60 * 60 * 1000 }, // 1小时内10个脑洞
    REACT: { limit: 30, windowMs: 60 * 60 * 1000 }, // 1小时内30次反应
    COLLECT: { limit: 50, windowMs: 60 * 60 * 1000 }, // 1小时内50次收藏
  },

  // 匹配相关
  MATCH: {
    REQUEST: { limit: 20, windowMs: 60 * 60 * 1000 }, // 1小时内20次匹配请求
  },

  // 房间相关
  ROOM: {
    MESSAGE: { limit: 100, windowMs: 60 * 60 * 1000 }, // 1小时内100条消息
    SPARK: { limit: 30, windowMs: 60 * 60 * 1000 }, // 1小时内30次火花标记
  },

  // AI相关
  AI: {
    PROMPT: { limit: 50, windowMs: 60 * 60 * 1000 }, // 1小时内50次AI提示请求
    STORY: { limit: 10, windowMs: 60 * 60 * 1000 }, // 1小时内10次故事生成
  },
};

export async function checkRateLimitByRule(
  identifier: string,
  category: keyof typeof RATE_LIMITS,
  action: string
) {
  const rule = (RATE_LIMITS[category] as any)[action];
  if (!rule) {
    return { allowed: true, remaining: Infinity, resetAfter: 0 };
  }

  const key = getRateLimitKey(identifier, `${category}:${action}`);
  return checkRateLimit(key, rule.limit, rule.windowMs);
}

// 清理过期的限流记录
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// 定期清理
if (process.env.NODE_ENV !== "test") {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000); // 每5分钟清理一次
}