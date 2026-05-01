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
  isHovered: boolean;
  isAnyHovered: boolean;
  compact?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  isHovered,
  isAnyHovered,
  compact = false,
  onMouseEnter,
  onMouseLeave,
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
    }, 500);
  }, [isBouncing, data.id, onClick]);

  // 鼠标移动视差效果 - 泡泡跟随鼠标方向轻微偏移
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setMouseOffset({ x: offsetX, y: offsetY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // 计算远离效果：当有其他泡泡被悬停时，当前泡泡轻微远离
  const getRepelOffset = () => {
    if (!isAnyHovered || isHovered || !bubbleRef.current) return { rx: 0, ry: 0 };
    // 简化处理：随机轻微偏移
    const seed = data.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const angle = (seed % 360) * (Math.PI / 180);
    const dist = 3;
    return { rx: Math.cos(angle) * dist, ry: Math.sin(angle) * dist };
  };

  const repel = getRepelOffset();
  const finalX = x + mouseOffset.x + repel.rx;
  const finalY = y + mouseOffset.y + repel.ry;

  // 悬停时的scale
  const scale = isHovered ? 1.3 : isAnyHovered ? 0.92 : 1;

  return (
    <motion.div
      ref={bubbleRef}
      className="absolute"
      style={{
        width: size,
        height: size,
        left: finalX,
        top: finalY,
        zIndex: isBouncing ? 200 : isHovered ? 100 : Math.round(data.hotScore / 10),
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={(e) => {
        handleMouseLeave();
        onMouseLeave?.();
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
          <div
            className="bubble-body w-full h-full rounded-full relative overflow-hidden"
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: isHovered
                ? '0 0 30px rgba(226, 176, 74, 0.35), inset 0 0 14px rgba(255,255,255,0.25)'
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

            {/* 标题文字 - 纯白色加粗，悬停时同步放大 */}
            <div className="absolute inset-0 flex items-center justify-center px-2">
              <span
                className="bubble-title text-center leading-tight select-none break-words"
                style={{
                  fontSize: isHovered ? `${size * 0.28}px` : `${size * 0.22}px`,
                  WebkitLineClamp: compact ? 2 : 3,
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'font-size 0.3s ease, transform 0.3s ease',
                  maxWidth: '90%',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {data.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 悬停信息层 - 在泡泡内部显示，避免溢出容器 */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: isHovered ? 60 : 0,
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
          <p className="text-white font-bold text-center leading-tight break-words" style={{ fontSize: `${size * 0.20}px`, maxWidth: '85%' }}>
            {data.title}
          </p>
          {data.scenario && (
            <p className="text-white/80 text-center leading-tight mt-1 line-clamp-3 break-words" style={{ fontSize: `${size * 0.14}px`, maxWidth: '85%' }}>
              {data.scenario}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
