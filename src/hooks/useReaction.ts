'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Reaction {
  id: string;
  brainholeId: string;
  identityLabel: string;
  content: string;
  aiPrompt: string;
  sparkCount: number;
  createdAt: string;
  isSparked: boolean;
}

interface ApiReaction {
  id: string;
  brainholeId: string;
  identity: string;
  content: string;
  isSpark: boolean;
  createdAt: string;
  roomId?: string | null;
}

function mapApiReaction(r: ApiReaction): Reaction {
  return {
    id: r.id,
    brainholeId: r.brainholeId,
    identityLabel: r.identity,
    content: r.content,
    aiPrompt: '',
    sparkCount: r.isSpark ? 1 : 0,
    createdAt: r.createdAt,
    isSparked: r.isSpark,
  };
}

export function useReaction(brainholeId?: string) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReactions = useCallback(async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams();
      if (brainholeId) params.set('brainholeId', brainholeId);
      const res = await fetch(`/api/reactions?${params.toString()}`, { signal });
      const result = await res.json();
      if (result.success && result.data?.reactions) {
        setReactions(result.data.reactions.map(mapApiReaction));
      } else {
        setError(result.error || '加载反应失败');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('[useReaction] Fetch error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [brainholeId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchReactions(controller.signal);
    return () => controller.abort();
  }, [fetchReactions]);

  const submitReaction = async (
    reaction: Omit<Reaction, 'id' | 'createdAt' | 'sparkCount' | 'isSparked'>
  ) => {
    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: reaction.brainholeId,
          identity: reaction.identityLabel,
          content: reaction.content,
        }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchReactions();
        return mapApiReaction(result.data);
      }
      setError(result.error || '提交失败');
      return null;
    } catch (err: any) {
      console.error('[useReaction] Submit error:', err);
      setError(err.message);
      return null;
    }
  };

  const toggleSpark = (reactionId: string) => {
    // TODO: 接入真实的 spark toggle API
    // 当前仅更新本地状态
    setReactions((prev) =>
      prev.map((r) =>
        r.id === reactionId
          ? {
              ...r,
              isSparked: !r.isSparked,
              sparkCount: r.isSparked ? r.sparkCount - 1 : r.sparkCount + 1,
            }
          : r
      )
    );
  };

  return {
    reactions,
    loading,
    error,
    submitReaction,
    toggleSpark,
    refresh: fetchReactions,
  };
}
