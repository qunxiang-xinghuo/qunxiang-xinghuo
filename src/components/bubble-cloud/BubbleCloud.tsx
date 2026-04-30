'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Bubble from './Bubble';
import BubbleDetailModal from './BubbleDetailModal';
import type { BubbleData } from '@/lib/bubble-engine';

interface BubbleCloudProps {
  category?: string;
  compact?: boolean;
}

export default function BubbleCloud({ category, compact = false }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const fetchBubbles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('mode', 'bubble');
      params.set('limit', compact ? '20' : '50');
      if (category) params.set('category', category);

      const res = await fetch(`/api/brainholes?${params.toString()}`);
      const result = await res.json();

      if (result.success && result.data?.brainholes) {
        const list: BubbleData[] = result.data.brainholes.map((b: any) => ({
          id: String(b.id),
          title: String(b.title),
          scenario: String(b.scenario || ''),
          difficulty: String(b.difficulty || 'medium'),
          hotScore: Number(b.hotScore || 0),
          category: String(b.category || 'general'),
          bubbleColor: b.bubbleColor || getCategoryColor(b.category),
          reactionCount: Number(b.reactionCount || 0),
          sparkCount: Number(b.sparkCount || 0),
          collectionCount: Number(b.collectionCount || 0),
          isNew: b.recencyBoost === true,
          isTrending: b.category === 'zhihu_hot',
          isParticipated: false,
        }));
        setBubbles(list);
      } else {
        setError('加载泡泡失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [category, compact]);

  useEffect(() => {
    fetchBubbles();
  }, [fetchBubbles]);

  const positionedBubbles = useCallback(() => {
    const containerW = typeof window !== 'undefined' ? window.innerWidth - 32 : 375;
    const containerH = compact ? 200 : 400;
    const minSize = compact ? 44 : 56;
    const maxSize = compact ? 64 : 80;

    return bubbles.map((bubble, index) => {
      const seed = index * 137.5;
      const col = index % (compact ? 4 : 4);
      const row = Math.floor(index / 4);
      const jitterX = (Math.sin(seed) * 0.5 + 0.5) * 30;
      const jitterY = (Math.cos(seed) * 0.5 + 0.5) * 20;

      const x = (containerW / 4) * col + (containerW / 8) + jitterX;
      const y = (containerH / 5) * row + (containerH / 10) + jitterY + 10;
      const size = minSize + (bubble.hotScore / 100) * (maxSize - minSize);

      return {
        bubble,
        x: Math.max(0, Math.min(containerW - size, x)),
        y: Math.max(0, Math.min(containerH - size, y)),
        size,
        color: bubble.bubbleColor || '#a0d2eb',
        glowColor: bubble.bubbleColor || '#a0d2eb',
        opacity: 1,
        zIndex: Math.round(bubble.hotScore),
        floatDelay: Math.random() * 3,
        floatAmplitude: 5 + Math.random() * 5,
      };
    });
  }, [bubbles, compact]);

  const positions = positionedBubbles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[150px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-5 h-5 text-white/30" />
        </motion.div>
        <span className="ml-2 text-xs text-white/40">加载脑洞...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[150px] gap-2">
        <p className="text-xs text-white/40">{error}</p>
        <button
          onClick={fetchBubbles}
          className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-xs hover:bg-white/20 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full overflow-hidden">
        {positions.map(({ bubble, x, y, size }) => (
          <Bubble
            key={bubble.id}
            data={bubble}
            position={{ id: bubble.id, x, y, size, color: bubble.bubbleColor || '#a0d2eb', glowColor: bubble.bubbleColor || '#a0d2eb', opacity: 1, zIndex: Math.round(bubble.hotScore), floatDelay: Math.random() * 3, floatAmplitude: 5 + Math.random() * 5 }}
            containerWidth={typeof window !== 'undefined' ? window.innerWidth : 375}
            containerHeight={compact ? 200 : 400}
            onClick={(id) => setSelectedBubbleId(id)}
            compact={compact}
          />
        ))}
      </div>

      {selectedBubbleId && (
        <BubbleDetailModal
          brainholeId={selectedBubbleId}
          onClose={() => setSelectedBubbleId(null)}
        />
      )}
    </>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    medical: '#ff6b6b',
    legal: '#4ecdc4',
    workplace: '#ffe66d',
    life: '#95e1d3',
    education: '#a8e6cf',
    tech: '#74b9ff',
    emergency: '#ff7675',
    general: '#a0d2eb',
  };
  return colors[category] || '#a0d2eb';
}
