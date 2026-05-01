'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

const MATCH_TIMEOUT = 60; // 1分钟
const POLL_INTERVAL = 2000; // 每2秒轮询一次

function DuoWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const [brainhole, setBrainhole] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<'matching' | 'timeout' | 'ai' | 'matched'>('matching');
  const [matchData, setMatchData] = useState<any>(null);
  const [error, setError] = useState('');

  // 获取脑洞信息
  useEffect(() => {
    const saved = localStorage.getItem('xh_duo_brainhole');
    if (saved) {
      setBrainhole(JSON.parse(saved));
    }
    // 如果没有保存的brainhole（快速匹配模式），尝试从匹配状态中获取
  }, []);

  // 轮询匹配状态
  const pollMatchStatus = useCallback(async () => {
    if (!matchId || status !== 'matching') return;

    try {
      const res = await fetch(`/api/match/${matchId}`);
      const result = await res.json();
      console.log('[DuoWaiting] Poll result:', result);

      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);

        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          // 如果有brainhole信息，保存到localStorage
          if (data.brainhole) {
            localStorage.setItem('xh_duo_brainhole', JSON.stringify(data.brainhole));
            setBrainhole(data.brainhole);
          }
          // 匹配成功，跳转到房间
          setTimeout(() => {
            router.push(`/room/${data.roomId}`);
          }, 1000);
          return true; // stop polling
        }

        if (data.status === 'timeout') {
          setStatus('timeout');
          return true; // stop polling
        }
      }
      return false; // continue polling
    } catch (err) {
      console.error('[DuoWaiting] Poll error:', err);
      return false;
    }
  }, [matchId, status, router]);

  // 计时器 + 轮询
  useEffect(() => {
    if (!matchId) {
      router.push('/duo-match');
      return;
    }

    // 计时器
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        if (next >= MATCH_TIMEOUT) {
          clearInterval(timer);
          setStatus('timeout');
        }
        return next;
      });
    }, 1000);

    // 轮询
    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus();
      if (shouldStop) {
        clearInterval(pollTimer);
      }
    }, POLL_INTERVAL);

    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, [matchId, router, pollMatchStatus]);

  // 选择和刘看山AI对话
  const handleChooseAI = async () => {
    setStatus('ai');
    try {
      const brainholeId = brainhole?.id;
      const identity = localStorage.getItem('xh_duo_identity') || '我';

      // 调用API创建AI房间
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId,
          identity,
        }),
      });

      const result = await res.json();
      console.log('[DuoWaiting] AI room result:', result);

      if (result.success && result.data?.roomId) {
        setTimeout(() => {
          router.push(`/room/${result.data.roomId}`);
        }, 1000);
      } else {
        // fallback: 跳转到默认房间
        router.push('/room/1');
      }
    } catch (err) {
      console.error('[DuoWaiting] AI room error:', err);
      router.push('/room/1');
    }
  };

  const handleContinueWait = () => {
    setElapsedTime(0);
    setStatus('matching');
  };

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="寻找搭档" showBack />

      {/* 脑洞信息 */}
      {brainhole && (
        <div className="px-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-white/30 mb-1">当前脑洞</p>
            <p className="text-sm text-white/80 leading-relaxed">{brainhole.title}</p>
          </div>
        </div>
      )}

      {/* 中央区域：刘看山 + 匹配状态 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 刘看山形象 */}
        <motion.div
          className="w-20 h-20 rounded-full relative mb-6"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
            border: '2px solid #74b9ff',
            boxShadow: '0 0 24px #74b9ff40, inset -2px -2px 6px rgba(0,0,0,0.1)',
          }}
          animate={status === 'matching' ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* 耳朵 */}
          <div className="absolute -top-2 left-2.5 w-4 h-4 rounded-full bg-[#f5f5f5] border border-gray-200" />
          <div className="absolute -top-2 right-2.5 w-4 h-4 rounded-full bg-[#f5f5f5] border border-gray-200" />
          {/* 脸 */}
          <div className="absolute inset-0.5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
            <div className="flex gap-2.5 items-center mt-[-2px]">
              <div className="w-3 h-3 rounded-full bg-[#74b9ff]" />
              <div className="w-3 h-3 rounded-full bg-[#74b9ff]" />
            </div>
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-b-full bg-[#ff9f43]" />
          </div>
          {/* 腮红 */}
          <div className="absolute top-5 left-1.5 w-3 h-2.5 rounded-full bg-[#ffcccc] opacity-40" />
          <div className="absolute top-5 right-1.5 w-3 h-2.5 rounded-full bg-[#ffcccc] opacity-40" />
        </motion.div>

        {/* 状态文案 */}
        {status === 'matching' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-base font-medium text-white/90 mb-2">
              刘看山正在为你寻找对撞人...
            </p>
            <p className="text-xs text-white/30 mb-6">
              已等待 {elapsedTime} 秒，还剩 {remaining} 秒
            </p>
            {/* 进度条 */}
            <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-xh-gold rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {matchId && (
              <p className="text-[10px] text-white/15 mt-3">匹配ID: {matchId.slice(0, 8)}...</p>
            )}
          </motion.div>
        )}

        {status === 'matched' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-base font-medium text-emerald-400 mb-2">
              匹配成功！
            </p>
            <p className="text-xs text-white/40">
              正在进入对白实验室...
            </p>
          </motion.div>
        )}

        {status === 'timeout' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-base font-medium text-white/90 mb-2">
              暂时没有真人匹配到
            </p>
            <p className="text-sm text-white/50 mb-6">
              刘看山可以陪你先热身，愿意吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleChooseAI}
                className="px-6 py-3 rounded-xl bg-xh-gold/20 text-xh-gold border border-xh-gold/30 text-sm font-medium hover:bg-xh-gold/30 transition-colors"
              >
                和刘看山对话
              </button>
              <button
                onClick={handleContinueWait}
                className="px-6 py-3 rounded-xl bg-white/5 text-white/50 border border-white/10 text-sm hover:bg-white/10 transition-colors"
              >
                继续等待
              </button>
            </div>
          </motion.div>
        )}

        {status === 'ai' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-base font-medium text-xh-gold mb-2">
              刘看山已上线
            </p>
            <p className="text-xs text-white/40">
              正在进入对白实验室...
            </p>
          </motion.div>
        )}
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
