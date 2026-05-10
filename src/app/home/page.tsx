'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp, Flame, Users, ChevronRight, Bot, MessageCircle, Eye, ScrollText,
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
  const [loadError, setLoadError] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [creatingAiRoom, setCreatingAiRoom] = useState(false);

  // v8.0-login-fix: 页面级认证门禁
  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  useEffect(() => { setMounted(true); }, []);

  // v8.0-fix: 添加 AbortController + isMountedRef 防止卸载后 setState
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    const ctrl = new AbortController();
    async function init() {
      try {
        setLoadError(false);
        const res = await fetch('/api/sparks/top?limit=3', { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (isMountedRef.current && data.data?.list) {
          setTop3(data.data.list);
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('首页加载失败:', e);
        if (isMountedRef.current) setLoadError(true);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    }
    init();
    return () => {
      isMountedRef.current = false;
      ctrl.abort();
    };
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
      isAiDirect: true, // v8.1: 一步直达，不跳转身份选择页
    },
    {
      key: 'duo',
      title: '双人对白模式',
      desc: '与陌生人配对，即兴对话',
      icon: MessageCircle,
      color: 'from-[#8a9ab0]/20 to-[#6c7c90]/20',
      iconColor: 'text-[#8a9ab0]',
      path: '/duo-match',
      comingSoon: false,
    },
    {
      key: 'multi',
      title: '多人模式',
      desc: '多人即兴碰撞，共创群像故事',
      icon: Users,
      color: 'from-[#74b9ff]/20 to-blue-500/20',
      iconColor: 'text-[#74b9ff]',
      path: '/multiplayer',
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
            <TrendingUp className="w-4 h-4 text-[#8a9ab0]" />
            <h2 className="text-sm font-semibold text-white/90">今日最热火花</h2>
            <span className="text-[10px] text-white/20 ml-1">已完结对白精选</span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-6">
              <p className="text-sm text-white/30 mb-2">加载失败</p>
              <button
                onClick={() => { setLoading(true); setLoadError(false); window.location.reload(); }}
                className="text-xs text-[#8a9ab0]/50 hover:text-[#8a9ab0]/70 transition-colors"
              >
                点击刷新
              </button>
            </div>
          ) : top3.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-white/30">暂无火花数据</p>
              <p className="text-xs text-white/20 mt-1">去发起一段对白，创造第一个火花</p>
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
                    idx === 0 ? 'bg-[#8a9ab0]/20 text-[#8a9ab0]' :
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
                      <span className="flex items-center gap-0.5 text-[11px] text-xh-yellow/40">
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

        {/* 我的故事快捷入口 */}
        <section className="mb-4">
          <button
            onClick={() => router.push('/my-stories')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.99] transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#8a9ab0]/10 flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-[#8a9ab0]/60" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white/80">我的故事</p>
              <p className="text-[11px] text-white/30">查看你参与和发起的故事</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/15" />
          </button>
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
                  onClick={async () => {
                    if (mode.comingSoon) {
                      setShowComingSoon(mode.title);
                    } else if (mode.isAiDirect) {
                      // v8.1: 一步直达，直接创建AI房间
                      if (creatingAiRoom) return;
                      setCreatingAiRoom(true);
                      try {
                        const res = await fetch('/api/rooms/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({}),
                        });
                        const result = await res.json();
                        if (result.success && result.data?.roomId) {
                          router.push(`/room/${result.data.roomId}`);
                        } else {
                          alert('创建房间失败，请重试');
                          setCreatingAiRoom(false);
                        }
                      } catch (e) {
                        alert('网络异常，请重试');
                        setCreatingAiRoom(false);
                      }
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
            <Flame className="w-8 h-8 text-xh-yellow/60 mx-auto mb-3" />
            <p className="text-base font-semibold text-white/90 mb-1">{showComingSoon}</p>
            <p className="text-sm text-white/40 mb-4">即将开放，敬请期待</p>
            <button
              onClick={() => setShowComingSoon(null)}
              className="w-full py-2.5 rounded-xl bg-xh-yellow/15 text-xh-yellow text-sm font-medium border border-xh-yellow/20"
            >
              知道了
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
