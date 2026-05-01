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
    }, 400);
  }, [isBouncing, data.id, onClick]);

  // 鼠标移动视差效果
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.1;
    const offsetY = (e.clientY - centerY) * 0.1;
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
      className="absolute"
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
      {/* v4.7-fix2: 分离漂浮层与视觉层，避免transform冲突 */}
      {/* wrapper负责上下漂浮(translateY)，bubble-glass负责scale/hover/pop */}
      <div
        className="bubble-float-wrapper w-full h-full"
        style={
          {
            '--float-dur': `${floatDuration}s`,
            '--float-del': `${floatDelay}s`,
          } as React.CSSProperties
        }
      >
        <div
          className={`bubble-glass w-full h-full cursor-pointer select-none ${isBouncing ? 'bubble-pop' : ''}`}
          onClick={handleClick}
        >
          {/* 标题文字 */}
          <span className="bubble-text" style={{ WebkitLineClamp: compact ? 2 : 3 }}>
            {data.title}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
