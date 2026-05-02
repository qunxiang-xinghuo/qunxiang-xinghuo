'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Sparkles, MessageSquare, ArrowRight, UserCheck,
  Lock, Check, X, Clock, Play, Shield, UserCircle, Tag, PenTool
} from 'lucide-react';
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

const statusConfig: Record<string, { text: string; color: string; bg: string; border: string; icon: any }> = {
  recruiting: { text: '招募中', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Users },
  ongoing: { text: '进行中', color: 'text-xh-gold', bg: 'bg-xh-gold/10', border: 'border-xh-gold/20', icon: Clock },
  completed: { text: '已完成', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: MessageSquare },
};

const claimConfig: Record<string, { text: string; color: string; bg: string; border: string; icon: any }> = {
  unclaimed: { text: '待认领', color: 'text-slate-500', bg: 'bg-slate-700/20', border: 'border-slate-600/20', icon: UserCircle },
  pending: { text: '审核中', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
  approved: { text: '已通过', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Check },
  rejected: { text: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: X },
};

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingRole, setClaimingRole] = useState<StoryRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('xh_user_id') || '');
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

  useEffect(() => { loadStory(); }, [loadStory]);

  const isDirector = story?.director.id === currentUserId;
  const allApproved = story ? story.roles.every((r) => r.claimStatus === 'approved') : false;
  const pendingRoles = story ? story.roles.filter((r) => r.claimStatus === 'pending' && r.claimedBy) : [];
  const sc = story ? statusConfig[story.status] || statusConfig.recruiting : statusConfig.recruiting;
  const StatusIcon = sc.icon;

  const handleReview = async (roleId: string, action: 'approve' | 'reject') => {
    setReviewing(roleId);
    try {
      const res = await fetch(`/api/stories/${storyId}/roles/${roleId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (result.success) loadStory();
    } catch {}
    setReviewing(null);
  };

  const handleStartStory = async () => {
    if (!allApproved) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/start`, { method: 'POST' });
      const result = await res.json();
      if (result.success) loadStory();
    } catch {}
    setStarting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="故事详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="故事详情" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500 text-sm">故事不存在</p>
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/20"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <h2 className="text-lg font-bold text-slate-100">{story.title}</h2>
              <span className={`flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.color} ${sc.border}`}>
                <StatusIcon size={10} />
                {sc.text}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{story.worldview}</p>

            <div className="bg-gradient-to-r from-xh-gold/8 to-orange-500/5 rounded-xl p-3 border border-xh-gold/15 mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-xh-gold/70" />
                <span className="text-[10px] text-xh-gold/70 font-medium uppercase tracking-wider">核心冲突</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{story.conflict}</p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-slate-500" />
                导演: <span className="text-slate-400">{story.director.name || '匿名'}</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} className="text-slate-500" />
                {story._count.messages} 条对白
              </span>
            </div>
          </motion.div>
        </div>

        {/* 角色列表 */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">角色列表</h3>
            <span className="text-[11px] text-slate-600 font-medium">
              {story.roles.filter((r) => r.claimStatus === 'approved').length}/{story.roles.length} 已通过
            </span>
          </div>

          <div className="space-y-2.5">
            {story.roles.map((role, index) => {
              const cs = claimConfig[role.claimStatus] || claimConfig.unclaimed;
              const CSIcon = cs.icon;
              const isMyClaim = role.claimedBy === currentUserId;
              const canClaim = !role.claimedBy && story.status === 'recruiting' && role.claimStatus === 'unclaimed';

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`rounded-xl p-3.5 border transition-all duration-300 ${
                    role.claimStatus === 'approved'
                      ? 'bg-emerald-500/[0.04] border-emerald-500/15'
                      : role.claimStatus === 'pending'
                      ? 'bg-amber-500/[0.04] border-amber-500/15'
                      : role.claimStatus === 'rejected'
                      ? 'bg-red-500/[0.04] border-red-500/15'
                      : 'bg-slate-800/30 border-slate-700/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-slate-100">{role.name}</span>
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${cs.bg} ${cs.color} ${cs.border}`}>
                          <CSIcon size={10} />
                          {cs.text}
                        </span>
                        {isMyClaim && role.claimStatus === 'pending' && (
                          <span className="text-[10px] text-amber-400 font-medium">· 我的申请</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{role.description}</p>

                      {role.claimedBy && role.user && (
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-xh-gold/30 to-orange-500/20 flex items-center justify-center text-[9px] text-xh-gold font-bold border border-xh-gold/20">
                              {role.user.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[11px] text-slate-400">{role.user.name || '匿名演员'}</span>
                          </div>
                          {role.identityTag && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Tag size={10} className="text-slate-600" />
                              身份: <span className="text-slate-400">{role.identityTag}</span>
                            </p>
                          )}
                          {role.performanceDirection && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <PenTool size={10} className="text-slate-600" />
                              演绎: <span className="text-slate-400">{role.performanceDirection}</span>
                            </p>
                          )}
                          {role.claimReason && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-500">
                              <UserCheck size={10} className="text-slate-600" />
                              理由: <span className="text-slate-400">{role.claimReason}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {canClaim && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setClaimingRole(role)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-xh-gold/15 text-xh-gold text-xs font-medium hover:bg-xh-gold/25 transition-colors border border-xh-gold/20"
                      >
                        认领
                      </motion.button>
                    )}
                  </div>

                  {/* 导演审核按钮 */}
                  {isDirector && role.claimStatus === 'pending' && role.claimedBy && (
                    <div className="mt-2.5 flex items-center gap-2 pt-2.5 border-t border-slate-700/20">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReview(role.id, 'approve')}
                        disabled={reviewing === role.id}
                        className="flex-1 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-emerald-500/20"
                      >
                        <Check size={14} />
                        通过
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReview(role.id, 'reject')}
                        disabled={reviewing === role.id}
                        className="flex-1 py-2 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-red-500/20"
                      >
                        <X size={14} />
                        拒绝
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 导演待审核汇总 */}
        {isDirector && pendingRoles.length > 0 && story.status === 'recruiting' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-3">
            <div className="bg-amber-500/[0.04] rounded-xl p-3.5 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  待审核申请 ({pendingRoles.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">通过所有角色的审核后，即可启动故事</p>
            </div>
          </motion.div>
        )}

        {/* 启动故事按钮 */}
        {isDirector && allApproved && story.status === 'recruiting' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStartStory}
              disabled={starting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
            </motion.button>
            <p className="text-[11px] text-slate-600 text-center mt-2">所有角色已通过审核，点击启动进入对白室</p>
          </motion.div>
        )}

        {/* 进入对白室 */}
        {story.status === 'ongoing' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-6">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/story-hall/${storyId}/room`)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-bold shadow-lg shadow-xh-gold/20 hover:shadow-xl hover:shadow-xh-gold/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              进入对白室
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}

        {/* 锁定提示 */}
        {story.status === 'recruiting' && !allApproved && (
          <div className="px-4 pb-6">
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20">
              <Lock className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500">所有角色审核通过后，导演可启动故事</span>
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
