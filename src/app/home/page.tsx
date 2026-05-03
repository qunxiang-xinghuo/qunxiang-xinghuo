'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Theater, BookOpen, ArrowRight, Flame, Zap, MessageSquare, Crown, Vote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanWelcome from '@/components/layout/LiuKanshanWelcome';

const modes = [
  {
    id: 'duo', title: '双人模式', subtitle: '点击泡泡即刻匹配 · 四级智能策略 · 15秒极速',
    icon: Users, available: true, core: true, path: '/duo-match',
  },
  {
    id: 'multi', title: '多人组队', subtitle: '群像共创 · 认领角色书写故事',
    icon: Theater, available: true, path: '/multiplayer',
  },
  {
    id: 'serial', title: '故事大厅', subtitle: '6种剧本模板 · 隐藏秘密 · 沉浸式剧本体验',
    icon: BookOpen, available: true, path: '/story-hall',
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

  return (
    <div className="flex flex-col h-full relative overflow-hidden page-gradient">
      <LiuKanshanWelcome show={showWelcome} onDismiss={dismissWelcome} />

      {/* 顶部标题区 */}
      <div className="shrink-0 pt-5 pb-2 px-5">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center shadow-lg shadow-xh-gold/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">群像·星火</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">每一个认真生活的人，都能成为故事的一部分</p>
          </div>
        </motion.div>
        <div className="h-px bg-gradient-to-r from-transparent via-xh-gold/30 to-transparent mt-2" />
      </div>

      {/* 泡泡墙区域 - 自适应高度 */}
      <div className="shrink-0 relative">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
        <BubbleCloud limit={20} />
      </div>

      {/* 模式入口卡片 */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1 h-4 rounded-full bg-xh-gold" />
          <span className="text-sm font-semibold text-slate-300">选择模式</span>
        </div>
        <div className="flex flex-col gap-3">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileTap={mode.available ? { scale: 0.96 } : {}}
                onClick={() => mode.available && router.push(mode.path)}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl text-left press-feedback overflow-hidden ${
                  mode.available ? 'card-elevated cursor-pointer' : 'bg-slate-800/20 border border-slate-700/10 opacity-50 cursor-not-allowed'
                }`}
              >
                {mode.core && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-xh-gold to-orange-500 rounded-l-2xl" />
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                  mode.core ? 'bg-gradient-to-br from-xh-gold/20 to-orange-500/10 border border-xh-gold/20 shadow-lg shadow-xh-gold/10'
                    : mode.available ? 'bg-slate-700/30 border border-slate-600/20' : 'bg-slate-700/20 border border-slate-600/10'
                }`}>
                  <Icon size={22} className={mode.available ? (mode.core ? 'text-xh-gold' : 'text-slate-400') : 'text-slate-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{mode.title}</span>
                    {mode.core && (
                      <span className="text-[10px] bg-xh-gold/15 text-xh-gold px-2 py-0.5 rounded-full border border-xh-gold/25 font-medium">核心</span>
                    )}
                    {!mode.available && (
                      <span className="text-[10px] bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full">即将开放</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mode.subtitle}</p>
                </div>
                <ArrowRight size={18} className={`shrink-0 transition-all duration-300 ${
                  mode.available ? 'text-slate-600 group-hover:text-xh-gold group-hover:translate-x-1' : 'text-slate-700'
                }`} />
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 mb-2 text-center">
          <p className="text-[10px] text-slate-600">点击泡泡一键匹配 · 四级智能降级 · v6.0</p>
        </div>
      </div>
    </div>
  );
}
