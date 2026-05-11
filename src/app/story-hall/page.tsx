'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, ChevronRight, Sparkles, Filter, Flame } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface StoryItem {
  id: string;
  title: string;
  eraBackground: string;
  storySummary: string;
  hotScore: number;
  liked: boolean;
  maxCharacters: number;
  difficulty: number;
  roleCount: number;
  roles: { id: string; name: string; claimed: boolean }[];
}

export default function StoryHallPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [filteredStories, setFilteredStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);

  const categories = ['全部', '古风', '民国', '现代'];

  const getCategory = (era: string) => {
    if (era.includes('明') || era.includes('古') || era.includes('朝')) return '古风';
    if (era.includes('1937') || era.includes('民国') || era.includes('沦陷')) return '民国';
    return '现代';
  };

  if (!isAuthenticated) return <div className="h-screen bg-xh-primary" />;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setLoadError(false);
    fetch('/api/stories')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const list = data.data?.list || [];
        setStories(list);
        setFilteredStories(list);
      })
      .catch((e) => {
        console.error('[StoryHall] 加载失败:', e);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === '全部') {
      setFilteredStories(stories);
    } else {
      setFilteredStories(stories.filter((s) => getCategory(s.eraBackground) === activeCategory));
    }
  }, [activeCategory, stories]);

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="故事大厅" subtitle="选择一个冒险，揭开真相" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 长期连载入口 */}
        <motion.button
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/story-hall/long-term')}
          className="w-full mb-4 p-4 rounded-xl bg-gradient-to-r from-[#D4B830]/10 to-transparent border border-[#D4B830]/20 text-left active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#D4B830]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/80">长期连载</p>
              <p className="text-[11px] text-white/30">发起一个只有开头的故事，等有缘人来填满它</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>
        </motion.button>

        {/* 分类标签 */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${
                activeCategory === cat
                  ? 'bg-[#D4B830]/10 text-[#D4B830]/70 border-[#D4B830]/20'
                  : 'bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 解密故事列表 */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#D4B830]" />
          <h2 className="text-sm font-semibold text-white/90">🔍 待揭开的谜</h2>
          <span className="text-[10px] text-white/20 ml-1">{filteredStories.length} 个</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30 mb-1">谜题加载中出了点问题</p>
            <p className="text-xs text-white/20 mb-4">稍等一下，再试一次</p>
            <button
              onClick={() => { setLoading(true); setLoadError(false); window.location.reload(); }}
              className="text-xs text-[#D4B830]/50 hover:text-[#D4B830]/70 transition-colors"
            >
              点击刷新
            </button>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30 mb-1">还没有待揭开的谜</p>
            <p className="text-xs text-white/20 mb-4">第一个冒险即将开始，敬请期待</p>
            <button
              onClick={() => router.push('/story-hall/long-term')}
              className="text-xs text-[#D4B830]/50 hover:text-[#D4B830]/70 transition-colors"
            >
              去长期连载里看看 →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={mounted ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => router.push(`/story/${story.id}`)}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 border-l-2 border-l-[#D4B830]/20 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
              >
                {/* 微弱发光背景 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4B830]/[0.02] rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div className="flex-1 min-w-0">
                    {/* 时代背景 - 放最上面，营造氛围 */}
                    <p className="text-[11px] text-[#D4B830]/60 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.eraBackground}
                    </p>
                    {/* 标题 */}
                    <h3 className="text-sm font-bold text-white/90 mb-2">{story.title}</h3>
                    {/* 悬念开场 - 核心内容，3行 */}
                    <p className="text-sm text-white/45 leading-relaxed line-clamp-3 mb-3">
                      {story.storySummary}
                    </p>
                    {/* 底部信息行 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-white/20">
                          <Users className="w-3 h-3" />
                          {story.roleCount} 个角色
                        </span>
                        <span className="text-[10px] text-white/15">
                          {story.roles.filter((r) => r.claimed).length}/{story.maxCharacters} 人已选
                        </span>
                        <span className="text-[10px] text-[#D4B830]/30">
                          {'🌟'.repeat(story.difficulty || 1)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#D4B830]/50 flex items-center gap-0.5">
                        🔍 开始探索
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* v8.2: 故事点赞 */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLikeLoadingId(story.id);
                        try {
                          const res = await fetch(`/api/stories/${story.id}/like`, { method: 'POST' });
                          const data = await res.json();
                          if (data.success) {
                            setStories((prev) =>
                              prev.map((s) =>
                                s.id === story.id
                                  ? { ...s, liked: data.data.liked, hotScore: data.data.hotScore }
                                  : s
                              )
                            );
                            setFilteredStories((prev) =>
                              prev.map((s) =>
                                s.id === story.id
                                  ? { ...s, liked: data.data.liked, hotScore: data.data.hotScore }
                                  : s
                              )
                            );
                          }
                        } catch (e) {
                          console.error('点赞失败:', e);
                        } finally {
                          setLikeLoadingId(null);
                        }
                      }}
                      disabled={likeLoadingId === story.id}
                      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                        story.liked
                          ? 'bg-[#D4B830]/15 text-[#D4B830] border-[#D4B830]/25'
                          : 'bg-white/[0.03] text-white/25 border-white/5 hover:bg-white/[0.06] hover:text-white/40'
                      }`}
                    >
                      {likeLoadingId === story.id ? (
                        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Flame className={`w-3 h-3 ${story.liked ? 'fill-current' : ''}`} />
                      )}
                      {story.hotScore}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
