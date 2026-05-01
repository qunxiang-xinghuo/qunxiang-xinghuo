'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Bubble from './Bubble';
import BubbleDetailModal from './BubbleDetailModal';
import { fetchBubbles } from '@/lib/bubble-client';
import type { BubbleData } from '@/lib/bubble-engine';

interface BubbleCloudProps {
  category?: string;
  compact?: boolean;
}

// 紧凑模式：24个模板位置（针对首页小区域优化）
const COMPACT_TEMPLATES = [
  { x: 0.07, y: 0.18 }, { x: 0.28, y: 0.10 }, { x: 0.52, y: 0.15 }, { x: 0.75, y: 0.09 }, { x: 0.92, y: 0.22 },
  { x: 0.18, y: 0.42 }, { x: 0.42, y: 0.35 }, { x: 0.65, y: 0.38 }, { x: 0.88, y: 0.45 },
  { x: 0.10, y: 0.60 }, { x: 0.35, y: 0.55 }, { x: 0.58, y: 0.60 }, { x: 0.82, y: 0.58 },
  { x: 0.25, y: 0.78 }, { x: 0.50, y: 0.75 }, { x: 0.72, y: 0.78 }, { x: 0.90, y: 0.72 },
  { x: 0.12, y: 0.90 }, { x: 0.38, y: 0.92 }, { x: 0.62, y: 0.88 }, { x: 0.85, y: 0.90 },
  { x: 0.50, y: 0.25 }, { x: 0.15, y: 0.28 }, { x: 0.80, y: 0.30 },
];

// 完整模式：30个模板位置
const FULL_TEMPLATES = [
  { x: 0.06, y: 0.15 }, { x: 0.22, y: 0.08 }, { x: 0.42, y: 0.12 }, { x: 0.62, y: 0.08 }, { x: 0.82, y: 0.15 }, { x: 0.94, y: 0.28 },
  { x: 0.12, y: 0.32 }, { x: 0.32, y: 0.25 }, { x: 0.52, y: 0.28 }, { x: 0.72, y: 0.25 }, { x: 0.88, y: 0.35 },
  { x: 0.08, y: 0.50 }, { x: 0.28, y: 0.45 }, { x: 0.48, y: 0.48 }, { x: 0.68, y: 0.45 }, { x: 0.92, y: 0.50 },
  { x: 0.15, y: 0.68 }, { x: 0.38, y: 0.62 }, { x: 0.58, y: 0.65 }, { x: 0.78, y: 0.62 }, { x: 0.95, y: 0.70 },
  { x: 0.10, y: 0.85 }, { x: 0.30, y: 0.88 }, { x: 0.50, y: 0.82 }, { x: 0.70, y: 0.88 }, { x: 0.90, y: 0.85 },
  { x: 0.45, y: 0.20 }, { x: 0.18, y: 0.20 }, { x: 0.75, y: 0.18 }, { x: 0.85, y: 0.55 },
];

export default function BubbleCloud({ category, compact = false }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [containerSize, setContainerSize] = useState({ w: 375, h: compact ? 260 : 420 });
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const templates = compact ? COMPACT_TEMPLATES : FULL_TEMPLATES;

  // 监听容器尺寸变化
  useEffect(() => {
    const updateSize = () => {
      const el = document.getElementById('bubble-cloud-container');
      if (el) {
        const rect = el.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [compact]);

  const loadBubbles = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBubbles({ limit: templates.length + 6, category, refresh });
      setBubbles(data);
    } catch {
      setError('加载泡泡失败');
    } finally {
      setLoading(false);
    }
  }, [category, compact, templates.length]);

  useEffect(() => {
    loadBubbles();
  }, [loadBubbles]);

  const containerW = containerSize.w;
  const containerH = containerSize.h;

  // 生成泡泡位置 - 确保不超出容器边界
  const positions = useMemo(() => {
    if (bubbles.length === 0 || containerW === 0) return [];

    const displayBubbles = bubbles.slice(0, templates.length);

    return displayBubbles.map((bubble, index) => {
      const template = templates[index % templates.length];
      const size = Math.min(
        56 + Math.round(bubble.hotScore / 10),
        compact ? 52 : 64
      );

      // 随机偏移 ±15px，但确保不越界
      const jitterX = (Math.random() - 0.5) * 30;
      const jitterY = (Math.random() - 0.5) * 30;

      const x = Math.max(
        8,
        Math.min(containerW - size - 8, template.x * containerW + jitterX - size / 2)
      );
      const y = Math.max(
        8,
        Math.min(containerH - size - 8, template.y * containerH + jitterY - size / 2)
      );

      // 随机漂浮参数
      const floatDuration = 6 + Math.random() * 8; // 6-14秒一个周期
      const floatDelay = Math.random() * 4; // 0-4秒延迟启动
      const swayAmplitude = 4 + Math.random() * 6; // 左右摆动幅度

      return {
        bubble,
        x,
        y,
        size,
        floatDuration,
        floatDelay,
        swayAmplitude,
      };
    });
  }, [bubbles, compact, containerW, containerH, templates]);

  if (loading) {
    return (
      <div className="relative w-full flex items-center justify-center" style={{ height: compact ? 260 : 420 }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center gap-3" style={{ height: compact ? 260 : 420 }}>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={() => loadBubbles(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新试试
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 泡泡容器 - 必须同时设置 position:relative 和 overflow:hidden 才能正确裁剪 */}
      <div
        id="bubble-cloud-container"
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

      {/* 脑洞详情弹窗 */}
      {selectedBubbleId && (
        <BubbleDetailModal
          brainholeId={selectedBubbleId}
          onClose={() => setSelectedBubbleId(null)}
        />
      )}
    </>
  );
}
