'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Theater, BookOpen, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

const modes = [
  {
    id: 'duo',
    title: '双人模式',
    subtitle: '即时对戏碰撞 · 1分钟匹配',
    icon: Users,
    available: true,
    core: true,
  },
  {
    id: 'multi',
    title: '多人组队',
    subtitle: '群像共创 · 认领角色书写故事',
    icon: Theater,
    available: true,
  },
  {
    id: 'serial',
    title: '长期连载',
    subtitle: '故事连载 · 灵感沉淀归档',
    icon: BookOpen,
    available: false,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('xh_welcome_seen');
    if (seen) setShowWelcome(false);
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem('xh_welcome_seen', '1');
    setShowWelcome(false);
  };

  const handleModeClick = (mode: typeof modes[0]) => {
    if (!mode.available) return;
    if (mode.id === 'duo') router.push('/duo-match');
    else if (mode.id === 'multi') router.push('/story-hall');
    else if (mode.id === 'serial') router.push('/story-hall');
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden page-gradient">
      <LiuKanshanWelcome show={showWelcome} onDismiss={dismissWelcome} />

      {/* 顶部标题区 */}
      <div className="pt-4 pb-3 px-4 text-center shrink-0">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2.5 mb-1.5"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center shadow-lg shadow-xh-gold/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100">群像·星火</h1>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center shadow-lg shadow-xh-gold/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs text-slate-500"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      {/* 泡泡墙区域 */}
      <div className="shrink-0 relative overflow-hidden" style={{ height: '300px' }}>
        <BubbleCloud compact />
      </div>

      {/* 模式入口卡片 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3">
        <div className="flex flex-col gap-3">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={mode.available ? { y: -2 } : {}}
                whileTap={mode.available ? { scale: 0.97 } : {}}
                onClick={() => handleModeClick(mode)}
                className={`group flex items-center gap-3.5 p-4 rounded-2xl border text-left press-feedback transition-all duration-300 ${
                  mode.available
                    ? 'bg-slate-800/40 border-slate-700/20 hover:border-xh-gold/30 hover:bg-slate-800/60 cursor-pointer'
                    : 'bg-slate-800/20 border-slate-700/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    mode.core
                      ? 'bg-gradient-to-br from-xh-gold/25 to-orange-500/15 border border-xh-gold/30 shadow-lg shadow-xh-gold/10'
                      : mode.available
                      ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20'
                      : 'bg-slate-700/30 border border-slate-600/20'
                  }`}
                >
                  <Icon
                    size={22}
                    className={mode.available ? (mode.core ? 'text-xh-gold' : 'text-emerald-400') : 'text-slate-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{mode.title}</span>
                    {mode.core && (
                      <span className="text-[10px] bg-xh-gold/20 text-xh-gold px-2 py-0.5 rounded-full border border-xh-gold/30 font-medium">
                        核心
                      </span>
                    )}
                    {!mode.available && (
                      <span className="text-[10px] bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full">
                        即将开放
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{mode.subtitle}</p>
                </div>
                <ArrowRight
                  size={18}
                  className={`shrink-0 transition-all duration-300 ${
                    mode.available
                      ? 'text-slate-600 group-hover:text-xh-gold group-hover:translate-x-0.5'
                      : 'text-slate-700'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
