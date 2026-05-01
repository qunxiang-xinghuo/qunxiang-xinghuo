'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

const MATCH_TIMEOUT = 10;
const POLL_INTERVAL = 2000;
const MATCH_DELAY = 1000; // v4.6: 页面渲染后延迟1秒再发起匹配请求

interface BrainholeInfo {
  id: string;
  title: string;
  scenario: string;
}

type MatchStatus = 'matching' | 'matched' | 'ai' | 'exiting';

function DuoWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // v4.6: brainholeId 从 URL 参数或 localStorage 获取
  const urlBrainholeId = searchParams.get('brainholeId');
  const urlRound = parseInt(searchParams.get('round') || '1', 10);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('matching');
  const [matchData, setMatchData] = useState<any>(null);
  const [brainholeInfo, setBrainholeInfo] = useState<BrainholeInfo | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string>('');

  const identityRef = useRef<string>('');
  const brainholeIdRef = useRef<string | undefined>(undefined);

  // v4.6: 轮询匹配状态
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

        // 显示匹配的脑洞信息
        if (data.room?.brainhole) {
          setBrainholeInfo(data.room.brainhole);
        }

        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          setTimeout(() => {
            router.push(`/room/${data.roomId}`);
          }, 1500);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.log('[DuoWaiting] 轮询失败:', err);
      return false;
    }
  }, [status, router]);

  // v4.6: 核心逻辑 - 页面加载后先渲染UI，延迟后再发起匹配
  useEffect(() => {
    // 检查身份是否丢失
    const savedIdentity = localStorage.getItem('xh_duo_identity');
    if (!savedIdentity) {
      console.log('[DuoWaiting] 身份丢失，跳回身份选择页');
      router.push('/duo-match');
      return;
    }
    identityRef.current = savedIdentity;

    // 获取 brainholeId（URL参数优先，其次localStorage）
    const savedBrainhole = localStorage.getItem('xh_duo_brainhole');
    brainholeIdRef.current = urlBrainholeId || savedBrainhole || undefined;
    console.log('[DuoWaiting] 准备匹配 - identity:', savedIdentity, 'brainholeId:', brainholeIdRef.current);

    // 延迟1秒后，在后台异步发起匹配请求
    const matchTimer = setTimeout(async () => {
      console.log('[DuoWaiting] 延迟结束，开始发起匹配请求...');
      try {
        const guestId = localStorage.getItem('xh_user_id');
        const body = {
          identity: savedIdentity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'quick',
          brainholeId: brainholeIdRef.current || undefined,
        };
        console.log('[DuoWaiting] POST /api/match, body:', JSON.stringify(body));

        const res = await fetch('/api/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(guestId ? { 'x-guest-id': guestId } : {}),
          },
          body: JSON.stringify(body),
        });

        const result = await res.json();
        console.log('[DuoWaiting] 匹配响应:', JSON.stringify(result));

        if (result.success && result.data?.matchId) {
          const mid = result.data.matchId;
          console.log('[DuoWaiting] 匹配请求创建成功, matchId:', mid);
          setMatchId(mid);
          localStorage.setItem('xh_duo_match_id', mid);
        } else {
          // 静默处理：记录日志但不阻塞UI
          console.warn('[DuoWaiting] 匹配请求未返回matchId:', result.message || '未知原因');
          setMatchError(result.message || '匹配请求未成功');
        }
      } catch (err: any) {
        // v4.6: 接口调用失败，静默处理，倒计时继续
        console.error('[DuoWaiting] 匹配请求异常:', err?.message || err);
        setMatchError(err?.message || '网络异常');
      }
    }, MATCH_DELAY);

    return () => clearTimeout(matchTimer);
  }, [router, urlBrainholeId]);

  // v4.6: 独立倒计时（无论匹配请求是否成功，倒计时都持续运行）
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        if (next >= MATCH_TIMEOUT) {
          clearInterval(timer);
          // 10秒结束，跳转到超时选择页
          const params = new URLSearchParams();
          if (matchId) params.set('matchId', matchId);
          params.set('round', String(urlRound));
          router.push(`/duo-timeout?${params.toString()}`);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [matchId, router, urlRound]);

  // v4.6: 轮询（只有在获得matchId后才开始）
  useEffect(() => {
    if (!matchId || status !== 'matching') return;

    console.log('[DuoWaiting] 开始轮询, matchId:', matchId);
    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus(matchId);
      if (shouldStop) {
        clearInterval(pollTimer);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollTimer);
  }, [matchId, status, pollMatchStatus]);

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="寻找搭档" showBack onBack={() => router.back()} />

      {/* 中央区域：刘看山 + 匹配状态 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* 刘看山形象 */}
        <motion.div
          className="w-24 h-24 rounded-full relative mb-6"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
            border: '2px solid #74b9ff',
            boxShadow: '0 0 24px #74b9ff40, inset -2px -2px 6px rgba(0,0,0,0.1)',
          }}
          animate={status === 'matching' ? { y: [0, -8, 0] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute -top-2.5 left-3 w-5 h-5 rounded-full bg-[#f5f5f5] border border-gray-200" />
          <div className="absolute -top-2.5 right-3 w-5 h-5 rounded-full bg-[#f5f5f5] border border-gray-200" />
          <div className="absolute inset-1 rounded-full bg-[#f5f5f5] flex items-center justify-center">
            <div className="flex gap-3 items-center mt-[-2px]">
              <div className="w-3.5 h-3.5 rounded-full bg-[#74b9ff]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#74b9ff]" />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-b-full bg-[#ff9f43]" />
          </div>
          <div className="absolute top-6 left-2 w-3.5 h-3 rounded-full bg-[#ffcccc] opacity-40" />
          <div className="absolute top-6 right-2 w-3.5 h-3 rounded-full bg-[#ffcccc] opacity-40" />
        </motion.div>

        {/* 状态文案 */}
        <AnimatePresence mode="wait">
          {status === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full"
            >
              {/* 显示匹配的脑洞 */}
              {brainholeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 px-4 py-2 rounded-xl bg-xh-gold/10 border border-xh-gold/20"
                >
                  <p className="text-[10px] text-xh-gold/60 mb-0.5">当前话题</p>
                  <p className="text-sm text-xh-gold font-medium truncate">{brainholeInfo.title}</p>
                </motion.div>
              )}

              <p className="text-base font-medium text-white/90 mb-3">
                刘看山正在为你寻找对撞人...
              </p>
              <p className="text-3xl font-bold text-xh-gold mb-3">
                {remaining} 秒
              </p>
              <div className="w-60 h-2 bg-white/10 rounded-full overflow-hidden mb-4 mx-auto">
                <motion.div
                  className="h-full bg-xh-gold rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* v4.6: 调试信息（仅在控制台可见，生产环境可隐藏） */}
              {matchError && (
                <p className="text-[10px] text-white/20 mb-2">
                  匹配请求处理中，请稍候...
                </p>
              )}

              <p className="text-xs text-white/30">
                已等待 {elapsedTime} 秒
              </p>
            </motion.div>
          )}

          {status === 'matched' && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {brainholeInfo && (
                <div className="mb-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400/60 mb-0.5">对撞话题</p>
                  <p className="text-sm text-emerald-400 font-medium">{brainholeInfo.title}</p>
                </div>
              )}
              <p className="text-lg font-medium text-emerald-400 mb-2">
                匹配成功！
              </p>
              <p className="text-xs text-white/40">
                正在进入对白实验室...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-4 text-center">
        <p className="text-[10px] text-white/20">
          优先真人匹配 · 超时可选 AI 对话
        </p>
      </div>
    </div>
  );
}

export default function DuoWaitingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoWaitingContent />
    </Suspense>
  );
}
