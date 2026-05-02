'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BubbleItem } from './types';

interface BubbleProps {
  item: BubbleItem;
  size: number;
  index: number;
  onClick: () => void;
  bgColor?: string;
  borderColor?: string;
  delay?: number;
}

export default function Bubble({ item, size, index, onClick, bgColor, borderColor, delay = 0 }: BubbleProps) {
  const [isPopping, setIsPopping] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  // 根据泡泡大小计算字体大小
  const fontSize = Math.max(size / 5.5, 10);
  const floatDuration = 2.5 + Math.random() * 2.5;
  const floatDelay = Math.random() * 3;

  const handleClick = useCallback(() => {
    if (isPopping) return;
    setIsPopping(true);
    setIsPressed(true);
    setShowGlow(true);
    setShowRipple(true);

    setTimeout(() => {
      setShowRipple(false);
      onClick();
    }, 400);
  }, [isPopping, onClick]);

  // 截断标题以适应泡泡大小
  const displayTitle = item.title.length > 6 ? item.title.slice(0, 5) + '…' : item.title;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 14,
        delay,
      }}
      className="bubble-float-wrapper cursor-pointer select-none"
      style={{
        ['--float-dur' as any]: `${floatDuration}s`,
        ['--float-del' as any]: `${floatDelay}s`,
      }}
      onClick={handleClick}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {showGlow && <div className="bubble-selected-glow" />}
        {showRipple && <div className="bubble-ripple" />}
        <div
          className={`bubble-glass ${isPopping ? 'bubble-pop' : ''} ${isPressed ? 'bubble-pressed' : ''}`}
          style={{
            width: size,
            height: size,
            backgroundColor: bgColor,
            borderColor: borderColor,
          }}
        >
          <span
            className="bubble-text"
            style={{ fontSize }}
          >
            {displayTitle}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
