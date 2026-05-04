'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Flame, Zap, Users, ChevronRight, Bot, BookOpen, MessageCircle,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface Brainhole {
  id: string;
  title: string;
  category: string;
  hotScore: number;
  heat?: number;
  scene: string;
}

export default function HomePage() {
  const router = useRouter();
  const [top3, setTop3] = useState<Brainhole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/brainholes/bubble?limit=10');
        const data = await res.json();
        if (data.data?.list) {
          setTop3(data.data.list.slice(0, 3));
        }
      } catch (e) {
        console.error('首页加载失败:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // v6.1: 四大模式，长期连载和多人模式标记为 comingSoon
  const modes = [
    {
      key: 'ai',
      title: '人机模式',
      desc: '与刘看山一对一对话',
      icon: Bot,
      color: 'from-[#00b894]/20 to-emerald-500/20',
      iconColor: 'text-[#00b894]',
      path: '/solo-match',
      comingSoon: false,
    },
    {
      key: 'duo',
      title: '双人对白',
      desc: '与陌生人配对，即兴对话',
      icon: MessageCircle,
      color: 'from-[#e2b04a]/20 to-orange-500/20',
      iconColor: 'text-[#e2b04a]',
      path: '/duo-match',
      comingSoon: false,
    },
    {
      key: 'multi',
      title: '多人组队',
      desc: '多人共创故事',
      icon: Users,
      color: 'from-[#74b9ff]/20 to-blue-500/20',
      iconColor: 'text-[#74b9ff]',
      path: '/story-hall',
      comingSoon: true,
    },
    {
      key: 'serial',
      title: '长期连载',
      desc: '连载故事，持续更新',
      icon: BookOpen,
      color: 'from-[#a29bfe]/20 to-purple-500/20',
      iconColor: 'text-[#a29bfe]',
      path: '/story-hall?tab=serial',
      comingSoon: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="发现" subtitle="今日灵感" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 今日最热 TOP3 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#e2b04a]" />
            <h2 className="text-sm font-semibold text-white/90">今日最热</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {top3.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => router.push(`/duo-match?brainholeId=${item.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-[#e2b04a]/20 text-[#e2b04a]' :
                    idx === 1 ? 'bg-white/10 text-white/70' :
                    'bg-[#74b9ff]/10 text-[#74b9ff]'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5">{item.scene || item.category}</p>
                  </div>
                  <Flame className="w-3.5 h-3.5 text-[#e2b04a]/60" />
                  <span className="text-[11px] text-white/30 flex-shrink-0">{item.heat || item.hotScore || 0}</span>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* 四大模式入口 */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-white/90 mb-3">选择模式</h2>
          <div className="grid grid-cols-2 gap-3">
            {modes.map((mode, idx) => {
              const Icon = mode.icon;
              return (
                <motion.button
                  key={mode.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08 }}
                  onClick={() => {
                    if (mode.comingSoon) {
                      setShowComingSoon(mode.title);
                    } else {
                      router.push(mode.path);
                    }
                  }}
                  className={`relative overflow-hidden p-4 rounded-xl bg-gradient-to-br ${mode.color} border border-white/5 text-left active:scale-[0.96] transition-all group`}
                >
                  {mode.comingSoon && (
                    <span className="absolute top-2 right-2 text-[9px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">
                      即将上线
                    </span>
                  )}
                  <Icon className={`w-5 h-5 ${mode.iconColor} mb-2`} />
                  <p className="text-sm font-semibold text-white/90">{mode.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{mode.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Coming Soon 弹层 */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowComingSoon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 p-6 rounded-2xl bg-[#1a1a2e] border border-white/10 max-w-[280px] w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Flame className="w-8 h-8 text-[#e2b04a]/60 mx-auto mb-3" />
              <p className="text-base font-semibold text-white/90 mb-1">{showComingSoon}</p>
              <p className="text-sm text-white/40 mb-4">即将开放，敬请期待</p>
              <button
                onClick={() => setShowComingSoon(null)}
                className="w-full py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm font-medium border border-[#e2b04a]/20"
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
