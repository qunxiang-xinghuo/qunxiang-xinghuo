'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, BookOpen, ArrowRight, User, Globe, Clock, Sparkles } from 'lucide-react';
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

const statusConfig: Record<string, { text: string; color: string; bg: string; border: string; icon: any; gradient: string }> = {
  recruiting: {
    text: '招募中',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: Users,
    gradient: 'from-emerald-500/10 to-teal-500/5',
  },
  ongoing: {
    text: '进行中',
    color: 'text-xh-gold',
    bg: 'bg-xh-gold/10',
    border: 'border-xh-gold/20',
    icon: Clock,
    gradient: 'from-xh-gold/10 to-orange-500/5',
  },
  completed: {
    text: '已完成',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: BookOpen,
    gradient: 'from-blue-500/10 to-cyan-500/5',
  },
};

type TabType = 'personal' | 'public';

const tabs = [
  { id: 'personal' as TabType, label: '个人广场', icon: User },
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
    const uid = localStorage.getItem('xh_user_id') || '';
    setCurrentUserId(uid);
  }, []);

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

  const personalStories = stories.filter(
    (s) => s.directorId === currentUserId || s.status !== 'recruiting'
  );
  const publicStories = stories.filter((s) => s.status === 'recruiting');
  const displayStories = activeTab === 'personal' ? personalStories : publicStories;

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事大厅" />

      {/* 头部区域 - v5.6: 更大气 */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-xh-gold" />
              <h2 className="text-xl font-bold text-slate-100">群像共创</h2>
            </div>
            <p className="text-[11px] text-slate-500">认领角色，一起书写故事</p>
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

        {/* 标签切换 - v5.6: 更精致 */}
        <div className="flex rounded-xl p-1 bg-slate-800/40 border border-slate-700/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-700/60 text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 故事列表 - v5.6: 卡片更有层次 */}
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
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {activeTab === 'personal' ? '还没有个人故事项目' : '暂无公开招募中的故事'}
            </p>
            <p className="text-slate-600 text-xs mt-1.5">
              {activeTab === 'personal'
                ? '去公共招募广场参与或发起一个故事'
                : '点击右上角发起第一个群像共创'}
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
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/story-hall/${story.id}`)}
                className="group card-elevated p-4 cursor-pointer"
              >
                {/* 顶部色带 */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${sc.gradient} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* 标题 + 状态 */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{story.title}</h3>
                      <span className={`shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.color} ${sc.border}`}>
                        <StatusIcon size={10} />
                        {sc.text}
                      </span>
                      {isMyStory && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-xh-gold/15 text-xh-gold border border-xh-gold/25 font-medium">
                          我发起的
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{story.worldview}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-xh-gold group-hover:translate-x-0.5 transition-all duration-300 shrink-0 mt-0.5" />
                </div>

                {/* 核心冲突预览 */}
                {story.conflict && (
                  <div className="mb-3 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/15">
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      <span className="text-slate-600 mr-1">核心冲突：</span>
                      {story.conflict}
                    </p>
                  </div>
                )}

                {/* 进度条 - v5.6: 更大更醒目 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2.5 bg-slate-700/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 }}
                      className={`h-full rounded-full ${
                        isFull
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                          : 'bg-gradient-to-r from-xh-gold to-orange-400'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                    {story.approvedRoles}/{story.totalRoles}
                  </span>
                </div>

                {/* 底部元信息 */}
                <div className="flex items-center gap-4 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {story.director.name || '匿名'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {story.messageCount} 条对白
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(story.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
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
