'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { BubbleData } from '@/lib/bubble-engine';

interface BubbleProps {
  data: BubbleData;
  x: number;
  y: number;
  size: number;
  floatDuration: number;
  floatDelay: number;
  swayAmplitude: number;
  onClick: (id: string) => void;
  compact?: boolean;
}

export default function Bubble({
  data,
  x,
  y,
  size,
  floatDuration,
  floatDelay,
  swayAmplitude,
  onClick,
  compact = false,
}: BubbleProps) {
  const [isBouncing, setIsBouncing] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (isBouncing) return;
    setIsBouncing(true);
    setTimeout(() => {
      setIsBouncing(false);
      onClick(data.id);
    }, 350);
  }, [isBouncing, data.id, onClick]);

  // 鼠标移动视差效果 - 泡泡跟随鼠标方向轻微偏移
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.12;
    const offsetY = (e.clientY - centerY) * 0.12;
    setMouseOffset({ x: offsetX, y: offsetY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  const finalX = x + mouseOffset.x;
  const finalY = y + mouseOffset.y;

  return (
    <motion.div
      ref={bubbleRef}
      className="absolute bubble-wrapper"
      style={{
        width: size,
        height: size,
        left: finalX,
        top: finalY,
        zIndex: isBouncing ? 200 : Math.round(data.hotScore / 10),
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.5, delay: floatDelay * 0.12 },
        scale: {
          duration: 0.6,
          delay: floatDelay * 0.12,
          type: 'spring',
          stiffness: 180,
          damping: 14,
        },
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`bubble-float w-full h-full cursor-pointer ${isBouncing ? 'bubble-bouncing' : ''}`}
        onClick={handleClick}
        style={
          {
            '--float-duration': `${floatDuration}s`,
            '--float-delay': `${floatDelay}s`,
            '--sway-px': `${swayAmplitude}px`,
          } as React.CSSProperties
        }
      >
        {/* 泡泡本体：玻璃/水晶质感 */}
        <div className="bubble-body w-full h-full rounded-full relative">
          {/* 五彩虹彩层 */}
          <div className="bubble-iridescence absolute inset-0 rounded-full" />

          {/* 主高光：左上角小而亮 */}
          <div className="bubble-highlight absolute" />

          {/* 次高光 */}
          <div className="bubble-highlight-secondary absolute" />

          {/* 底部折射光 */}
          <div className="bubble-caustic absolute" />

          {/* 标题文字 - 纯白色加粗，清晰可读 */}
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <span
              className="bubble-title text-center select-none"
              style={{
                WebkitLineClamp: compact ? 2 : 3,
              }}
            >
              {data.title}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
