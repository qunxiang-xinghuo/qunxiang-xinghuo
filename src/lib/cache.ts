/**
 * 内存缓存工具
 * 用于缓存 API 响应，减少数据库查询
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    this.cache.forEach((entry) => {
      if (now > entry.expiry) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

// 导出单例
export const cache = new MemoryCache();

/**
 * 缓存装饰器
 * 用于缓存函数返回值
 */
export function withCache<T>(
  keyPrefix: string,
  ttlSeconds: number = 300
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const key = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 存入缓存
      await cache.set(key, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}
