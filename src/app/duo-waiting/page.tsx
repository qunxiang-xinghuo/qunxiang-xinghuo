'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Sparkles, User, Bot, ArrowRight, RefreshCw, Copy, Check, Share2,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';

const MATCH_TIMEOUT = 15;
const POLL_INTERVAL = 2000;
const MATCH_DELAY = 800;

interface BrainholeInfo {
  id: string;
  title: string;
  scenario: string;
}

type MatchStatus = 'matching' | 'matched' | 'timeout';

function DuoWaitingContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const searchParams = useSearchParams();
  const urlBrainholeId = searchParams.get('brainholeId');

  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('matching');
  const [matchData, setMatchData] = useState<any>(null);
  const [brainholeInfo, setBrainholeInfo] = useState<BrainholeInfo | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string>('');
  const [creatingAiRoom, setCreatingAiRoom] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [showInvite, setShowInvite] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const identityRef = useRef<string>('');
  const brainholeIdRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pollMatchStatus = useCallback(async (currentMatchId: string) => {
    if (!currentMatchId || status !== 'matching') return false;
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch(`/api/match/${currentMatchId}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);
        if (data.room?.brainhole) setBrainholeInfo(data.room.brainhole);
        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          navTimeoutRef.current = setTimeout(() => router.push(`/room/${data.roomId}`), 1500);
          return true;
        }
      }
      return false;
    } catch { return false; }
  }, [status, router]);

  // 创建邀请房间
  const createInviteRoom = useCallback(async () => {
    setCreatingInvite(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const identity = identityRef.current;
      const res = await fetch('/api/rooms/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({
          brainholeId: brainholeIdRef.current,
          identity: identity || '我',
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.inviteCode) {
        setInviteCode(result.data.inviteCode);
        setShowInvite(true);
      }
    } catch (err) {
      console.error('创建邀请房间失败:', err);
    } finally {
      setCreatingInvite(false);
    }
  }, []);

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  // 创建AI房间
  const createAiRoom = useCallback(async () => {
    setCreatingAiRoom(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const identity = identityRef.current;
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({
          brainholeId: brainholeIdRef.current,
          identity: identity || '我',
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.roomId) {
        router.push(`/room/${result.data.roomId}`);
      } else {
        setMatchError('创建AI房间失败，请重试');
        setCreatingAiRoom(false);
      }
    } catch (err) {
      setMatchError('网络异常，请重试');
      setCreatingAiRoom(false);
    }
  }, [router]);

  // 清理所有timeout
  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  // 初始化匹配
  useEffect(() => {
    const savedIdentity = localStorage.getItem('xh_duo_identity');
    if (!savedIdentity) { router.push('/duo-match'); return; }
    identityRef.current = savedIdentity;
    const savedBrainhole = localStorage.getItem('xh_duo_brainhole');
    brainholeIdRef.current = urlBrainholeId || savedBrainhole || undefined;

    if (brainholeIdRef.current) {
      fetch(`/api/brainholes/${brainholeIdRef.current}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setBrainholeInfo({ id: res.data.id, title: res.data.title, scenario: res.data.scenario });
          }
        })
        .catch(() => {});
    }

    const matchTimer = setTimeout(async () => {
      try {
        const guestId = localStorage.getItem('xh_user_id');
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
          body: JSON.stringify({
            identity: savedIdentity, preferDifferent: true, timeoutMinutes: 1, mode: 'quick',
            brainholeId: brainholeIdRef.current || undefined,
          }),
        });
        const result = await res.json();
        if (result.success && result.data?.matchId) {
          const mid = result.data.matchId;
          setMatchId(mid);
          localStorage.setItem('xh_duo_match_id', mid);
          if (result.data.status === 'matched' && result.data.roomId) {
            setStatus('matched');
            if (result.data.brainholeTitle && !brainholeInfo) {
              setBrainholeInfo({ id: result.data.brainholeId || '', title: result.data.brainholeTitle, scenario: '' });
            }
            navTimeoutRef.current = setTimeout(() => router.push(`/room/${result.data.roomId}`), 1500);
          }
        } else {
          setMatchError(result.message || '匹配请求未成功');
        }
      } catch (err: any) {
        setMatchError(err?.message || '网络异常');
      }
    }, MATCH_DELAY);
    return () => clearTimeout(matchTimer);
  }, [router, urlBrainholeId]);

  // 倒计时
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        if (next >= MATCH_TIMEOUT) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStatus('timeout');
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 轮询匹配状态
  useEffect(() => {
    if (!matchId || status !== 'matching') return;
    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus(matchId);
      if (shouldStop) clearInterval(pollTimer);
    }, POLL_INTERVAL);
    return () => clearInterval(pollTimer);
  }, [matchId, status, pollMatchStatus]);

  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="双人对白" showBack onBack={() => router.back()} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">
        {/* 简化的雷达扫描 */}
        {status === 'matching' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-40 h-40 rounded-full border border-[#e2b04a]/20"
            />
          </div>
        )}

        {/* 刘看山 */}
        <motion.div
          initial={mounted ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative z-10 mb-6"
        >
          <LiuKanshanAvatar size="lg" animate emotion={status === 'matched' ? 'happy' : 'thinking'} />
        </motion.div>

        <AnimatePresence mode="wait">
          {/* 匹配中 —— 简化版 */}
          {status === 'matching' && (
            <motion.div
              key="matching"
              initial={mounted ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center w-full relative z-10"
            >
              {brainholeInfo && (
                <motion.div
                  initial={mounted ? { opacity: 0, y: -10 } : false} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 mx-auto max-w-xs card-elevated p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-[#e2b04a]" />
                    <span className="text-[10px] text-[#e2b04a]/70 font-medium">对撞话题</span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium truncate">{brainholeInfo.title}</p>
                </motion.div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Radar className="w-4 h-4 text-[#e2b04a] animate-pulse" />
                  <p className="text-base font-medium text-slate-100">正在匹配中...</p>
                </div>
                <p className="text-xs text-slate-500">刘看山正在帮你找人</p>
              </div>

              <div className="mb-4">
                <p className="text-4xl font-bold text-[#e2b04a] mb-2">{remaining}</p>
                <div className="w-64 h-2 bg-slate-700/30 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#e2b04a] to-orange-400"
                    style={{ width: `${((MATCH_TIMEOUT - remaining) / MATCH_TIMEOUT) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* 邀请好友按钮 */}
              {!showInvite && (
                <button
                  onClick={createInviteRoom}
                  disabled={creatingInvite}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-xs hover:bg-white/[0.06] active:scale-[0.97] transition-all"
                >
                  {creatingInvite ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Share2 className="w-3 h-3" />
                      邀请好友
                    </>
                  )}
                </button>
              )}

              {/* 邀请码展示 */}
              {showInvite && inviteCode && (
                <motion.div
                  initial={mounted ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <p className="text-[10px] text-emerald-400/70 mb-1">房间号（分享给好友）</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-400 tracking-widest">{inviteCode}</span>
                    <button
                      onClick={copyInviteCode}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400/70" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 匹配成功 */}
          {status === 'matched' && (
            <motion.div
              key="matched"
              initial={mounted ? { opacity: 0, scale: 0.9 } : false} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center relative z-10"
            >
              <motion.div
                initial={mounted ? { scale: 0 } : false} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
              >
                <User className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <p className="text-lg font-bold text-emerald-400 mb-2">匹配成功！</p>
              <p className="text-xs text-slate-500">正在进入对白室...</p>
            </motion.div>
          )}

          {/* 超时 → 刘看山AI */}
          {status === 'timeout' && (
            <motion.div
              key="timeout"
              initial={mounted ? { opacity: 0, y: 20 } : false} animate={{ opacity: 1, y: 0 }}
              className="text-center w-full relative z-10"
            >
              {brainholeInfo && (
                <motion.div
                  initial={mounted ? { opacity: 0, y: -10 } : false} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 mx-auto max-w-xs card-elevated p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-[#e2b04a]" />
                    <span className="text-[10px] text-[#e2b04a]/70 font-medium">对撞话题</span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium truncate">{brainholeInfo.title}</p>
                </motion.div>
              )}

              <p className="text-base font-semibold text-white/80 mb-1">暂时没找到匹配的人</p>
              <p className="text-xs text-white/40 mb-6">刘看山已经准备好了，随时陪你聊</p>

              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={createAiRoom}
                  disabled={creatingAiRoom}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/30 text-[#e2b04a] text-sm font-medium hover:from-[#e2b04a]/30 hover:to-orange-500/30 active:scale-[0.97] transition-all"
                >
                  {creatingAiRoom ? (
                    <div className="w-4 h-4 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      与刘看山对话
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStatus('matching');
                    setElapsedTime(0);
                    setMatchError('');
                    const savedIdentity = localStorage.getItem('xh_duo_identity');
                    if (savedIdentity) {
                      const guestId = localStorage.getItem('xh_user_id');
                      fetch('/api/match', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
                        body: JSON.stringify({
                          identity: savedIdentity, preferDifferent: true, timeoutMinutes: 1, mode: 'quick',
                          brainholeId: brainholeIdRef.current || undefined,
                        }),
                      }).then(r => r.json()).then(result => {
                        if (result.success && result.data?.matchId) {
                          setMatchId(result.data.matchId);
                          localStorage.setItem('xh_duo_match_id', result.data.matchId);
                        }
                      }).catch(() => {});
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  再次尝试匹配
                </button>
              </div>

              {matchError && (
                <p className="text-[11px] text-red-400/60 mt-4">{matchError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部 */}
      <div className="px-6 py-4 text-center shrink-0">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
          <span>已等待 {elapsedTime} 秒</span>
          <span>|</span>
          <span className="text-[#e2b04a]/60">v6.0 双人对白</span>
        </div>
      </div>
    </div>
  );
}

export default function DuoWaitingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-[#e2b04a] rounded-full animate-spin" />
      </div>
    }>
      <DuoWaitingContent />
    </Suspense>
  );
}
