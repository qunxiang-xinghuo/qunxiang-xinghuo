'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import Bubble from './Bubble';
import BubblePreview from './BubblePreview';
import type { BubbleData, BubblePosition } from '@/lib/bubble-engine';
import { calculateBubblePositions } from '@/lib/bubble-engine';

interface BubbleCloudProps {
  initialBubbles?: BubbleData[];
  category?: string;
}

export default function BubbleCloud({ initialBubbles, category }: BubbleCloudProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleData[]>(initialBubbles || []);
  const [positions, setPositions] = useState<BubblePosition[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 375, height: 500 });
  const [previewBubble, setPreviewBubble] = useState<BubbleData | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(!initialBubbles);
  const [error, setError] = useState<string | null>(null);

  // 获取泡泡数据
  const fetchBubbles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('mode', 'bubble');
      params.set('limit', '50');
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
          bubbleColor: b.bubbleColor || null,
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
    } catch (err) {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // 初始加载
  useEffect(() => {
    if (!initialBubbles) {
      fetchBubbles();
    }
  }, [initialBubbles, fetchBubbles]);

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 计算泡泡位置
  useEffect(() => {
    if (bubbles.length > 0 && containerSize.width > 0) {
      const newPositions = calculateBubblePositions(
        bubbles,
        containerSize.width,
        containerSize.height
      );
      setPositions(newPositions);
    }
  }, [bubbles, containerSize]);

  // 泡泡数据映射
  const bubbleMap = useMemo(() => {
    const map = new Map<string, BubbleData>();
    bubbles.forEach((b) => map.set(b.id, b));
    return map;
  }, [bubbles]);

  const positionMap = useMemo(() => {
    const map = new Map<string, BubblePosition>();
    positions.forEach((p) => map.set(p.id, p));
    return map;
  }, [positions]);

  // 点击泡泡
  const handleBubbleClick = useCallback(
    (id: string) => {
      router.push(`/brainhole/${id}`);
    },
    [router]
  );

  // 双击收藏
  const handleBubbleDoubleClick = useCallback((id: string) => {
    // 触发收藏API
    fetch(`/api/brainholes/${id}/collect`, { method: 'POST' })
      .then(() => {
        setBubbles((prev) =>
          prev.map((b) => (b.id === id ? { ...b, isParticipated: true } : b))
        );
      })
      .catch(console.error);
  }, []);

  // 长按预览
  const handleLongPress = useCallback(
    (id: string, x: number, y: number) => {
      const bubble = bubbleMap.get(id);
      if (bubble) {
        setPreviewBubble(bubble);
        setPreviewPosition({ x, y });
      }
    },
    [bubbleMap]
  );

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setPreviewBubble(null);
  }, []);

  // 收藏
  const handleCollect = useCallback((id: string) => {
    fetch(`/api/brainholes/${id}/collect`, { method: 'POST' }).catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-orange-400" />
        </motion.div>
        <span className="ml-3 text-gray-400">加载泡泡中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3">
        <Sparkles className="w-8 h-8 text-gray-500" />
        <p className="text-gray-400">{error}</p>
        <button
          onClick={fetchBubbles}
          className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: containerSize.height || 500 }}
      >
        {bubbles.map((bubble) => {
          const position = positionMap.get(bubble.id);
          if (!position) return null;

          return (
            <Bubble
              key={bubble.id}
              data={bubble}
              position={position}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              onClick={handleBubbleClick}
              onDoubleClick={handleBubbleDoubleClick}
              onLongPress={handleLongPress}
            />
          );
        })}
      </div>

      {/* 长按预览浮层 */}
      {previewBubble && (
        <BubblePreview
          bubble={previewBubble}
          position={previewPosition}
          onClose={handleClosePreview}
          onCollect={handleCollect}
        />
      )}
    </>
  );
}
