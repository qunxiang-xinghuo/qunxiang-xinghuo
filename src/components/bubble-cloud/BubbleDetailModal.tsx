'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Sparkles, Eye, MessageSquare, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BrainholeDetail {
  id: string;
  title: string;
  scenario: string;
  category: string;
  difficulty: string;
  hotScore: number;
  reactionCount: number;
  sparkCount: number;
  collectionCount: number;
  contextTime?: string;
  contextLocation?: string;
  contextCharacters?: string;
}

interface BubbleDetailModalProps {
  brainholeId: string;
  onClose: () => void;
}

export default function BubbleDetailModal({ brainholeId, onClose }: BubbleDetailModalProps) {
  const router = useRouter();
  const [brainhole, setBrainhole] = useState<BrainholeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/brainholes/${brainholeId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setBrainhole(res.data);
        } else {
          setError('脑洞不存在');
        }
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false));
  }, [brainholeId]);

  const handleCollect = () => {
    fetch(`/api/brainholes/${brainholeId}/collect`, { method: 'POST' })
      .then(() => setCollected(true))
      .catch(console.error);
  };

  const handleStart = () => {
    onClose();
    // 从泡泡进入：直接跳转到双人匹配页面，预选中该脑洞
    router.push(`/duo-match?brainholeId=${brainholeId}`);
  };

  const categoryLabels: Record<string, string> = {
    medical: '医疗', legal: '法律', workplace: '职场',
    life: '生活', education: '教育', tech: '技术',
    emergency: '紧急', general: '通用',
  };

  const difficultyColors: Record<string, string> = {
    hard: '#e74c3c', medium: '#a09070', easy: '#2ecc71',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* 弹层内容 */}
        <motion.div
          className="relative w-full max-w-md bg-[#1a1a2e] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {loading && (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              加载中...
            </div>
          )}

          {error && (
            <div className="p-12 text-center text-red-400">{error}</div>
          )}

          {brainhole && (
            <>
              {/* 头部 */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      background: `${difficultyColors[brainhole.difficulty] || '#888'}20`,
                      color: difficultyColors[brainhole.difficulty] || '#888',
                      border: `1px solid ${difficultyColors[brainhole.difficulty] || '#888'}40`,
                    }}
                  >
                    {brainhole.difficulty === 'hard' ? '高难度' : brainhole.difficulty === 'medium' ? '中等' : '简单'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-white/10 text-gray-300 border border-white/10">
                    {categoryLabels[brainhole.category] || brainhole.category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{brainhole.title}</h2>

                {/* 统计 */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {brainhole.hotScore}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {brainhole.reactionCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {brainhole.collectionCount}
                  </span>
                </div>
              </div>

              {/* 场景描述 */}
              <div className="px-6 py-4 bg-white/5 border-y border-white/5">
                <p className="text-sm text-gray-200 leading-relaxed">{brainhole.scenario}</p>

                {(brainhole.contextTime || brainhole.contextLocation || brainhole.contextCharacters) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brainhole.contextTime && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        ⏰ {brainhole.contextTime}
                      </span>
                    )}
                    {brainhole.contextLocation && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        📍 {brainhole.contextLocation}
                      </span>
                    )}
                    {brainhole.contextCharacters && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
                        👥 {brainhole.contextCharacters}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 底部操作 */}
              <div className="p-4 flex gap-3">
                <button
                  onClick={handleCollect}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                    collected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${collected ? 'fill-current' : ''}`} />
                  {collected ? '已收藏' : '收藏脑洞'}
                </button>

                <button
                  onClick={handleStart}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-xh-gold to-xh-gold-dark text-white hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  选择此脑洞
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
