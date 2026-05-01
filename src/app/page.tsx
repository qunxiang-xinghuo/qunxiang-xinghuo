'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

export default function Home() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);

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

  const handleDuoMode = () => {
    router.push('/duo-match');
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#1a1a2e]">
      {/* 刘看山欢迎引导 */}
      <LiuKanshanWelcome show={showWelcome} onDismiss={dismissWelcome} />

      {/* 顶部标题区 */}
      <div className="pt-3 pb-2 px-4 text-center shrink-0">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-1"
        >
          <Sparkles className="w-4 h-4 text-xh-gold/60" />
          <h1 className="text-xl font-bold tracking-wider text-white/90">群像·星火</h1>
          <Sparkles className="w-4 h-4 text-xh-gold/60" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[11px] text-white/30"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      {/* 泡泡墙区域 - 核心交互区 */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <BubbleCloud compact />
      </div>

      {/* 双人模式入口 - 底部悬浮按钮 */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDuoMode}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#e2b04a]/20 to-[#e2b04a]/10 border border-[#e2b04a]/40 text-[#e2b04a] flex items-center justify-center gap-3 hover:shadow-lg transition-all"
          style={{ boxShadow: '0 0 24px #e2b04a15' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #e2b04a30, #e2b04a10)',
              border: '1px solid #e2b04a30',
            }}
          >
            <Users className="w-5 h-5" style={{ color: '#e2b04a' }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">双人模式</div>
            <div className="text-[11px] text-[#e2b04a]/60">即时对戏碰撞 · 1分钟匹配</div>
          </div>
          <svg
            className="w-5 h-5 ml-auto"
            style={{ color: '#e2b04a' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
