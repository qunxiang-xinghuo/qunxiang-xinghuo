'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, Sparkles, MessageSquare, ArrowRight, UserCheck, Lock } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import ClaimRoleModal from '@/components/story/ClaimRoleModal';

interface StoryRole {
  id: string;
  name: string;
  description: string;
  requirements: string | null;
  claimedBy: string | null;
  claimedAt: string | null;
  claimReason: string | null;
  user: { id: string; name: string | null } | null;
}

interface StoryDetail {
  id: string;
  title: string;
  worldview: string;
  conflict: string;
  status: string;
  director: { id: string; name: string | null };
  maxActors: number;
  roles: StoryRole[];
  chapters: { id: string; title: string; status: string }[];
  messages: any[];
  createdAt: string;
  _count: { messages: number; inspirations: number };
}

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  recruiting: { text: '招募中', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ongoing: { text: '进行中', color: 'text-xh-gold', bg: 'bg-xh-gold/10 border-xh-gold/20' },
  completed: { text: '已完成', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
};

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingRole, setClaimingRole] = useState<StoryRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const uid = localStorage.getItem('xh_user_id') || '';
    setCurrentUserId(uid);
  }, []);

  const loadStory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      const result = await res.json();
      if (result.success && result.data?.story) {
        setStory(result.data.story);
      }
    } catch (err) {
      console.error('Load story failed:', err);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    loadStory();
  }, [loadStory]);

  const isDirector = story?.director.id === currentUserId;
  const allClaimed = story ? story.roles.every((r) => r.claimedBy) : false;
  const statusInfo = story ? statusLabels[story.status] || statusLabels.recruiting : statusLabels.recruiting;

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="故事详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="故事详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/50 text-sm">故事不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事详情" showBack onBack={() => router.back()} />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 故事信息卡 */}
        <div className="px-4 pt-4 pb-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]"
          >
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold text-white/90">{story.title}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-3">{story.worldview}</p>
            <div className="bg-xh-gold/5 rounded-lg p-2.5 border border-xh-gold/10 mb-3">
              <p className="text-[10px] text-xh-gold/60 mb-0.5">核心冲突</p>
              <p className="text-xs text-white/70">{story.conflict}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/50">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                导演: {story.director.name || '匿名'}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {story._count.messages} 条对白
              </span>
            </div>
          </motion.div>
        </div>

        {/* 角色列表 */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white/80">角色列表</h3>
            <span className="text-[10px] text-white/40">
              {story.roles.filter((r) => r.claimedBy).length}/{story.roles.length} 已认领
            </span>
          </div>

          <div className="space-y-2">
            {story.roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl p-3 border transition-all ${
                  role.claimedBy
                    ? 'bg-emerald-500/5 border-emerald-500/10'
                    : 'bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white/90">{role.name}</span>
                      {role.claimedBy ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                          <UserCheck className="w-3 h-3" />
                          已认领
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/50">待认领</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40">{role.description}</p>
                    {role.claimedBy && role.user && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-xh-gold/20 flex items-center justify-center text-[9px] text-xh-gold">
                          {role.user.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[10px] text-white/50">{role.user.name || '匿名演员'}</span>
                        {role.claimReason && (
                          <span className="text-[10px] text-white/50 truncate">· {role.claimReason}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!role.claimedBy && story.status === 'recruiting' && (
                    <button
                      onClick={() => setClaimingRole(role)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-xh-gold/15 text-xh-gold text-xs font-medium hover:bg-xh-gold/25 transition-colors"
                    >
                      认领
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 进入对白室按钮 */}
        {(allClaimed || story.status === 'ongoing') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-6"
          >
            <button
              onClick={() => router.push(`/story-hall/${storyId}/room`)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 press-feedback"
            >
              <Sparkles className="w-5 h-5" />
              {story.status === 'recruiting' ? '角色已满，进入对白室' : '进入对白室'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {!allClaimed && story.status === 'recruiting' && (
          <div className="px-4 pb-6">
            <div className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Lock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/50">所有角色被认领后解锁对白室</span>
            </div>
          </div>
        )}
      </div>

      {claimingRole && (
        <ClaimRoleModal
          roleName={claimingRole.name}
          roleDescription={claimingRole.description}
          storyId={storyId}
          roleId={claimingRole.id}
          onClose={() => setClaimingRole(null)}
          onClaimed={loadStory}
        />
      )}
    </div>
  );
}
