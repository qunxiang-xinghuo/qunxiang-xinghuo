/**
 * 泡泡墙客户端数据获取
 */
import type { BubbleData } from './bubble-engine';

interface FetchOptions {
  limit?: number;
  category?: string;
  refresh?: boolean;
}

export async function fetchBubbles(options: FetchOptions = {}): Promise<BubbleData[]> {
  const { limit = 30, category, refresh = false } = options;
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (category) params.set('category', category);
  if (refresh) params.set('refresh', 'true');

  const res = await fetch(`/api/brainholes/bubble?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const result = await res.json();
  if (result.success && result.data?.brainholes) {
    return result.data.brainholes;
  }
  throw new Error(result.error?.message || '加载失败');
}
