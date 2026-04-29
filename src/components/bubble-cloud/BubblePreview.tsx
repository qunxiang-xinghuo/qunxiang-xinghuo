'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, MessageCircle, Bookmark, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BubbleData } from '@/lib/bubble-engine';
import { getDifficultyLabel, getDifficultyColor, getCategoryLabel } from '@/lib/bubble-engine';

interface BubblePreviewProps {
  bubble: BubbleData | null;
  position: { x: number; y: number };
  onClose: () => void;
  onCollect?: (id: string) => void;
}

export default function BubblePreview({ bubble, position, onClose, onCollect }: BubblePreviewProps) {
  const router = useRouter();

  if (!bubble) return null;

  const handleEnter = () => {
    onClose();
    router.push(`/brainhole/${bubble.id}`);
  };

  const handleCollect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCollect?.(bubble.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* 预览卡片 */}
        <motion.div
          className="relative bg-gray-900/95 border border-white/10 rounded-2xl p-5 max-w-sm w-[90%] mx-4 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: `0 20px 60px ${bubble.bubbleColor || '#000'}40`,
          }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 分类标签 */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${bubble.bubbleColor || '#666'}30`,
                color: bubble.bubbleColor || '#ccc',
                border: `1px solid ${bubble.bubbleColor || '#666'}50`,
              }}
            >
              {getCategoryLabel(bubble.category)}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${getDifficultyColor(bubble.difficulty)}30`,
                color: getDifficultyColor(bubble.difficulty),
                border: `1px solid ${getDifficultyColor(bubble.difficulty)}50`,
              }}
            >
              {getDifficultyLabel(bubble.difficulty)}
            </span>
            {bubble.isTrending && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                热榜
              </span>
            )}
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-bold text-white mb-2 pr-6">{bubble.title}</h3>

          {/* 情境摘要 */}
          <p className="text-sm text-gray-300 leading-relaxed mb-4 line-clamp-4">
            {bubble.scenario}
          </p>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{bubble.reactionCount} 条反应</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>热度 {Math.round(bubble.hotScore)}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnter}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              立即进入
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCollect}
              className="px-3 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
