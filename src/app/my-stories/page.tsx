'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen, Users } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface MyStory {
  id: string;
  title: string;
  eraBackground: string;
  status: string;
  myRole?: string;
  createdAt: string;
  roleCount: number;
}

type TabType = 'participated' | 'created';

export default function MyStoriesPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const [tab, setTab] = useState<TabType>('participated');
  const [stories, setStories] = useState<MyStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  if (!isAuthenticated) return <div className="h-screen bg-xh-primary" />;

  useEffect(() => { setMounted(true); }, []);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/mine?type=${tab}`);
      const data = await res.json();
      setStories(data.data?.list || []);
    } catch (e) {
      console.error('[MyStories] 加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="我的故事" subtitle="你走过的路" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-2">
        {/* Tab */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-3">
          {[
            { key: 'participated', label: '我参与的' },
            { key: 'created', label: '我发起的' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabType)}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                tab === t.key
                  ? 'text-[#e2b04a] border-[#e2b04a]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">
              {tab === 'participated' ? '还没有参与过故事' : '还没有发起过故事'}
            </p>
            <p className="text-xs text-white/20 mt-1">
              {tab === 'participated' ? '去故事大厅选一个场景开始吧' : '去故事大厅创建一个属于你的故事'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map((story, idx) => (
              <motion.div
                key={story.id}
                initial={mounted ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/story/${story.id}`)}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white/90 mb-1">{story.title}</h3>
                    <p className="text-[11px] text-white/30 mb-1">{story.eraBackground}</p>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-white/20">
                        <Clock className="w-3 h-3" />
                        {new Date(story.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-white/20">
                        <Users className="w-3 h-3" />
                        {story.roleCount} 角色
                      </span>
                      {story.myRole && (
                        <span className="text-[10px] text-[#e2b04a]/40">扮演 {story.myRole}</span>
                      )}
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
