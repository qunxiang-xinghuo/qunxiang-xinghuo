'use client';

import { motion } from 'framer-motion';
import type { BubbleData, BubblePosition } from '@/lib/bubble-engine';

interface BubbleProps {
  data: BubbleData;
  position: BubblePosition;
  containerWidth: number;
  containerHeight: number;
  onClick: (id: string) => void;
}

export default function Bubble({
  data,
  position,
  onClick,
}: BubbleProps) {
  const size = position.size;
  const categoryColor = data.bubbleColor || '#a0d2eb';

  return (
    <motion.div
      className="absolute cursor-pointer group"
      style={{
        width: size,
        height: size,
        left: position.x,
        top: position.y,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -6, 0, 4, 0],
        x: [0, 3, -2, 1, 0],
      }}
      transition={{
        opacity: { duration: 0.6 },
        scale: { duration: 0.6, type: 'spring', stiffness: 200 },
        y: {
          duration: 4 + Math.random() * 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: Math.random() * 2,
        },
        x: {
          duration: 5 + Math.random() * 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: Math.random() * 2,
        },
      }}
      whileHover={{ scale: 1.15, zIndex: 50 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onClick(data.id)}
    >
      {/* 晶莹泡泡本体 */}
      <div
        className="w-full h-full rounded-full relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.1) 40%, transparent 60%),
            radial-gradient(circle at 50% 50%, ${categoryColor}30 0%, ${categoryColor}15 40%, ${categoryColor}05 70%, transparent 100%)
          `,
          border: `1px solid ${categoryColor}50`,
          boxShadow: `
            inset -4px -4px 10px rgba(255,255,255,0.3),
            inset 4px 4px 10px rgba(255,255,255,0.15),
            0 0 15px ${categoryColor}25,
            0 4px 20px rgba(0,0,0,0.15)
          `,
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* 高光反射 - 主高光 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '35%',
            height: '28%',
            top: '12%',
            left: '18%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 60%, transparent 100%)',
            filter: 'blur(1px)',
          }}
        />

        {/* 高光反射 - 次高光 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '15%',
            height: '12%',
            top: '55%',
            right: '22%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 100%)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* 底部折射光 */}
        <div
          className="absolute rounded-full"
          style={{
            width: '40%',
            height: '20%',
            bottom: '8%',
            left: '30%',
            background: `radial-gradient(ellipse at center, ${categoryColor}40 0%, transparent 70%)`,
            filter: 'blur(2px)',
          }}
        />

        {/* 泡泡标题 */}
        <div className="absolute inset-0 flex items-center justify-center px-1">
          <span
            className="text-[9px] font-medium text-center leading-tight select-none"
            style={{
              color: 'rgba(40, 40, 60, 0.85)',
              textShadow: '0 0 4px rgba(255,255,255,0.8), 0 1px 2px rgba(255,255,255,0.6)',
              wordBreak: 'break-all',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.title}
          </span>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-gray-900/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm border border-white/10">
          {data.title}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900/90" />
        </div>
      </div>
    </motion.div>
  );
}
