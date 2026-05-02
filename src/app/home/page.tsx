'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Theater, BookOpen, ArrowRight, Flame } from 'lucide-react';
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

      {/* 顶部标题区 - v5.6: 更大气 */}
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
        {/* 金色装饰线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-xh-gold/30 to-transparent mt-2" />
      </div>

      {/* 泡泡墙区域 - v5.6: 更大更沉浸 */}
      <div className="shrink-0 relative overflow-hidden" style={{ height: '320px' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0e1a] z-10 pointer-events-none" />
        <BubbleCloud variant="compact" />
      </div>

      {/* 模式入口卡片 - v5.6: 更有层次感 */}
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
                onClick={() => handleModeClick(mode)}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl text-left press-feedback overflow-hidden ${
                  mode.available
                    ? 'card-elevated cursor-pointer'
                    : 'bg-slate-800/20 border border-slate-700/10 opacity-50 cursor-not-allowed'
                }`}
              >
                {/* 左侧色带装饰 */}
                {mode.core && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-xh-gold to-orange-500 rounded-l-2xl" />
                )}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    mode.core
                      ? 'bg-gradient-to-br from-xh-gold/20 to-orange-500/10 border border-xh-gold/20 shadow-lg shadow-xh-gold/10'
                      : mode.available
                      ? 'bg-slate-700/30 border border-slate-600/20'
                      : 'bg-slate-700/20 border border-slate-600/10'
                  }`}
                >
                  <Icon
                    size={22}
                    className={mode.available ? (mode.core ? 'text-xh-gold' : 'text-slate-400') : 'text-slate-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">{mode.title}</span>
                    {mode.core && (
                      <span className="text-[10px] bg-xh-gold/15 text-xh-gold px-2 py-0.5 rounded-full border border-xh-gold/25 font-medium">
                        核心
                      </span>
                    )}
                    {!mode.available && (
                      <span className="text-[10px] bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full">
                        即将开放
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mode.subtitle}</p>
                </div>
                <ArrowRight
                  size={18}
                  className={`shrink-0 transition-all duration-300 ${
                    mode.available
                      ? 'text-slate-600 group-hover:text-xh-gold group-hover:translate-x-1'
                      : 'text-slate-700'
                  }`}
                />
              </motion.button>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="mt-4 mb-2 text-center">
          <p className="text-[10px] text-slate-600">
            点击泡泡探索热门内容 · v5.6
          </p>
        </div>
      </div>
    </div>
  );
}
