'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock, ChevronRight, BookOpen, Users, PlusCircle, ScrollText, UserCircle,
  Eye, MessageCircle, AlertCircle, CheckCircle2, Clock4, XCircle, Pencil,
} from 'lucide-react';
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
  hotScore: number;
  isCreator?: boolean;
}

type TabType = 'participated' | 'created';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: '草稿', color: 'text-white/40', icon: Clock4 },
  pending_review: { label: '审核中', color: 'text-[#e2b04a]', icon: AlertCircle },
  approved: { label: '已通过', color: 'text-[#00b894]', icon: CheckCircle2 },
  rejected: { label: '未通过', color: 'text-red-400', icon: XCircle },
  recruiting: { label: '招募中', color: 'text-[#74b9ff]', icon: Users },
  ongoing: { label: '进行中', color: 'text-[#e2b04a]', icon: MessageCircle },
  completed: { label: '已完结', color: 'text-white/40', icon: CheckCircle2 },
  open: { label: '开放中', color: 'text-[#74b9ff]', icon: Eye },
  closed: { label: '已关闭', color: 'text-white/40', icon: XCircle },
};

export default function MyStoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') as TabType | null;
  const { isAuthenticated } = useRequireAuth();
  const [tab, setTab] = useState<TabType>(urlTab || 'participated');
  const [stories, setStories] = useState<MyStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  if (!isAuthenticated) return <div className="h-screen bg-xh-primary" />;

  useEffect(() => { setMounted(true); }, []);

  // URL tab 变化时同步
  useEffect(() => {
    if (urlTab && (urlTab === 'participated' || urlTab === 'created')) {
      setTab(urlTab);
    }
  }, [urlTab]);

  const abortRef = useRef<AbortController | null>(null);

  const loadStories = useCallback(async () => {
    // 取消之前的请求
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/mine?type=${tab}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStories(data.data?.list || []);
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('[MyStories] 加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadStories();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [loadStories]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    // 同步 URL，不影响历史记录
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/my-stories?${params.toString()}`, { scroll: false });
  };

  const handleStoryClick = (story: MyStory) => {
    if (tab === 'created') {
      // 我发起的故事 → 进入故事管理页（创建者可编辑、查看审核状态）
      router.push(`/story/${story.id}`);
    } else {
      // 我参与的故事 → 进入故事详情页（展示角色 + 对白）
      router.push(`/story/${story.id}`);
    }
  };

  const tabs = [
    { key: 'participated' as TabType, label: '我参与的', icon: UserCircle },
    { key: 'created' as TabType, label: '我发起的', icon: ScrollText },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="我的故事" subtitle="你走过的路" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-2">
        {/* Tab */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 ${
                  tab === t.key
                    ? 'text-[#e2b04a] border-[#e2b04a]'
                    : 'text-white/30 border-transparent hover:text-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 创建故事按钮（仅在我发起的 tab） */}
        {tab === 'created' && (
          <motion.button
            initial={mounted ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/story/create')}
            className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl bg-[#e2b04a]/10 border border-[#e2b04a]/20 text-left hover:bg-[#e2b04a]/15 active:scale-[0.99] transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-[#e2b04a]/15 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-[#e2b04a]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#e2b04a]">发起新故事</p>
              <p className="text-[11px] text-[#e2b04a]/50">创建一个场景，设定角色，等待审核</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#e2b04a]/30" />
          </motion.button>
        )}

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
              {tab === 'participated'
                ? '去故事大厅选一个场景开始吧'
                : '点击上方按钮创建你的第一个故事'}
            </p>
            {tab === 'participated' && (
              <button
                onClick={() => router.push('/story-hall')}
                className="mt-4 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
              >
                去故事大厅
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map((story, idx) => {
              const statusInfo = STATUS_MAP[story.status] || STATUS_MAP.draft;
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={story.id}
                  initial={mounted ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleStoryClick(story)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white/90">{story.title}</h3>
                        {/* 审核状态标签 */}
                        {tab === 'created' && (
                          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        )}
                      </div>
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
                        {tab === 'participated' && story.myRole && (
                          <span className="text-[10px] text-[#e2b04a]/40">扮演 {story.myRole}</span>
                        )}
                        {tab === 'created' && story.hotScore > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-[#e2b04a]/40">
                            <Eye className="w-3 h-3" />
                            {story.hotScore}
                          </span>
                        )}
                      </div>
                      {/* 草稿/审核中状态显示编辑按钮 */}
                      {(story.status === 'draft' || story.status === 'pending_review') && tab === 'created' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/story/create?edit=${story.id}`); }}
                          className="mt-2 flex items-center gap-1 text-[10px] text-[#e2b04a]/50 hover:text-[#e2b04a] transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          继续编辑
                        </button>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0 mt-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
