'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, Users, Theater, Heart, Lock, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

const modes = [
  {
    id: 'solo',
    title: '单人模式',
    icon: User,
    color: '#e2b04a',
    bg: 'bg-[#e2b04a]/15',
    border: 'border-[#e2b04a]/30',
    available: true,
  },
  {
    id: 'duo',
    title: '双人模式',
    icon: Users,
    color: '#c084fc',
    bg: 'bg-[#c084fc]/15',
    border: 'border-[#c084fc]/30',
    available: true,
  },
  {
    id: 'multi',
    title: '多人组队',
    icon: Theater,
    color: '#4ade80',
    bg: 'bg-[#4ade80]/15',
    border: 'border-[#4ade80]/30',
    available: false,
  },
  {
    id: 'healing',
    title: '疗愈空间',
    icon: Heart,
    color: '#60a5fa',
    bg: 'bg-[#60a5fa]/15',
    border: 'border-[#60a5fa]/30',
    available: false,
  },
  {
    id: 'couple',
    title: '密友空间',
    icon: Lock,
    color: '#f472b6',
    bg: 'bg-[#f472b6]/15',
    border: 'border-[#f472b6]/30',
    available: false,
  },
  {
    id: 'story',
    title: '故事大厅',
    icon: BookOpen,
    color: '#fb923c',
    bg: 'bg-[#fb923c]/15',
    border: 'border-[#fb923c]/30',
    available: true,
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
    if (mode.id === 'solo') {
      router.push('/identity?mode=solo');
    } else if (mode.id === 'duo') {
      router.push('/duo-match');
    } else if (mode.id === 'multi') {
      router.push('/multiplayer');
    } else if (mode.id === 'healing') {
      router.push('/healing');
    } else if (mode.id === 'couple') {
      router.push('/couple');
    } else if (mode.id === 'story') {
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

      {/* 泡泡墙区域 */}
      <div className="shrink-0 relative overflow-hidden" style={{ height: '220px' }}>
        <BubbleCloud compact />
      </div>

      {/* 六宫格模式入口 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3">
        <div className="grid grid-cols-3 gap-3">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={mode.available ? { scale: 1.03 } : {}}
                whileTap={mode.available ? { scale: 0.97 } : {}}
                onClick={() => handleModeClick(mode)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  mode.available
                    ? `${mode.bg} ${mode.border} cursor-pointer hover:shadow-lg`
                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                }`}
                style={{
                  boxShadow: mode.available ? `0 0 20px ${mode.color}10` : 'none',
                  minHeight: '100px',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${mode.color}30, ${mode.color}10)`,
                    border: `1px solid ${mode.color}25`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: mode.color }} />
                </div>
                <span className="text-xs font-medium text-white/80">{mode.title}</span>
                {!mode.available && (
                  <span className="text-[9px] text-white/30">即将开放</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 故事大厅横幅 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 rounded-2xl border border-xh-gold/20 bg-gradient-to-r from-xh-gold/10 to-transparent cursor-pointer hover:border-xh-gold/40 transition-colors"
          onClick={() => router.push('/story')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-xh-gold/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-xh-gold" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">故事大厅</h3>
              <p className="text-[11px] text-white/40">认领角色，共创群像故事</p>
            </div>
            <svg className="w-5 h-5 text-xh-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
