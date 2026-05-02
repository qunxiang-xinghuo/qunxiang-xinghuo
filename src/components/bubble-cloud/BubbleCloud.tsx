'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Bubble from './Bubble';
import { CloudLayout, BubbleItem } from './types';

const bubbleSizeForCompact = (hotScore: number) => {
  const size = Math.round(36 + hotScore / 12);
  return Math.min(Math.max(size, 32), 52);
};

const bubbleSizeForFull = (hotScore: number) => {
  const size = Math.round(40 + hotScore / 10);
  return Math.min(Math.max(size, 36), 56);
};

const getBubbleColor = (index: number) => {
  const colors = [
    'rgba(255,200,180,0.12)',
    'rgba(180,220,255,0.12)',
    'rgba(200,255,210,0.10)',
    'rgba(230,200,255,0.10)',
    'rgba(255,240,180,0.12)',
    'rgba(180,255,240,0.10)',
    'rgba(255,200,220,0.10)',
    'rgba(220,255,200,0.10)',
  ];
  return colors[index % colors.length];
};

interface BubbleCloudProps {
  variant?: 'compact' | 'full' | 'scroll';
  source?: 'trending' | 'collaborative';
}

export default function BubbleCloud({ variant = 'full', source = 'trending' }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const compact = variant === 'compact';

  const containerHeight = compact ? 280 : variant === 'scroll' ? '100%' : 400;

  useEffect(() => {
    fetchBubbles();
  }, [source]);

  const fetchBubbles = async () => {
    try {
      const res = await fetch(`/api/bubbles?source=${source}`);
      const data = await res.json();
      const list: BubbleItem[] = (data.bubbles || []).slice(0, compact ? 18 : 24);
      setBubbles(list);
      setLoaded(true);
    } catch {
      setBubbles([]);
      setLoaded(true);
    }
  };

  const layout: CloudLayout = useMemo(() => {
    if (bubbles.length === 0) return { bubbles: [], containerWidth: 0 };

    const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth, 430) : 430;
    const sizeFn = compact ? bubbleSizeForCompact : bubbleSizeForFull;

    // 蜂窝式布局
    const positioned: (BubbleItem & { x: number; y: number; size: number })[] = [];
    const cols = compact ? 5 : 6;
    const colWidth = containerWidth / cols;

    bubbles.forEach((b, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const size = sizeFn(b.hotScore || 0);
      const rowOffset = (row % 2) * (colWidth / 2); // 蜂窝偏移
      const x = col * colWidth + colWidth / 2 + rowOffset + (Math.random() - 0.5) * 10;
      const y = row * (compact ? 55 : 65) + size / 2 + (Math.random() - 0.5) * 12;
      positioned.push({ ...b, x, y, size });
    });

    return { bubbles: positioned, containerWidth };
  }, [bubbles, compact]);

  const handleBubbleClick = useCallback((bubble: BubbleItem) => {
    if (bubble.type === 'story') {
      window.location.href = `/story-hall/${bubble.id}`;
    } else if (bubble.type === 'duo-match') {
      window.location.href = `/duo-match/${bubble.id}`;
    } else {
      window.location.href = `/library/${bubble.id}`;
    }
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
            bgColor={getBubbleColor(index)}
            delay={index * 0.06}
          />
        </div>
      ))}
    </div>
  );
}
