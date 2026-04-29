'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import ModeDock from '@/components/home/ModeDock';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

const categories = [
  { id: 'all', label: '全部', color: '#95a5a6' },
  { id: 'medical', label: '医疗', color: '#e74c3c' },
  { id: 'legal', label: '法律', color: '#3498db' },
  { id: 'workplace', label: '职场', color: '#f39c12' },
  { id: 'life', label: '生活', color: '#2ecc71' },
  { id: 'education', label: '教育', color: '#9b59b6' },
  { id: 'tech', label: '技术', color: '#1abc9c' },
  { id: 'emergency', label: '紧急', color: '#e67e22' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);

  // 首次进入显示刘看山欢迎
  useEffect(() => {
    const seen = localStorage.getItem('xh_welcome_seen');
    if (seen) {
      setShowWelcome(false);
    }
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem('xh_welcome_seen', '1');
    setShowWelcome(false);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#0f0f23]">
      <TopBar />

      {/* 星空背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 星星 */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* 柔和光晕 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* 刘看山欢迎引导 */}
      <LiuKanshanWelcome show={showWelcome} onDismiss={dismissWelcome} />

      {/* 顶部标题区 */}
      <div className="pt-3 pb-2 px-4 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-1"
        >
          <Sparkles className="w-4 h-4 text-white/60" />
          <h1 className="text-xl font-bold tracking-wider text-white/90">群像·星火</h1>
          <Sparkles className="w-4 h-4 text-white/60" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[11px] text-white/35"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      {/* 分类筛选栏 */}
      <div className="px-3 py-1.5 relative z-10">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeCategory === cat.id
                  ? 'text-white shadow-lg'
                  : 'bg-white/5 text-white/35 border border-white/8 hover:bg-white/10'
              }`}
              style={
                activeCategory === cat.id
                  ? {
                      background: `${cat.color}25`,
                      border: `1px solid ${cat.color}50`,
                      color: cat.color,
                      boxShadow: `0 0 10px ${cat.color}20`,
                    }
                  : {}
              }
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 泡泡云区域 */}
      <div className="flex-1 relative z-10 min-h-0 overflow-hidden">
        <BubbleCloud
          category={activeCategory === 'all' ? undefined : activeCategory}
        />
      </div>

      {/* 模式Dock */}
      <div className="relative z-10 bg-gradient-to-t from-[#0f0f23] via-[#0f0f23]/90 to-transparent pt-2">
        <ModeDock />
      </div>
    </div>
  );
}
