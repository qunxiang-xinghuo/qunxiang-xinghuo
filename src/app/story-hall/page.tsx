'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, Sparkles, Globe, ArrowRight } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import CreateStoryModal from '@/components/story/CreateStoryModal';

interface StoryItem {
  id: string;
  title: string;
  worldview: string;
  conflict: string;
  status: string;
  director: { id: string; name: string | null };
  maxActors: number;
  totalRoles: number;
  claimedRoles: number;
  messageCount: number;
  createdAt: string;
}

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  recruiting: { text: '招募中', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ongoing: { text: '进行中', color: 'text-xh-gold', bg: 'bg-xh-gold/10' },
  completed: { text: '已完成', color: 'text-blue-400', bg: 'bg-blue-500/10' },
};

export default function StoryHallPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories');
      const result = await res.json();
      if (result.success && result.data?.stories) {
        setStories(result.data.stories);
      }
    } catch (err) {
      console.error('Load stories failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事大厅" />

      {/* 头部区域 */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white/90">群像共创</h2>
            <p className="text-xs text-white/50 mt-0.5">认领角色，一起书写故事</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity press-feedback"
          >
            <Plus className="w-4 h-4" />
            发起新故事
          </button>
        </div>
      </div>

      {/* 故事列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : stories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white/[0.03] rounded-xl border border-white/[0.06]"
          >
            <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-xs">还没有故事项目</p>
            <p className="text-white/20 text-[10px] mt-1">点击右上角发起第一个故事</p>
          </motion.div>
        ) : (
          stories.map((story, index) => {
            const statusInfo = statusLabels[story.status] || statusLabels.recruiting;
            const progress = story.totalRoles > 0 ? Math.round((story.claimedRoles / story.totalRoles) * 100) : 0;
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/story-hall/${story.id}`)}
                className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all press-feedback cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white/90 truncate">{story.title}</h3>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 line-clamp-2">{story.worldview}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 shrink-0 mt-1" />
                </div>

                {/* 进度条 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-xh-gold rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 shrink-0">
                    {story.claimedRoles}/{story.totalRoles} 角色
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {story.director.name || '匿名'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {story.messageCount} 条对白
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreateStoryModal onClose={() => setShowCreateModal(false)} onCreated={loadStories} />
      )}
    </div>
  );
}
