'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, ChevronRight, Sparkles, Filter } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface StoryItem {
  id: string;
  title: string;
  eraBackground: string;
  storySummary: string;
  hotScore: number;
  maxCharacters: number;
  roleCount: number;
  roles: { id: string; name: string; claimed: boolean }[];
}

export default function StoryHallPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [filteredStories, setFilteredStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const categories = ['全部', '古风', '民国', '现代'];

  const getCategory = (era: string) => {
    if (era.includes('明') || era.includes('古') || era.includes('朝')) return '古风';
    if (era.includes('1937') || era.includes('民国') || era.includes('沦陷')) return '民国';
    return '现代';
  };

  if (!isAuthenticated) return <div className="h-screen bg-xh-primary" />;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch('/api/stories')
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.list || [];
        setStories(list);
        setFilteredStories(list);
      })
      .catch((e) => console.error('[StoryHall] 加载失败:', e))
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
      <PageHeader title="故事大厅" subtitle="选择一个场景，进入角色" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 长期连载入口 */}
        <motion.button
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push('/story-hall/long-term')}
          className="w-full mb-4 p-4 rounded-xl bg-gradient-to-r from-[#e2b04a]/10 to-transparent border border-[#e2b04a]/20 text-left active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#e2b04a]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/80">长期连载</p>
              <p className="text-[11px] text-white/30">发起一个只有开头的故事，开放给所有人认领角色</p>
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
                  ? 'bg-[#e2b04a]/10 text-[#e2b04a]/70 border-[#e2b04a]/20'
                  : 'bg-white/[0.02] text-white/30 border-white/5 hover:bg-white/[0.05]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 解密故事列表 */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#e2b04a]" />
          <h2 className="text-sm font-semibold text-white/90">解密故事</h2>
          <span className="text-[10px] text-white/20 ml-1">{filteredStories.length} 个</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30 mb-1">还没有解密故事</p>
            <p className="text-xs text-white/20 mb-4">第一个故事即将上线，敬请期待</p>
            <button
              onClick={() => router.push('/story-hall/long-term')}
              className="text-xs text-[#e2b04a]/50 hover:text-[#e2b04a]/70 transition-colors"
            >
              去看看长期连载 →
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
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white/90 mb-1">{story.title}</h3>
                    <p className="text-[11px] text-[#e2b04a]/50 mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.eraBackground}
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-2">{story.storySummary}</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-white/20">
                        <Users className="w-3 h-3" />
                        {story.roleCount} 个角色
                      </span>
                      <span className="text-[10px] text-white/15">
                        {story.roles.filter((r) => r.claimed).length}/{story.maxCharacters} 人已选
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
