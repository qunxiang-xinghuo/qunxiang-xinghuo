'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Flame, Users, ChevronRight, Bot, MessageCircle, Eye, ScrollText,
  Sparkles, ExternalLink, Zap, X,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface Top3Item {
  id: string;
  brainholeTitle: string;
  content: string;
  identityPair: string;
  sparkCount: number;
  roomId: string | null;
}

interface HotItem {
  Title: string;
  Url: string;
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();

  const [top3, setTop3] = useState<Top3Item[]>([]);
  const [hotList, setHotList] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotLoading, setHotLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [creatingAiRoom, setCreatingAiRoom] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishContent, setPublishContent] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const isMountedRef = useRef(true);
  useEffect(() => {
    if (!isAuthenticated) return;
    isMountedRef.current = true;
    const ctrl = new AbortController();

    async function init() {
      try {
        setLoadError(false);
        const [sparksRes, hotRes] = await Promise.all([
          fetch('/api/sparks/top?limit=3', { signal: ctrl.signal }),
          fetch('/api/zhihu/hot-list?limit=3', { signal: ctrl.signal }),
        ]);

        if (sparksRes.ok) {
          const sparksData = await sparksRes.json();
          if (isMountedRef.current && sparksData.data?.list) {
            setTop3(sparksData.data.list);
          }
        }
        if (hotRes.ok) {
          const hotData = await hotRes.json();
          if (isMountedRef.current && hotData.data?.list) {
            setHotList(hotData.data.list);
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('首页加载失败:', e);
        if (isMountedRef.current) setLoadError(true);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setHotLoading(false);
        }
      }
    }
    init();
    return () => {
      isMountedRef.current = false;
      ctrl.abort();
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  // 一键发布到知乎圈子
  const handlePublish = async () => {
    if (!publishTitle.trim() || !publishContent.trim()) return;
    setPublishLoading(true);
    try {
      const res = await fetch('/api/zhihu/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: publishTitle.trim(),
          content: publishContent.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert('发布成功！');
        setShowPublishModal(false);
        setPublishTitle('');
        setPublishContent('');
      } else {
        alert(result.error?.message || '发布失败');
      }
    } catch (e) {
      alert('网络异常，发布失败');
    } finally {
      setPublishLoading(false);
    }
  };

  const modes = [
    {
      key: 'ai',
      title: '和刘看山对话',
      desc: '与刘看山一对一对话',
      icon: Bot,
      color: 'from-[#00b894]/20 to-emerald-500/20',
      iconColor: 'text-[#00b894]',
      path: '/solo-match',
      isAiDirect: true,
    },
    {
      key: 'duo',
      title: '双人对白模式',
      desc: '与陌生人配对，即兴对话',
      icon: MessageCircle,
      color: 'from-[#3B82F6]/20 to-[#2563EB]/20',
      iconColor: 'text-[#60A5FA]',
      path: '/duo-match',
    },
    {
      key: 'multi',
      title: '多人模式',
      desc: '多人即兴碰撞，共创群像故事',
      icon: Users,
      color: 'from-[#74b9ff]/20 to-blue-500/20',
      iconColor: 'text-[#74b9ff]',
      path: '/multiplayer',
    },
    {
      key: 'spectate',
      title: '观看模式',
      desc: '实时围观公开房间对白',
      icon: Eye,
      color: 'from-[#ff6b6b]/20 to-red-500/20',
      iconColor: 'text-[#ff6b6b]',
      path: '/spectate',
    },
  ];

  const user = session?.user;
  const userName = user?.name || user?.username || '知乎用户';
  const userImage = user?.image;
  const userSparkCount = user?.sparkCount || 0;

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="发现" subtitle="今日灵感" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">

        {/* ====== 知乎用户欢迎区 ====== */}
        {user && (
          <motion.div
            initial={mounted ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/5"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">
                  {userName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{userName}</p>
              <p className="text-xs text-white/40">欢迎回到群像·星火</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-xh-yellow/10 border border-xh-yellow/20">
              <Flame className="w-3 h-3 text-xh-yellow" />
              <span className="text-xs text-xh-yellow font-medium">{userSparkCount}</span>
            </div>
          </motion.div>
        )}

        {/* ====== 火花卡片区 ====== */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-xh-yellow" />
              <h2 className="text-sm font-semibold text-white/90">今日最热火花</h2>
            </div>
            <button
              onClick={() => router.push('/library')}
              className="text-[11px] text-white/30 hover:text-xh-yellow/70 transition-colors flex items-center gap-0.5"
            >
              查看更多 <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[260px] h-32 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-6">
              <p className="text-sm text-white/30 mb-2">加载失败</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-xh-yellow/50 hover:text-xh-yellow/70 transition-colors"
              >
                点击刷新
              </button>
            </div>
          ) : top3.length === 0 ? (
            <div className="text-center py-6 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-sm text-white/30">暂无火花数据</p>
              <p className="text-xs text-white/20 mt-1">去发起一段对白，创造第一个火花</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {top3.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={mounted ? { opacity: 0, x: 20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => item.roomId && router.push(`/room/${item.roomId}`)}
                  className={`flex-shrink-0 w-[260px] snap-start p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/5 ${
                    item.roomId ? 'hover:border-white/10 active:scale-[0.98] cursor-pointer transition-all' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      idx === 0 ? 'bg-xh-yellow/20 text-xh-yellow' :
                      idx === 1 ? 'bg-white/10 text-white/60' :
                      'bg-[#74b9ff]/10 text-[#74b9ff]/70'
                    }`}>
                      TOP {idx + 1}
                    </span>
                    <span className="text-[11px] text-white/40 truncate">{item.brainholeTitle}</span>
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed line-clamp-3 mb-2">
                    {item.content || '暂无内容摘要'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">{item.identityPair}</span>
                    <span className="flex items-center gap-0.5 text-[11px] text-xh-yellow/50">
                      <Flame className="w-3 h-3" />
                      {item.sparkCount}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ====== 知乎热榜灵感 ====== */}
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#ff6b6b]" />
            <h2 className="text-sm font-semibold text-white/90">知乎热榜 · 灵感</h2>
            <span className="text-[10px] text-white/20 ml-1">点击即可作为脑洞发起对白</span>
          </div>
          {hotLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : hotList.length === 0 ? (
            <p className="text-xs text-white/20 py-2">热榜加载中...</p>
          ) : (
            <div className="space-y-1.5">
              {hotList.slice(0, 3).map((item, idx) => (
                <motion.button
                  key={idx}
                  initial={mounted ? { opacity: 0, x: -10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.08 }}
                  onClick={() => router.push('/duo-match')}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left"
                >
                  <span className={`text-xs font-bold w-4 text-center ${
                    idx === 0 ? 'text-[#ff6b6b]' :
                    idx === 1 ? 'text-[#ff9f43]' :
                    'text-[#74b9ff]'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-[13px] text-white/70 truncate flex-1">{item.Title}</span>
                  <Zap className="w-3 h-3 text-white/15 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </section>

        {/* ====== 我的故事 + 发布到知乎 ====== */}
        <section className="mb-4 space-y-2">
          <button
            onClick={() => router.push('/my-stories')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.99] transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#8a9ab0]/10 flex items-center justify-center">
              <ScrollText className="w-4 h-4 text-xh-yellow/60" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white/80">我的故事</p>
              <p className="text-[11px] text-white/30">查看你参与和发起的故事</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/15" />
          </button>

          <button
            onClick={() => setShowPublishModal(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#0066FF]/10 to-[#0052CC]/10 border border-[#0066FF]/20 hover:border-[#0066FF]/40 active:scale-[0.99] transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0066FF]/15 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-[#0066FF]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white/80">发布到知乎圈子</p>
              <p className="text-[11px] text-white/30">一键分享你的故事到知乎</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/15" />
          </button>
        </section>

        {/* ====== 四大模式入口 ====== */}
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
                    if (mode.isAiDirect) {
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
                  <Icon className={`w-5 h-5 ${mode.iconColor} mb-2`} />
                  <p className="text-sm font-semibold text-white/90">{mode.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{mode.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ====== 发布到知乎 Modal ====== */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPublishModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[400px] mx-4 mb-4 sm:mb-0 p-5 rounded-2xl bg-[#1a1a2e] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white/90">发布到知乎圈子</h3>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">标题</label>
                  <input
                    type="text"
                    value={publishTitle}
                    onChange={(e) => setPublishTitle(e.target.value)}
                    placeholder="给你的想法起个标题"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#0066FF]/50 transition-colors"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">内容</label>
                  <textarea
                    value={publishContent}
                    onChange={(e) => setPublishContent(e.target.value)}
                    placeholder="分享你的故事、观点..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#0066FF]/50 transition-colors resize-none"
                    maxLength={2000}
                  />
                </div>
                <p className="text-[10px] text-white/20">每小时最多发布 5 条想法</p>

                <button
                  onClick={handlePublish}
                  disabled={publishLoading || !publishTitle.trim() || !publishContent.trim()}
                  className="w-full py-3 rounded-xl bg-[#0066FF] text-white text-sm font-medium hover:bg-[#0052CC] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {publishLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      确认发布
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
