'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp, Flame, Zap, Users, ChevronRight, Bot, BookOpen, MessageCircle, Eye, Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Top3Item {
  id: string;
  brainholeTitle: string;
  identityPair: string;
  sparkCount: number;
  roomId: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const [top3, setTop3] = useState<Top3Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // v8.0-login-fix: 页面级认证门禁
  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/sparks/top?limit=3');
        const data = await res.json();
        if (data.data?.list) {
          setTop3(data.data.list);
        }
      } catch (e) {
        console.error('首页加载失败:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const modes = [
    {
      key: 'ai',
      title: '和刘看山对话',
      desc: '与刘看山一对一对话',
      icon: Bot,
      color: 'from-[#00b894]/20 to-emerald-500/20',
      iconColor: 'text-[#00b894]',
      path: '/solo-match',
      comingSoon: false,
    },
    {
      key: 'duo',
      title: '双人对白模式',
      desc: '与陌生人配对，即兴对话',
      icon: MessageCircle,
      color: 'from-[#e2b04a]/20 to-orange-500/20',
      iconColor: 'text-[#e2b04a]',
      path: '/duo-match',
      comingSoon: false,
    },
    {
      key: 'multi',
      title: '故事大厅',
      desc: '选择一个场景，进入角色',
      icon: Users,
      color: 'from-[#74b9ff]/20 to-blue-500/20',
      iconColor: 'text-[#74b9ff]',
      path: '/story-hall',
      comingSoon: false,
    },
    {
      key: 'spectate',
      title: '观看模式',
      desc: '实时围观公开房间对白',
      icon: Eye,
      color: 'from-[#ff6b6b]/20 to-red-500/20',
      iconColor: 'text-[#ff6b6b]',
      path: '/spectate',
      comingSoon: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="发现" subtitle="今日灵感" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* v8.1: TOP3 极简文字列表 */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#e2b04a]" />
            <h2 className="text-sm font-semibold text-white/90">今日最热火花</h2>
            <span className="text-[10px] text-white/20 ml-1">已完结对白精选</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {top3.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={mounted ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => item.roomId && router.push(`/room/${item.roomId}`)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    item.roomId
                      ? 'hover:bg-white/[0.04] active:scale-[0.99] cursor-pointer'
                      : 'opacity-50 cursor-default'
                  }`}
                >
                  {/* 排名 */}
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0 ? 'bg-[#e2b04a]/20 text-[#e2b04a]' :
                    idx === 1 ? 'bg-white/10 text-white/60' :
                    'bg-[#74b9ff]/10 text-[#74b9ff]/70'
                  }`}>
                    {idx + 1}
                  </div>
                  {/* 极简信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/80 truncate font-medium">{item.brainholeTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/30">{item.identityPair}</span>
                      <span className="text-[10px] text-white/15">·</span>
                      <span className="flex items-center gap-0.5 text-[11px] text-[#e2b04a]/40">
                        <Flame className="w-3 h-3" />
                        {item.sparkCount}
                      </span>
                    </div>
                  </div>
                  {item.roomId && (
                    <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
                  )}
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
                  initial={mounted ? { opacity: 0, y: 15 } : false}
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
    </div>
  );
}
