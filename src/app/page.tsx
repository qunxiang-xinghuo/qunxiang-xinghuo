'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Theater, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

const modes = [
  {
    id: 'duo',
    title: '双人模式',
    subtitle: '即时对戏碰撞 · 1分钟匹配',
    icon: Users,
    color: '#e2b04a',
    bg: 'bg-[#e2b04a]/15',
    border: 'border-[#e2b04a]/40',
    available: true,
    core: true,
  },
  {
    id: 'multi',
    title: '多人组队',
    subtitle: '群像共创（即将开放）',
    icon: Theater,
    color: '#4ade80',
    bg: 'bg-[#4ade80]/10',
    border: 'border-[#4ade80]/20',
    available: false,
  },
  {
    id: 'serial',
    title: '长期连载',
    subtitle: '故事连载（即将开放）',
    icon: BookOpen,
    color: '#60a5fa',
    bg: 'bg-[#60a5fa]/10',
    border: 'border-[#60a5fa]/20',
    available: false,
  },
];

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

  const handleModeClick = (mode: typeof modes[0]) => {
    if (!mode.available) {
      alert('该功能即将开放，敬请期待');
      return;
    }
    if (mode.id === 'duo') {
      router.push('/duo-match');
    } else if (mode.id === 'multi') {
      router.push('/multiplayer');
    } else if (mode.id === 'serial') {
      router.push('/story');
    }
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
      <div className="shrink-0 relative overflow-hidden" style={{ height: '240px' }}>
        <BubbleCloud compact />
      </div>

      {/* 模式入口卡片 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4">
        <div className="flex flex-col gap-3">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={mode.available ? { scale: 1.02 } : {}}
                whileTap={mode.available ? { scale: 0.98 } : {}}
                onClick={() => handleModeClick(mode)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  mode.core
                    ? `${mode.bg} ${mode.border} cursor-pointer hover:shadow-lg`
                    : mode.available
                    ? `${mode.bg} ${mode.border} cursor-pointer hover:shadow-lg`
                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: mode.core ? `0 0 24px ${mode.color}15` : mode.available ? `0 0 16px ${mode.color}10` : 'none',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${mode.color}30, ${mode.color}10)`,
                    border: `1px solid ${mode.color}30`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: mode.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90">{mode.title}</span>
                    {mode.core && (
                      <span className="text-[10px] bg-xh-gold/20 text-xh-gold px-2 py-0.5 rounded-full border border-xh-gold/30">
                        核心
                      </span>
                    )}
                    {!mode.available && (
                      <span className="text-[10px] bg-white/10 text-white/30 px-2 py-0.5 rounded-full">
                        即将开放
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">{mode.subtitle}</p>
                </div>
                <svg
                  className="w-5 h-5 shrink-0"
                  style={{ color: mode.available ? mode.color : 'rgba(255,255,255,0.1)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
