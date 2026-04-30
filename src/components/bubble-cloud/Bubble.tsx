'use client';

import { useState, useCallback } from 'react';
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

  const handleClick = useCallback(() => {
    if (isBouncing) return;
    setIsBouncing(true);
    // 弹跳动画持续约450ms，完成后触发点击
    setTimeout(() => {
      setIsBouncing(false);
      onClick(data.id);
    }, 450);
  }, [isBouncing, data.id, onClick]);

  return (
    <motion.div
      className="absolute"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        zIndex: isBouncing ? 100 : Math.round(data.hotScore),
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.5, delay: floatDelay * 0.15 },
        scale: {
          duration: 0.6,
          delay: floatDelay * 0.15,
          type: 'spring',
          stiffness: 180,
          damping: 14,
        },
      }}
    >
      <div
        className={`w-full h-full cursor-pointer group ${isBouncing ? 'bubble-bouncing' : ''}`}
        onClick={handleClick}
        style={
          {
            '--float-duration': `${floatDuration}s`,
            '--float-delay': `${floatDelay}s`,
            '--sway-px': `${swayAmplitude}px`,
          } as React.CSSProperties
        }
      >
        {/* 漂浮动画wrapper */}
        <div className="bubble-float w-full h-full">
          {/* 泡泡本体：玻璃/水晶质感 */}
          <div className="bubble-body w-full h-full rounded-full relative overflow-hidden">
            {/* 五彩虹彩层 */}
            <div className="bubble-iridescence absolute inset-0 rounded-full" />

            {/* 主高光：左上角小而亮 */}
            <div className="bubble-highlight absolute" />

            {/* 次高光 */}
            <div className="bubble-highlight-secondary absolute" />

            {/* 底部折射光 */}
            <div className="bubble-caustic absolute" />

            {/* 标题文字 */}
            <div className="absolute inset-0 flex items-center justify-center px-1">
              <span
                className="bubble-title text-[8px] font-medium text-center leading-tight select-none"
                style={{
                  WebkitLineClamp: compact ? 1 : 2,
                }}
              >
                {data.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
        <div className="bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap backdrop-blur-sm border border-white/10">
          {data.title}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900/90" />
        </div>
      </div>
    </motion.div>
  );
}
