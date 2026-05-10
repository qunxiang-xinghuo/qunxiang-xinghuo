'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { BubbleItem } from './types';

interface BubbleProps {
  item: BubbleItem;
  index: number;
  onClick: () => void;
  bgColor?: string;
  borderColor?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  medical: '医疗', legal: '法律', workplace: '职场', life: '生活',
  education: '教育', tech: '技术', emergency: '紧急', general: '综合',
  zhihu_hot: '知乎热榜', zhihu_search: '知乎搜索', deepseek: 'AI生成', fallback: '精选',
};

const DIFFICULTY_LABELS: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
const DIFFICULTY_COLORS: Record<string, string> = { easy: 'text-emerald-400', medium: 'text-xh-yellow', hard: 'text-red-400' };

export default function Bubble({ item, index, onClick, bgColor, borderColor }: BubbleProps) {
  const [isPopping, setIsPopping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const size = Math.min(Math.max(44 + (item.hotScore || 50) / 6, 40), 68);
  const fontSize = Math.max(size / 5.5, 10);
  const floatDuration = 2.5 + (index % 5) * 0.5;
  const floatDelay = (index % 7) * 0.4;

  const handleClick = useCallback(() => {
    if (isPopping) return;
    setIsPopping(true);
    setTimeout(() => { onClick(); }, 400);
  }, [isPopping, onClick]);

  const displayTitle = item.title.length > 5 ? item.title.slice(0, 4) + '…' : item.title;
  const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
  const difficultyLabel = DIFFICULTY_LABELS[item.difficulty] || '中等';
  const difficultyColor = DIFFICULTY_COLORS[item.difficulty] || 'text-xh-gold';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14, delay: index * 0.04 }}
      className="bubble-float-wrapper cursor-pointer select-none relative inline-block"
      style={{ ['--float-dur' as any]: `${floatDuration}s`, ['--float-del' as any]: `${floatDelay}s` }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* v6.0: 真实泡泡质感——多层效果 */}
        <div
          className={`bubble-glass ${isPopping ? 'bubble-pop' : ''}`}
          style={{ width: size, height: size, backgroundColor: bgColor, borderColor: borderColor }}
        >
          <span className="bubble-text" style={{ fontSize }}>{displayTitle}</span>
        </div>
        
        {/* 泡泡高光层 */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)',
            width: size,
            height: size,
          }}
        />
        
        {/* 泡泡底部折射 */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: size * 0.6,
            height: size * 0.25,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            bottom: size * 0.05,
          }}
        />
      </div>

      {/* Hover 脑洞气泡浮层 — v6.0 精简设计 */}
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
              
              {/* 头部 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 bg-slate-700/30 px-2 py-0.5 rounded-full">{categoryLabel}</span>
                <span className={`text-[10px] ${difficultyColor} font-medium`}>{difficultyLabel}</span>
              </div>

              {/* 标题 */}
              <h4 className="text-sm font-bold text-slate-100 leading-snug mb-1.5">{item.title}</h4>
              
              {/* 场景描述 */}
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2.5">{item.scenario}</p>
              
              {/* 底部：热度 + 匹配按钮 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-xh-yellow" />
                  <span className="text-[11px] text-xh-yellow font-semibold">{item.hotScore}</span>
                </div>
                {/* v6.0: 金色「匹配」按钮 */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleClick(); }}
                  className="flex items-center gap-1 text-[10px] text-white bg-gradient-to-r from-xh-gold to-xh-gold-dark hover:from-xh-gold-light hover:to-xh-gold-dark px-2.5 py-1 rounded-full transition-all shadow-sm shadow-xh-gold/20"
                >
                  <Zap className="w-2.5 h-2.5" />
                  匹配
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
