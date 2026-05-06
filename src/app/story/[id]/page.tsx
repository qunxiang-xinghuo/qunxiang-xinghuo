'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Users, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StoryRole {
  id: string;
  name: string;
  openingInfo: string;
  description: string;
  claimed: boolean;
}

interface StoryDetail {
  id: string;
  title: string;
  eraBackground: string;
  storySummary: string;
  act1Reveal: string;
  maxCharacters: number;
  roles: StoryRole[];
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const { user: authUser } = useAuth();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // 等待匹配弹窗状态
  const [showWaiting, setShowWaiting] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(15);
  const [matchResult, setMatchResult] = useState<'waiting' | 'matched' | 'timeout'>('waiting');
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/stories/${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStory(data.data);
      })
      .catch((e) => console.error('[StoryDetail] 加载失败:', e))
      .finally(() => setLoading(false));
  }, [storyId]);

  // 倒计时逻辑
  useEffect(() => {
    if (!showWaiting || matchResult !== 'waiting') return;
    timerRef.current = setInterval(() => {
      setWaitingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setMatchResult('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showWaiting, matchResult]);

  const handleSelectRole = async (roleId: string) => {
    if (!authUser) return;
    setSelectedRoleId(roleId);
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.status === 'matched') {
          setMatchedRoomId(data.data.roomId);
          setMatchResult('matched');
          setShowWaiting(true);
        } else {
          setMatchResult('waiting');
          setWaitingSeconds(15);
          setShowWaiting(true);
        }
      }
    } catch (e) {
      console.error('[StoryDetail] 加入失败:', e);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinAi = async () => {
    if (!selectedRoleId || !authUser) return;
    setJoinLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/join-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });
      const data = await res.json();
      if (data.success && data.data?.roomId) {
        router.push(`/room/${data.data.roomId}`);
      }
    } catch (e) {
      console.error('[StoryDetail] AI加入失败:', e);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleContinueWaiting = () => {
    setMatchResult('waiting');
    setWaitingSeconds(15);
  };

  const handleEnterRoom = () => {
    if (matchedRoomId) router.push(`/room/${matchedRoomId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在加载故事...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <p className="text-sm text-white/30">故事不存在</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#e2b04a] truncate">{story.title}</h1>
            <p className="text-[11px] text-[#e2b04a]/50 truncate">{story.eraBackground}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 pt-4">
        {/* 故事简介 */}
        <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/50 leading-relaxed">{story.storySummary}</p>
        </div>

        {/* 起（公开可见） */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#e2b04a]/60">起</span>
            <span className="text-[10px] text-white/20">已解锁</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{story.act1Reveal}</p>
        </div>

        {/* 承转合（锁住） */}
        {['承', '转', '合'].map((label, i) => (
          <div key={label} className="mb-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 opacity-40">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3 h-3 text-white/20" />
              <span className="text-xs font-bold text-white/20">{label}</span>
            </div>
            <p className="text-xs text-white/15">{i === 2 ? '最终谜底' : '对话中逐步解锁...'}</p>
          </div>
        ))}

        {/* 角色选择 */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#e2b04a]" />
            <h2 className="text-sm font-semibold text-white/90">选择角色</h2>
          </div>
          <div className="space-y-2">
            {story.roles.map((role) => (
              <button
                key={role.id}
                onClick={() => !role.claimed && handleSelectRole(role.id)}
                disabled={role.claimed || joinLoading}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  role.claimed
                    ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                    : selectedRoleId === role.id
                      ? 'bg-[#e2b04a]/10 border-[#e2b04a]/30'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white/80">{role.name}</span>
                  {role.claimed && (
                    <span className="text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded-full">已被选</span>
                  )}
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">{role.openingInfo}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 等待匹配弹窗 */}
      <AnimatePresence>
        {showWaiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => {}}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 p-6 rounded-2xl bg-[#1a1a2e] border border-white/10 max-w-[320px] w-full text-center"
            >
              {matchResult === 'waiting' && (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-[#e2b04a]/30 border-t-[#e2b04a] animate-spin mx-auto mb-4" />
                  <p className="text-base font-semibold text-white/90 mb-1">正在匹配搭档...</p>
                  <p className="text-sm text-white/40 mb-4">{waitingSeconds} 秒后揭晓</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#e2b04a]/50 rounded-full transition-all duration-1000"
                      style={{ width: `${(waitingSeconds / 15) * 100}%` }}
                    />
                  </div>
                </>
              )}

              {matchResult === 'matched' && (
                <>
                  <Sparkles className="w-8 h-8 text-[#e2b04a] mx-auto mb-3" />
                  <p className="text-base font-semibold text-white/90 mb-1">匹配成功！</p>
                  <p className="text-sm text-white/40 mb-4">找到你的对戏搭档了</p>
                  <button
                    onClick={handleEnterRoom}
                    className="w-full py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm font-medium border border-[#e2b04a]/25 hover:bg-[#e2b04a]/25 transition-colors"
                  >
                    进入对白室
                  </button>
                </>
              )}

              {matchResult === 'timeout' && (
                <>
                  <MessageCircle className="w-8 h-8 text-[#e2b04a]/60 mx-auto mb-3" />
                  <p className="text-base font-semibold text-white/90 mb-1">暂时没有找到真人搭档</p>
                  <p className="text-sm text-white/40 mb-1">要让刘看山陪你玩吗？</p>
                  <p className="text-xs text-white/25 mb-4">刘看山会扮演另一个角色，和你一起解开这个故事。</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleJoinAi}
                      disabled={joinLoading}
                      className="w-full py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm font-medium border border-[#e2b04a]/25 hover:bg-[#e2b04a]/25 transition-colors"
                    >
                      {joinLoading ? '创建中...' : '🦊 和刘看山玩'}
                    </button>
                    <button
                      onClick={handleContinueWaiting}
                      className="w-full py-2.5 rounded-xl bg-white/[0.03] text-white/40 text-sm border border-white/5 hover:bg-white/[0.06] transition-colors"
                    >
                      继续等待
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
