'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
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

const CATEGORY_LABELS: Record<string, string> = {
  medical: '医疗', legal: '法律', workplace: '职场', life: '生活',
  education: '教育', tech: '技术', emergency: '紧急', general: '综合',
  zhihu_hot: '知乎热榜', zhihu_search: '知乎搜索', deepseek: 'AI生成', fallback: '精选',
};

const DIFFICULTY_LABELS: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
const DIFFICULTY_COLORS: Record<string, string> = { easy: 'text-emerald-400', medium: 'text-xh-gold', hard: 'text-red-400' };

export default function Bubble({ item, size, index, onClick, bgColor, borderColor, delay = 0 }: BubbleProps) {
  const [isPopping, setIsPopping] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const displayTitle = item.title.length > 5 ? item.title.slice(0, 4) + '…' : item.title;
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const difficultyLabel = DIFFICULTY_LABELS[item.difficulty] || '中等';
  const difficultyColor = DIFFICULTY_COLORS[item.difficulty] || 'text-xh-gold';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14, delay }}
      className="bubble-float-wrapper cursor-pointer select-none relative"
      style={{ ['--float-dur' as any]: `${floatDuration}s`, ['--float-del' as any]: `${floatDelay}s` }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {showGlow && <div className="bubble-selected-glow" />}
        {showRipple && <div className="bubble-ripple" />}
        <div
          className={`bubble-glass ${isPopping ? 'bubble-pop' : ''} ${isPressed ? 'bubble-pressed' : ''}`}
          style={{ width: size, height: size, backgroundColor: bgColor, borderColor: borderColor }}
        >
          <span className="bubble-text" style={{ fontSize }}>{displayTitle}</span>
        </div>
      </div>

      {/* Hover 脑洞气泡浮层 - TDD v5.0 核心设计 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
            style={{ width: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-elevated p-3.5 relative">
              {/* 小三角 */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[rgba(30,42,75,0.55)] rotate-45 border-r border-b border-rgba(148,163,184,0.06)" />

              {/* 分类+难度 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded-full">
                  {categoryLabel}
                </span>
                <span className={`text-[10px] ${difficultyColor} font-medium`}>
                  {difficultyLabel}
                </span>
              </div>

              {/* 标题 */}
              <h4 className="text-sm font-bold text-slate-100 leading-snug mb-1.5">
                {item.title}
              </h4>

              {/* Scenario 摘要 */}
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5">
                {item.scenario}
              </p>

              {/* 热度 + 进入按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-xh-gold" />
                  <span className="text-[11px] text-xh-gold font-semibold">{item.hotScore}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-700/40 hover:bg-xh-gold/20 hover:text-xh-gold px-2.5 py-1 rounded-full transition-colors border border-slate-600/20"
                >
                  进入
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
