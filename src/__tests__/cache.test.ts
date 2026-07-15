import { cache } from '@/lib/cache';

describe('CacheManager', () => {
  beforeEach(() => {
    cache.clear();
  });

  test('should set and get cache', async () => {
    await cache.set('test-key', { data: 'test' });
    const result = await cache.get('test-key');
    expect(result).toEqual({ data: 'test' });
  });

  test('should return null for expired cache', async () => {
    await cache.set('test-key', { data: 'test' }, 0.1); // 0.1 秒 = 100ms TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  test('should delete cache', async () => {
    await cache.set('test-key', { data: 'test' });
    await cache.delete('test-key');
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  test('should clear all cache', async () => {
    await cache.set('key1', { data: 'test1' });
    await cache.set('key2', { data: 'test2' });
    await cache.clear();
    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
  });
});
