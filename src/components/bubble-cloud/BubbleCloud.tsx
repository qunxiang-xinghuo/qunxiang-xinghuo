'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Bubble from './Bubble';
import BubbleDetailModal from './BubbleDetailModal';
import type { BubbleData } from '@/lib/bubble-engine';

interface BubbleCloudProps {
  category?: string;
  compact?: boolean;
}

// 紧凑位置模板（12个）— 覆盖更大区域，确保不重叠
const COMPACT_TEMPLATES = [
  { x: 0.10, y: 0.15 }, { x: 0.38, y: 0.08 }, { x: 0.65, y: 0.18 },
  { x: 0.85, y: 0.10 }, { x: 0.18, y: 0.45 }, { x: 0.50, y: 0.38 },
  { x: 0.78, y: 0.48 }, { x: 0.08, y: 0.72 }, { x: 0.35, y: 0.68 },
  { x: 0.62, y: 0.75 }, { x: 0.88, y: 0.65 }, { x: 0.48, y: 0.55 },
];

// 完整位置模板（20个）— 更大容器，更多泡泡
const FULL_TEMPLATES = [
  { x: 0.08, y: 0.10 }, { x: 0.28, y: 0.06 }, { x: 0.52, y: 0.12 }, { x: 0.75, y: 0.08 }, { x: 0.92, y: 0.18 },
  { x: 0.15, y: 0.30 }, { x: 0.42, y: 0.26 }, { x: 0.65, y: 0.32 }, { x: 0.88, y: 0.28 }, { x: 0.08, y: 0.50 },
  { x: 0.32, y: 0.46 }, { x: 0.55, y: 0.42 }, { x: 0.78, y: 0.48 }, { x: 0.95, y: 0.44 }, { x: 0.20, y: 0.68 },
  { x: 0.48, y: 0.64 }, { x: 0.72, y: 0.70 }, { x: 0.90, y: 0.62 }, { x: 0.38, y: 0.85 }, { x: 0.62, y: 0.88 },
];

export default function BubbleCloud({ category, compact = false }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 375, h: compact ? 260 : 420 });

  // 监听窗口大小变化
  useEffect(() => {
    const update = () => {
      setContainerSize({
        w: window.innerWidth - 32,
        h: compact ? 260 : 420,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [compact]);

  const fetchBubbles = useCallback(async () => {
    console.log('[BubbleCloud] Starting fetch...');
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('mode', 'bubble');
      // 获取更多泡泡：compact 15个，正常 25个
      params.set('limit', compact ? '15' : '25');
      if (category) params.set('category', category);

      const url = `/api/brainholes?${params.toString()}`;
      console.log('[BubbleCloud] Fetching:', url);

      const res = await fetch(url);
      console.log('[BubbleCloud] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[BubbleCloud] HTTP error:', res.status, errorText);
        setError(`服务器错误 (${res.status})`);
        return;
      }

      const result = await res.json();
      console.log('[BubbleCloud] Response data:', result);

      if (result.success && result.data?.brainholes) {
        const list: BubbleData[] = result.data.brainholes.map((b: any) => ({
          id: String(b.id),
          title: String(b.title),
          scenario: String(b.scenario || ''),
          difficulty: String(b.difficulty || 'medium'),
          hotScore: Number(b.hotScore || 0),
          category: String(b.category || 'general'),
          bubbleColor: b.bubbleColor || null,
          reactionCount: Number(b.reactionCount || 0),
          sparkCount: Number(b.sparkCount || 0),
          collectionCount: Number(b.collectionCount || 0),
          isNew: b.recencyBoost === true,
          isTrending: b.category === 'zhihu_hot',
          isParticipated: false,
        }));
        console.log('[BubbleCloud] Parsed bubbles:', list.length);
        setBubbles(list);
      } else {
        console.error('[BubbleCloud] Invalid response format:', result);
        setError('加载泡泡失败: 数据格式错误');
      }
    } catch (err: any) {
      console.error('[BubbleCloud] Fetch error:', err);
      setError(`网络错误: ${err.message || '请检查网络连接'}`);
    } finally {
      setIsLoading(false);
      console.log('[BubbleCloud] Fetch complete');
    }
  }, [category, compact]);

  useEffect(() => {
    fetchBubbles();
  }, [fetchBubbles]);

  // 计算泡泡位置：稀疏分布 + 稳定随机参数
  const positions = useMemo(() => {
    if (bubbles.length === 0) return [];

    const MAX_BUBBLES = compact ? 12 : 20;
    const displayBubbles = bubbles.slice(0, MAX_BUBBLES);
    const templates = compact ? COMPACT_TEMPLATES : FULL_TEMPLATES;
    const { w: containerW, h: containerH } = containerSize;

    return displayBubbles.map((bubble, index) => {
      // 用 bubble.id 做种子，保证同一次加载中参数稳定
      const seed = bubble.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      // 大小：compact 28-42px，正常 32-48px，由热度微调
      const baseSize = compact ? 28 : 32;
      const sizeRange = compact ? 14 : 16;
      const size = baseSize + ((bubble.hotScore || 50) / 100) * sizeRange;

      // 位置：基于模板 + 稳定随机偏移
      const template = templates[index % templates.length];
      const jitterX = Math.sin(seed * 1.37) * 20;
      const jitterY = Math.cos(seed * 2.71) * 14;

      const x = template.x * containerW + jitterX - size / 2;
      const y = template.y * containerH + jitterY - size / 2;

      // 漂浮参数：8-15秒，稳定随机
      const floatDuration = 8 + ((Math.sin(seed * 3.13) * 0.5 + 0.5) * 7);
      const floatDelay = (Math.cos(seed * 1.97) * 0.5 + 0.5) * 4;
      const swayAmplitude = 3 + ((Math.sin(seed * 5.23) * 0.5 + 0.5) * 10);

      return {
        bubble,
        x: Math.max(4, Math.min(containerW - size - 4, x)),
        y: Math.max(4, Math.min(containerH - size - 4, y)),
        size,
        floatDuration,
        floatDelay,
        swayAmplitude,
      };
    });
  }, [bubbles, compact, containerSize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[140px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-5 h-5 text-white/30" />
        </motion.div>
        <span className="ml-2 text-xs text-white/40">正在加载脑洞泡泡...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-3">
        <p className="text-xs text-white/40">{error}</p>
        <p className="text-[10px] text-white/20">详细错误已输出到浏览器控制台</p>
        <button
          onClick={fetchBubbles}
          className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-xs hover:bg-white/20 transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (bubbles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[140px] gap-2">
        <p className="text-xs text-white/40">暂无脑洞数据</p>
        <button
          onClick={fetchBubbles}
          className="px-3 py-1.5 bg-white/10 text-white/60 rounded-lg text-xs hover:bg-white/20 transition-colors"
        >
          刷新试试
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative w-full overflow-hidden"
        style={{ height: containerSize.h }}
      >
        {positions.map(({
          bubble, x, y, size, floatDuration, floatDelay, swayAmplitude,
        }) => (
          <Bubble
            key={bubble.id}
            data={bubble}
            x={x}
            y={y}
            size={size}
            floatDuration={floatDuration}
            floatDelay={floatDelay}
            swayAmplitude={swayAmplitude}
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
