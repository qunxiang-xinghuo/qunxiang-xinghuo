'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Users, Clock, Sparkles, MessageCircle, X, Dices, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StoryRole {
  id: string;
  name: string;
  openingInfo: string;
  description: string;
  claimedBy: string | null;
  claimStatus: string;
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const router = useRouter();
  const storyId = params.id as string;
  const { user: authUser } = useAuth();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // 等待匹配弹窗状态
  const [showWaiting, setShowWaiting] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(10);
  const [matchResult, setMatchResult] = useState<'waiting' | 'matched' | 'timeout'>('waiting');
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInProgress = useRef(false);

  // v8.0-fix: 添加 AbortController + isMountedRef 防止卸载后 setState
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    const ctrl = new AbortController();
    fetch(`/api/stories/${storyId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (isMountedRef.current && data.success) setStory(data.data);
      })
      .catch((e) => { if (e.name !== 'AbortError') console.error('[StoryDetail] 加载失败:', e); })
      .finally(() => { if (isMountedRef.current) setLoading(false); });
    return () => {
      isMountedRef.current = false;
      ctrl.abort();
    };
  }, [storyId]);

  // 倒计时逻辑 + 轮询检查匹配状态
  useEffect(() => {
    if (!showWaiting || matchResult !== 'waiting') return;
    // 倒计时
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
    // 轮询检查匹配状态（每3秒）— 防重复调用
    pollRef.current = setInterval(async () => {
      if (!selectedRoleId || !storyId || pollInProgress.current) return;
      pollInProgress.current = true;
      try {
        const res = await fetch(`/api/stories/${storyId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedRoleId }),
        });
        const data = await res.json();
        if (data.success && data.data?.status === 'matched') {
          setMatchedRoomId(data.data.roomId);
          setMatchResult('matched');
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {} finally {
        pollInProgress.current = false;
      }
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showWaiting, matchResult, selectedRoleId, storyId]);

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
      if (!isMountedRef.current) return;
      if (data.success) {
        if (data.data?.status === 'matched') {
          setMatchedRoomId(data.data.roomId);
          setMatchResult('matched');
          setShowWaiting(true);
        } else {
          setMatchResult('waiting');
          setWaitingSeconds(10);
          setShowWaiting(true);
        }
      } else {
        // v8.0-fix: 处理 API 错误（如角色已被选 409）
        const msg = data.error?.message || '加入失败';
        console.error('[StoryDetail] 加入失败:', msg);
        alert(msg);
        setSelectedRoleId(null);
      }
    } catch (e) {
      console.error('[StoryDetail] 加入失败:', e);
      alert('网络异常，请重试');
      setSelectedRoleId(null);
    } finally {
      if (isMountedRef.current) setJoinLoading(false);
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
      if (!isMountedRef.current) return;
      if (data.success && data.data?.roomId) {
        router.push(`/room/${data.data.roomId}`);
      } else {
        const msg = data.error?.message || '创建AI房间失败';
        console.error('[StoryDetail] AI加入失败:', msg);
        alert(msg);
      }
    } catch (e) {
      console.error('[StoryDetail] AI加入失败:', e);
      alert('网络异常，请重试');
    } finally {
      if (isMountedRef.current) setJoinLoading(false);
    }
  };

  const handleContinueWaiting = () => {
    setMatchResult('waiting');
    setWaitingSeconds(10);
  };

  const handleRandomRole = () => {
    if (!story || joinLoading) return;
    const availableRoles = story.roles.filter((r) => !r.claimedBy);
    if (availableRoles.length === 0) return;
    const randomRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];
    handleSelectRole(randomRole.id);
  };

  const handleCloseWaiting = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    setShowWaiting(false);
    setMatchResult('waiting');
    setSelectedRoleId(null);
  };

  const handleEnterRoom = () => {
    if (matchedRoomId) router.push(`/room/${matchedRoomId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#8a9ab0]/30 border-t-[#3B82F6] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在打开这个故事...</p>
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
            <p className="text-[10px] text-[#D4B830]/60 mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {story.eraBackground}
            </p>
            <h1 className="text-base font-bold text-white/90 truncate">{story.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 pt-4">
        {/* 故事氛围 */}
        <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-[#D4B830]/10" />
          <p className="text-xs text-white/40 leading-relaxed mb-3">{story.storySummary}</p>
          <div className="border-t border-white/5 pt-3">
            <p className="text-sm text-white/55 leading-relaxed italic">{story.act1Reveal}</p>
          </div>
        </div>

        {/* 角色选择 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4B830]" />
              <h2 className="text-sm font-semibold text-white/90">🎭 选择你的身份</h2>
            </div>
            <button
              onClick={handleRandomRole}
              disabled={joinLoading || story.roles.every((r) => !!r.claimedBy)}
              className="flex items-center gap-1 text-[11px] text-[#8a9ab0]/50 hover:text-[#3B82F6]/70 transition-colors disabled:opacity-20"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>🎲 交给命运</span>
            </button>
          </div>
          <div className="space-y-2">
            {story.roles.map((role) => {
              const isExpanded = expandedRoleId === role.id;
              return (
                <div
                  key={role.id}
                  className={`w-full text-left rounded-xl border transition-all ${
                    !!role.claimedBy
                      ? 'bg-white/[0.02] border-white/5 opacity-40'
                      : selectedRoleId === role.id
                        ? 'bg-[#D4B830]/8 border-[#D4B830]/40 shadow-[0_0_12px_rgba(212,184,48,0.08)]'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  <button
                    onClick={() => !role.claimedBy && handleSelectRole(role.id)}
                    disabled={!!role.claimedBy || joinLoading}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {role.name.includes('船') || role.name.includes('工') || role.name.includes('匠') ? '⚓' :
                           role.name.includes('探') || role.name.includes('密') || role.name.includes('谍') ? '🕵️' :
                           role.name.includes('女') || role.name.includes('孙') || role.name.includes('娘') ? '👧' :
                           role.name.includes('算') || role.name.includes('道') || role.name.includes('仙') ? '🔮' :
                           role.name.includes('将') || role.name.includes('兵') || role.name.includes('武') ? '⚔️' :
                           role.name.includes('商') || role.name.includes('掌柜') || role.name.includes('贩') ? '💰' :
                           role.name.includes('书') || role.name.includes('文') || role.name.includes('生') ? '📜' :
                           role.name.includes('医') || role.name.includes('大夫') ? '🏥' :
                           role.name.includes('厨') || role.name.includes('食') ? '🍳' :
                           role.name.includes('僧') || role.name.includes('佛') || role.name.includes('尼') ? '🧘' : '👤'}
                        </span>
                        <span className="text-sm font-medium text-white/80">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.claimedBy && (
                          <span className="text-[10px] text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded-full">已被选</span>
                        )}
                        {role.description && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedRoleId(isExpanded ? null : role.id); }}
                            className="flex items-center gap-0.5 text-[10px] text-white/20 hover:text-[#D4B830]/60 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                          >
                            <span>人物小传</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-white/35 leading-relaxed">{role.openingInfo}</p>
                  </button>
                  {isExpanded && role.description && (
                    <motion.div
                      initial={mounted ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-3 pb-3"
                    >
                      <p className="text-[11px] text-white/25 leading-relaxed border-t border-white/5 pt-2">
                        {role.description}
                      </p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
          {/* 选角反馈 */}
          {selectedRoleId && (
            <motion.div
              initial={mounted ? { opacity: 0, y: 5 } : false}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-[#D4B830]/5 border border-[#D4B830]/15 text-center"
            >
              <p className="text-xs text-[#D4B830]/70">
                你选择了 <span className="font-semibold text-[#D4B830]">{story.roles.find(r => r.id === selectedRoleId)?.name}</span>。准备进入故事了吗？
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* 全局加载遮罩 */}
      {joinLoading && (
        <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-2 border-[#D4B830]/30 border-t-[#3B82F6] rounded-full animate-spin mb-3" />
            <p className="text-sm text-white/50">正在进入对白...</p>
          </div>
        </div>
      )}

      {/* 等待匹配弹窗 */}
      <AnimatePresence>
        {showWaiting && (
          <motion.div
            initial={mounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => {}}
          >
            <motion.div
              initial={mounted ? { scale: 0.9, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mx-4 p-6 rounded-2xl bg-[#1a1a2e] border border-white/10 max-w-[320px] w-full text-center"
            >
              {matchResult === 'waiting' && (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-[#8a9ab0]/30 border-t-[#3B82F6] animate-spin mx-auto mb-4" />
                  <p className="text-base font-semibold text-white/90 mb-1">🎭 正在寻找你的对戏搭档...</p>
                  <p className="text-sm text-white/40 mb-4">{waitingSeconds} 秒后揭晓</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-4">
                    <div
                      className="h-full bg-[#8a9ab0]/50 rounded-full transition-all duration-1000"
                      style={{ width: `${(waitingSeconds / 10) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={handleCloseWaiting}
                    className="text-xs text-white/20 hover:text-white/40 transition-colors"
                  >
                    ❌ 关闭，重新选择
                  </button>
                </>
              )}

              {matchResult === 'matched' && (
                <>
                  <Sparkles className="w-8 h-8 text-[#D4B830] mx-auto mb-3" />
                  <p className="text-base font-semibold text-white/90 mb-1">✨ 命运让你们相遇了</p>
                  <p className="text-sm text-white/40 mb-4">TA已经准备好了</p>
                  <button
                    onClick={handleEnterRoom}
                    className="w-full py-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] text-sm font-medium border border-[#3B82F6]/25 hover:bg-[#3B82F6]/25 transition-colors"
                  >
                    ⚔️ 进入对白
                  </button>
                </>
              )}

              {matchResult === 'timeout' && (
                <>
                  <MessageCircle className="w-8 h-8 text-[#D4B830]/60 mx-auto mb-3" />
                  <p className="text-base font-semibold text-white/90 mb-1">🌙 夜色已深，真人演员还在路上</p>
                  <p className="text-sm text-white/40 mb-1">让刘看山陪你演一场？</p>
                  <p className="text-xs text-white/25 mb-4">他会化身故事中的角色，陪你走完这段旅程。</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleJoinAi}
                      disabled={joinLoading}
                      className="w-full py-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] text-sm font-medium border border-[#3B82F6]/25 hover:bg-[#3B82F6]/25 transition-colors"
                    >
                      {joinLoading ? '准备场景中...' : '🦊 让刘看山陪你演'}
                    </button>
                    <button
                      onClick={handleContinueWaiting}
                      className="w-full py-2.5 rounded-xl bg-white/[0.03] text-white/40 text-sm border border-white/5 hover:bg-white/[0.06] transition-colors"
                    >
                      ⏳ 再等等
                    </button>
                    <button
                      onClick={handleCloseWaiting}
                      className="w-full py-2.5 rounded-xl bg-white/[0.03] text-white/30 text-sm border border-white/5 hover:bg-white/[0.06] transition-colors"
                    >
                      🔙 换个角色试试
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
