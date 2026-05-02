'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, ArrowRight, User, Globe, Clock, Sparkles, Crown, Flame, Theater } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import CreateStoryModal from '@/components/story/CreateStoryModal';

interface StoryItem {
  id: string;
  title: string;
  worldview: string;
  conflict: string;
  status: string;
  directorId: string;
  director: { id: string; name: string | null };
  maxActors: number;
  totalRoles: number;
  claimedRoles: number;
  approvedRoles: number;
  messageCount: number;
  createdAt: string;
}

const statusConfig: Record<string, { text: string; color: string; bg: string; border: string; icon: any; barColor: string }> = {
  recruiting: {
    text: '招募中', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20', icon: Users, barColor: 'bg-emerald-500',
  },
  ongoing: {
    text: '进行中', color: 'text-xh-gold', bg: 'bg-xh-gold/10',
    border: 'border-xh-gold/20', icon: Clock, barColor: 'bg-xh-gold',
  },
  completed: {
    text: '已完成', color: 'text-blue-400', bg: 'bg-blue-500/10',
    border: 'border-blue-500/20', icon: BookOpen, barColor: 'bg-blue-500',
  },
};

type TabType = 'personal' | 'public';

const tabs = [
  { id: 'personal' as TabType, label: '我的剧场', icon: User },
  { id: 'public' as TabType, label: '公共招募', icon: Globe },
];

export default function StoryHallPage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('xh_user_id') || '');
  }, []);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stories');
      const result = await res.json();
      if (result.success && result.data?.stories) setStories(result.data.stories);
    } catch (err) { console.error('Load stories failed:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStories(); }, [loadStories]);

  const personalStories = stories.filter((s) => s.directorId === currentUserId || s.status !== 'recruiting');
  const publicStories = stories.filter((s) => s.status === 'recruiting');
  const displayStories = activeTab === 'personal' ? personalStories : publicStories;

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事大厅" />

      {/* ====== 剧场式头部 ====== */}
      <div className="shrink-0 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-xh-gold/20 to-orange-500/10 border border-xh-gold/25 flex items-center justify-center">
                <Theater className="w-5 h-5 text-xh-gold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">群像共创剧场</h2>
                <p className="text-[11px] text-slate-500">认领角色，一起书写属于你们的故事</p>
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium shadow-lg shadow-xh-gold/20 hover:shadow-xl hover:shadow-xh-gold/30 transition-shadow"
          >
            <Plus className="w-4 h-4" />
            发起共创
          </motion.button>
        </div>

        {/* 标签切换 */}
        <div className="flex rounded-xl p-1 bg-slate-800/40 border border-slate-700/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-slate-700/60 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====== 故事列表 - 海报式卡片 ====== */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-xh-gold rounded-full animate-spin" />
          </div>
        ) : displayStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/20"
          >
            <Theater className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {activeTab === 'personal' ? '你的剧场还是空的' : '暂无公开招募中的故事'}
            </p>
            <p className="text-slate-600 text-xs mt-1.5">
              {activeTab === 'personal' ? '去公共招募广场看看，或发起第一个故事' : '点击右上角发起第一个群像共创'}
            </p>
          </motion.div>
        ) : (
          displayStories.map((story, index) => {
            const sc = statusConfig[story.status] || statusConfig.recruiting;
            const StatusIcon = sc.icon;
            const progress = story.totalRoles > 0 ? Math.round((story.approvedRoles / story.totalRoles) * 100) : 0;
            const isMyStory = story.directorId === currentUserId;
            const isFull = progress >= 100;

            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                onClick={() => router.push(`/story-hall/${story.id}`)}
                className="group card-elevated cursor-pointer relative overflow-hidden flex gap-3 p-0"
              >
                {/* 左侧状态竖条 + 图标区 */}
                <div className={`relative shrink-0 w-16 flex flex-col items-center justify-center py-4 ${sc.bg} border-r ${sc.border}`}>
                  <StatusIcon size={24} className={`${sc.color} mb-1.5`} />
                  <span className={`text-[10px] font-medium ${sc.color}`}>{sc.text}</span>
                  {/* 左侧色条 */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${sc.barColor}`} />
                </div>

                {/* 右侧内容区 */}
                <div className="flex-1 min-w-0 py-3 pr-4 pl-1">
                  {/* 标题行 */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-slate-100 truncate pr-2">{story.title}</h3>
                    {isMyStory && (
                      <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-xh-gold/10 border border-xh-gold/20">
                        <Crown className="w-3 h-3 text-xh-gold" />
                        <span className="text-[9px] text-xh-gold font-medium">导演</span>
                      </div>
                    )}
                  </div>

                  {/* 导演 */}
                  <p className="text-[11px] text-slate-600 mb-2 flex items-center gap-1">
                    <Users size={11} />
                    <span className="text-slate-500">导演</span>
                    <span className="text-slate-400">{story.director.name || '匿名'}</span>
                  </p>

                  {/* 世界观 */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">{story.worldview}</p>

                  {/* 核心冲突 */}
                  {story.conflict && (
                    <div className="mb-2.5 flex items-start gap-1.5">
                      <Flame className="w-3 h-3 text-xh-gold/60 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-500 line-clamp-1">{story.conflict}</p>
                    </div>
                  )}

                  {/* 进度条 */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 bg-slate-700/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: index * 0.06 }}
                        className={`h-full rounded-full ${
                          isFull ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-xh-gold to-orange-400'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                      {story.approvedRoles}/{story.totalRoles}
                    </span>
                  </div>

                  {/* 底部元信息 */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/10">
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1">
                        <BookOpen size={10} />
                        {story.messageCount} 条对白
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(story.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-xh-gold group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
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
