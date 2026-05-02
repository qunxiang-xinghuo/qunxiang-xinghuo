'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Bubble from './Bubble';
import { CloudLayout, BubbleItem } from './types';

// 分类色映射 - 与 bubble-engine.ts 保持一致
const CATEGORY_COLORS: Record<string, string> = {
  medical: 'rgba(231,76,60,0.18)',
  legal: 'rgba(52,152,219,0.18)',
  workplace: 'rgba(243,156,18,0.18)',
  life: 'rgba(46,204,113,0.18)',
  education: 'rgba(155,89,182,0.18)',
  tech: 'rgba(26,188,156,0.18)',
  emergency: 'rgba(230,126,34,0.18)',
  general: 'rgba(149,165,166,0.18)',
  zhihu_hot: 'rgba(0,102,255,0.18)',
  zhihu_search: 'rgba(0,132,255,0.15)',
  deepseek: 'rgba(138,180,248,0.15)',
  fallback: 'rgba(149,165,166,0.15)',
};

const CATEGORY_BORDER: Record<string, string> = {
  medical: 'rgba(231,76,60,0.45)',
  legal: 'rgba(52,152,219,0.45)',
  workplace: 'rgba(243,156,18,0.45)',
  life: 'rgba(46,204,113,0.45)',
  education: 'rgba(155,89,182,0.45)',
  tech: 'rgba(26,188,156,0.45)',
  emergency: 'rgba(230,126,34,0.45)',
  general: 'rgba(149,165,166,0.40)',
  zhihu_hot: 'rgba(0,102,255,0.40)',
  zhihu_search: 'rgba(0,132,255,0.35)',
  deepseek: 'rgba(138,180,248,0.35)',
  fallback: 'rgba(149,165,166,0.30)',
};

const bubbleSizeForCompact = (hotScore: number) => {
  const size = Math.round(38 + hotScore / 8);
  return Math.min(Math.max(size, 36), 60);
};

const bubbleSizeForFull = (hotScore: number) => {
  const size = Math.round(44 + hotScore / 6);
  return Math.min(Math.max(size, 40), 72);
};

interface BubbleCloudProps {
  variant?: 'compact' | 'full' | 'scroll';
  limit?: number;
}

export default function BubbleCloud({ variant = 'full', limit = 30 }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const compact = variant === 'compact';

  const containerHeight = compact ? 300 : variant === 'scroll' ? '100%' : 420;

  useEffect(() => {
    fetchBubbles();
  }, []);

  const fetchBubbles = async () => {
    try {
      const res = await fetch(`/api/brainholes/bubble?limit=${limit}`, {
        cache: 'no-store',
      });
      const result = await res.json();
      if (result.success && result.data?.brainholes) {
        const list: BubbleItem[] = result.data.brainholes.map((b: any) => ({
          id: b.id,
          title: b.title,
          scenario: b.scenario,
          hotScore: b.hotScore || 50,
          category: b.category || 'general',
          difficulty: b.difficulty || 'medium',
          source: b.source || 'fallback',
        }));
        setBubbles(list.slice(0, compact ? 16 : 24));
      } else {
        setBubbles([]);
      }
      setLoaded(true);
    } catch (err) {
      console.error('[BubbleCloud] fetch error:', err);
      setBubbles([]);
      setLoaded(true);
    }
  };

  const layout: CloudLayout = useMemo(() => {
    if (bubbles.length === 0) return { bubbles: [], containerWidth: 0 };

    const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 430) : 430;
    const sizeFn = compact ? bubbleSizeForCompact : bubbleSizeForFull;

    // 力导向布局 - 基于热度驱动
    const positioned: (BubbleItem & { x: number; y: number; size: number })[] = [];
    const cols = compact ? 4 : 5;
    const colWidth = containerWidth / cols;

    bubbles.forEach((b, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const size = sizeFn(b.hotScore);
      // 蜂窝偏移 + 热度驱动的随机偏移
      const rowOffset = (row % 2) * (colWidth / 2);
      const hotOffset = (b.hotScore / 100) * 8;
      const x = col * colWidth + colWidth / 2 + rowOffset + (Math.random() - 0.5) * hotOffset;
      const y = row * (compact ? 62 : 75) + size / 2 + (Math.random() - 0.5) * 10;
      positioned.push({ ...b, x, y, size });
    });

    return { bubbles: positioned, containerWidth };
  }, [bubbles, compact]);

  const handleBubbleClick = useCallback((bubble: BubbleItem) => {
    window.location.href = `/brainhole/${bubble.id}`;
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center" style={{ height: containerHeight }}>
        <div className="w-6 h-6 border-2 border-xh-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (bubbles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2" style={{ height: containerHeight }}>
        <div className="text-2xl opacity-20">🫧</div>
        <p className="text-xs text-slate-500">暂无热门内容</p>
        <p className="text-[10px] text-slate-600">点击刷新试试</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: containerHeight }}>
      {layout.bubbles.map((bubble, index) => (
        <div
          key={bubble.id}
          className="absolute"
          style={{
            left: bubble.x,
            top: bubble.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Bubble
            item={bubble}
            size={bubble.size}
            index={index}
            onClick={() => handleBubbleClick(bubble)}
            bgColor={CATEGORY_COLORS[bubble.category] || CATEGORY_COLORS.general}
            borderColor={CATEGORY_BORDER[bubble.category] || CATEGORY_BORDER.general}
            delay={index * 0.05}
          />
        </div>
      ))}
    </div>
  );
}
