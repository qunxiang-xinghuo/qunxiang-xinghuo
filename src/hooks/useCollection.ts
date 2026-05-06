'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Brainhole } from '@/components/brainhole/BrainholeCard';

export function useCollection() {
  const [collectedBrainholes, setCollectedBrainholes] = useState<Brainhole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch('/api/brainholes/collected');
      if (!res.ok) {
        console.error(`[useCollection] fetch failed: ${res.status}`);
        if (mountedRef.current) setError(`加载收藏失败 (${res.status})`);
        return;
      }
      const result = await res.json();
      if (!mountedRef.current) return;
      if (result.success && result.data?.brainholes) {
        const mapped: Brainhole[] = result.data.brainholes.map((b: any) => ({
          id: String(b.id),
          title: String(b.title),
          content: String(b.scenario || b.content || ''),
          source: String(b.source || '群像星火'),
          tags: Array.isArray(b.tags)
            ? b.tags.map((t: any) =>
                typeof t === 'string' ? t : String(t.name || t.tag?.name || '')
              ).filter(Boolean)
            : undefined,
        }));
        setCollectedBrainholes(mapped);
      } else {
        setError(result.error || '加载收藏失败');
      }
    } catch (err: any) {
      console.error('[useCollection] Fetch error:', err);
      if (mountedRef.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const collectBrainhole = async (brainhole: Brainhole) => {
    try {
      const res = await fetch(`/api/brainholes/${brainhole.id}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) {
        await fetchCollections();
      } else {
        setError(result.error || '收藏失败');
      }
    } catch (err: any) {
      console.error('[useCollection] Collect error:', err);
      setError(err.message);
    }
  };

  const uncollectBrainhole = async (id: string) => {
    try {
      const res = await fetch(`/api/brainholes/${id}/collect`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        await fetchCollections();
      } else {
        setError(result.error || '取消收藏失败');
      }
    } catch (err: any) {
      console.error('[useCollection] Uncollect error:', err);
      setError(err.message);
    }
  };

  const isCollected = (id: string) => {
    return collectedBrainholes.some((b) => b.id === id);
  };

  return {
    collectedBrainholes,
    loading,
    error,
    collectBrainhole,
    uncollectBrainhole,
    isCollected,
    refresh: fetchCollections,
  };
}
