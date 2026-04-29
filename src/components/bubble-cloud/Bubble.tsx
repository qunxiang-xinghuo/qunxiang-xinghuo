'use client';

import { motion } from 'framer-motion';
import { Flame, MessageCircle, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { BubbleData, BubblePosition } from '@/lib/bubble-engine';
import { getDifficultyLabel, getDifficultyColor } from '@/lib/bubble-engine';

interface BubbleProps {
  data: BubbleData;
  position: BubblePosition;
  containerWidth: number;
  containerHeight: number;
  onClick: (id: string) => void;
  onDoubleClick?: (id: string) => void;
  onLongPress?: (id: string, x: number, y: number) => void;
}

export default function Bubble({
  data,
  position,
  containerWidth,
  containerHeight,
  onClick,
  onDoubleClick,
  onLongPress,
}: BubbleProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const left = position.x * containerWidth - position.size / 2;
  const top = position.y * containerHeight - position.size / 2;

  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
    const timer = setTimeout(() => {
      if (onLongPress) {
        onLongPress(data.id, left + position.size / 2, top);
      }
    }, 500);
    setPressTimer(timer);
  }, [data.id, left, top, position.size, onLongPress]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }, [pressTimer]);

  const isHot = data.hotScore >= 80;
  const isNew = data.isNew;
  const isTrending = data.isTrending;

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        left,
        top,
        width: position.size,
        height: position.size,
        zIndex: position.zIndex + (isPressed ? 100 : 0),
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isPressed ? 0.95 : 1,
        opacity: position.opacity,
        y: [0, -position.floatAmplitude, 0],
      }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 25 },
        opacity: { duration: 0.5 },
        y: {
          duration: 3 + position.floatDelay * 0.2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: position.floatDelay,
        },
      }}
      onClick={() => onClick(data.id)}
      onDoubleClick={() => onDoubleClick?.(data.id)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      whileHover={{ scale: 1.08, zIndex: 1000 }}
    >
      {/* 发光背景 */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: position.glowColor,
          transform: 'scale(1.3)',
        }}
      />

      {/* 热榜脉冲效果 */}
      {isTrending && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${position.color}`,
            boxShadow: `0 0 20px ${position.color}`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* 泡泡主体 */}
      <div
        className="relative w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${position.color}40, ${position.color}20)`,
          border: `${data.isParticipated ? '3px' : '2px'} solid ${data.isParticipated ? '#e2b04a' : position.color}80`,
          boxShadow: `inset -3px -3px 8px rgba(0,0,0,0.2), inset 3px 3px 8px rgba(255,255,255,0.1), 0 4px 12px ${position.glowColor}`,
        }}
      >
        {/* NEW 角标 */}
        {isNew && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
            NEW
          </div>
        )}

        {/* 热榜标记 */}
        {isTrending && (
          <div className="absolute top-1 left-1 flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-red-400" />
          </div>
        )}

        {/* 泡泡标题 */}
        <span
          className="text-white font-medium text-center px-2 leading-tight"
          style={{
            fontSize: Math.max(10, position.size / 8),
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {data.title}
        </span>

        {/* 难度标记 */}
        <div
          className="absolute bottom-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
          style={{
            background: `${getDifficultyColor(data.difficulty)}30`,
            border: `1px solid ${getDifficultyColor(data.difficulty)}60`,
          }}
        >
          <span
            className="text-white/90 font-medium"
            style={{ fontSize: Math.max(7, position.size / 14) }}
          >
            {getDifficultyLabel(data.difficulty)}
          </span>
        </div>

        {/* 热度高时显示火花图标 */}
        {isHot && (
          <motion.div
            className="absolute top-1/2 right-1 -translate-y-1/2"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="text-yellow-400" style={{ width: position.size / 6, height: position.size / 6 }} />
          </motion.div>
        )}
      </div>

      {/* 反应数气泡 */}
      {data.reactionCount > 0 && (
        <div className="absolute -bottom-1 -right-1 bg-gray-800/80 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white/10">
          <MessageCircle className="w-2.5 h-2.5" />
          {data.reactionCount}
        </div>
      )}
    </motion.div>
  );
}
