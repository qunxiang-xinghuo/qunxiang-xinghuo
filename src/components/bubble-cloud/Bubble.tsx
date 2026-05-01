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
  const [isHovered, setIsHovered] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (isBouncing) return;
    setIsBouncing(true);
    setTimeout(() => {
      setIsBouncing(false);
      onClick(data.id);
    }, 450);
  }, [isBouncing, data.id, onClick]);

  // v4.1-fix: 鼠标移动视差效果 - 泡泡跟随鼠标方向轻微偏移
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // 计算鼠标相对于泡泡中心的偏移，缩放为微小移动
    const offsetX = (e.clientX - centerX) * 0.12;
    const offsetY = (e.clientY - centerY) * 0.12;
    setMouseOffset({ x: offsetX, y: offsetY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={bubbleRef}
      className="absolute"
      style={{
        width: size,
        height: size,
        left: x + mouseOffset.x,
        top: y + mouseOffset.y,
        zIndex: isBouncing ? 100 : isHovered ? 50 : Math.round(data.hotScore / 10),
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
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
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
          <div 
            className="bubble-body w-full h-full rounded-full relative overflow-hidden"
            style={{
              transform: isHovered ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.3s ease-out',
              boxShadow: isHovered 
                ? '0 0 20px rgba(226, 176, 74, 0.4), inset 0 0 10px rgba(255,255,255,0.2)' 
                : 'none',
            }}
          >
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
