'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

const MATCH_TIMEOUT = 10;
const POLL_INTERVAL = 2000;

type MatchStatus = 'matching' | 'matched' | 'ai' | 'exiting';

function DuoWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('matching');
  const [matchData, setMatchData] = useState<any>(null);

  // 轮询匹配状态
  const pollMatchStatus = useCallback(async () => {
    if (!matchId || status !== 'matching') return false;

    try {
      const res = await fetch(`/api/match/${matchId}`);
      const result = await res.json();

      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);

        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          setTimeout(() => {
            router.push(`/room/${data.roomId}`);
          }, 1000);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [matchId, status, router]);

  // 10秒倒计时 + 轮询
  useEffect(() => {
    if (!matchId) {
      router.push('/duo-match');
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        if (next >= MATCH_TIMEOUT) {
          clearInterval(timer);
          // 10秒结束，跳转到超时选择页
          router.push(`/duo-timeout?matchId=${matchId}&round=1`);
        }
        return next;
      });
    }, 1000);

    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus();
      if (shouldStop) {
        clearInterval(pollTimer);
        clearInterval(timer);
      }
    }, POLL_INTERVAL);

    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, [matchId, router, pollMatchStatus]);

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="寻找搭档" showBack />

      {/* 中央区域：刘看山 + 匹配状态 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* 刘看山形象 */}
        <motion.div
          className="w-24 h-24 rounded-full relative mb-8"
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
              className="text-center"
            >
              <p className="text-base font-medium text-white/90 mb-3">
                刘看山正在为你寻找对撞人…
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
