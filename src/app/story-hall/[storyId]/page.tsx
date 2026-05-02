'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, BookOpen, Sparkles, MessageSquare, ArrowRight, UserCheck, Lock, Check, X, Clock, Play } from 'lucide-react';
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
  claimStatus: string;
  identityTag: string | null;
  performanceDirection: string | null;
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
  minActors: number;
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

const claimStatusLabels: Record<string, { text: string; color: string; bg: string; border: string }> = {
  unclaimed: { text: '待认领', color: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10' },
  pending: { text: '审核中', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  approved: { text: '已通过', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rejected: { text: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingRole, setClaimingRole] = useState<StoryRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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
  const allApproved = story ? story.roles.every((r) => r.claimStatus === 'approved') : false;
  const pendingRoles = story ? story.roles.filter((r) => r.claimStatus === 'pending') : [];
  const statusInfo = story ? statusLabels[story.status] || statusLabels.recruiting : statusLabels.recruiting;

  const handleReview = async (roleId: string, action: 'approve' | 'reject') => {
    setReviewing(roleId);
    try {
      const res = await fetch(`/api/stories/${storyId}/roles/${roleId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (result.success) {
        loadStory();
      } else {
        alert(result.error?.message || '审核失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setReviewing(null);
    }
  };

  const handleStartStory = async () => {
    if (!allApproved) {
      alert('还有角色未通过审核');
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) {
        loadStory();
      } else {
        alert(result.error?.message || '启动失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setStarting(false);
    }
  };

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
              {story.roles.filter((r) => r.claimStatus === 'approved').length}/{story.roles.length} 已通过
            </span>
          </div>

          <div className="space-y-2">
            {story.roles.map((role, index) => {
              const cs = claimStatusLabels[role.claimStatus] || claimStatusLabels.pending;
              const isMyClaim = role.claimedBy === currentUserId;
              const canClaim = !role.claimedBy && story.status === 'recruiting';

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl p-3 border transition-all ${
                    role.claimStatus === 'approved'
                      ? 'bg-emerald-500/5 border-emerald-500/10'
                      : role.claimStatus === 'pending'
                      ? 'bg-amber-500/5 border-amber-500/10'
                      : role.claimStatus === 'rejected'
                      ? 'bg-red-500/5 border-red-500/10'
                      : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-white/90">{role.name}</span>
                        {role.claimedBy ? (
                        <span className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border ${cs.bg} ${cs.color} ${cs.border}`}>
                          {role.claimStatus === 'pending' && <Clock className="w-3 h-3" />}
                          {role.claimStatus === 'approved' && <UserCheck className="w-3 h-3" />}
                          {role.claimStatus === 'rejected' && <X className="w-3 h-3" />}
                          {cs.text}
                        </span>
                      ) : (
                        <span className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border ${cs.bg} ${cs.color} ${cs.border}`}>
                          {cs.text}
                        </span>
                      )}
                        {isMyClaim && role.claimStatus === 'pending' && (
                          <span className="text-[10px] text-amber-400">· 我的申请</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40">{role.description}</p>

                      {/* 认领者信息 */}
                      {role.claimedBy && role.user && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-xh-gold/20 flex items-center justify-center text-[9px] text-xh-gold">
                              {role.user.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[10px] text-white/50">{role.user.name || '匿名演员'}</span>
                          </div>
                          {role.identityTag && (
                            <p className="text-[10px] text-white/40">
                              <span className="text-white/30">身份标签：</span>{role.identityTag}
                            </p>
                          )}
                          {role.performanceDirection && (
                            <p className="text-[10px] text-white/40">
                              <span className="text-white/30">演绎方向：</span>{role.performanceDirection}
                            </p>
                          )}
                          {role.claimReason && (
                            <p className="text-[10px] text-white/40">
                              <span className="text-white/30">扮演理由：</span>{role.claimReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 认领按钮（未认领时） */}
                    {canClaim && role.claimStatus === 'unclaimed' && (
                      <button
                        onClick={() => setClaimingRole(role)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-xh-gold/15 text-xh-gold text-xs font-medium hover:bg-xh-gold/25 transition-colors"
                      >
                        认领
                      </button>
                    )}
                  </div>

                  {/* 导演审核按钮（待审核状态） */}
                  {isDirector && role.claimStatus === 'pending' && role.claimedBy && (
                    <div className="mt-2 flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleReview(role.id, 'approve')}
                        disabled={reviewing === role.id}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReview(role.id, 'reject')}
                        disabled={reviewing === role.id}
                        className="flex-1 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        拒绝
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 导演专属：待审核汇总面板 */}
        {isDirector && pendingRoles.length > 0 && story.status === 'recruiting' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-3"
          >
            <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  待审核申请 ({pendingRoles.length})
                </span>
              </div>
              <p className="text-[10px] text-white/40">
                通过所有角色的审核后，即可启动故事
              </p>
            </div>
          </motion.div>
        )}

        {/* 启动故事按钮（导演 + 所有角色已通过 + 招募中） */}
        {isDirector && allApproved && story.status === 'recruiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-4"
          >
            <button
              onClick={handleStartStory}
              disabled={starting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 press-feedback disabled:opacity-50"
            >
              {starting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  启动故事
                </>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-white/30 text-center mt-2">
              所有角色已通过审核，点击启动进入对白室
            </p>
          </motion.div>
        )}

        {/* 进入对白室按钮（进行中状态） */}
        {story.status === 'ongoing' && (
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
              进入对白室
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* 锁定提示（招募中但未启动） */}
        {story.status === 'recruiting' && !allApproved && (
          <div className="px-4 pb-6">
            <div className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Lock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/50">所有角色审核通过后，导演可启动故事</span>
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
