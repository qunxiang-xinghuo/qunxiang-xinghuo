'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

const MATCH_TIMEOUT = 60; // 1分钟
const POLL_INTERVAL = 2000; // 每2秒轮询一次

// v4.1 状态机类型定义
// matching: 匹配中 | timeout: 超时弹窗 | ai: AI加载中 | matched: 匹配成功 | exiting: 退出中
type MatchStatus = 'matching' | 'timeout' | 'ai' | 'matched' | 'exiting';

function DuoWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');

  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('matching');
  const [matchData, setMatchData] = useState<any>(null);
  const [timeoutCount, setTimeoutCount] = useState(0); // v4.1: 记录超时次数（0=第1轮，1=第2轮）

  // v4.1: 轮询匹配状态
  const pollMatchStatus = useCallback(async () => {
    if (!matchId || status !== 'matching') return false;

    try {
      const res = await fetch(`/api/match/${matchId}`);
      const result = await res.json();
      console.log('[DuoWaiting] Poll result:', result);

      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);

        // v4.1: 匹配成功，立刻跳转对白实验室
        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          setTimeout(() => {
            router.push(`/room/${data.roomId}`);
          }, 1000);
          return true; // stop polling
        }

        // v4.1: 超时状态由前端倒计时控制，不依赖后端timeout状态
      }
      return false; // continue polling
    } catch (err) {
      console.error('[DuoWaiting] Poll error:', err);
      return false;
    }
  }, [matchId, status, router]);

  // v4.1: 精确的60秒倒计时 + 轮询
  useEffect(() => {
    if (!matchId) {
      router.push('/duo-match');
      return;
    }

    // 计时器：每秒更新
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        // 60秒超时处理
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

  // v4.1: 选择和刘看山AI对话
  const handleChooseAI = async () => {
    setStatus('ai');
    try {
      const identity = localStorage.getItem('xh_duo_identity') || '我';

      // 调用API创建AI房间
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

  // v4.1: 继续等待（第1次超时后）
  const handleContinueWait = () => {
    setTimeoutCount(1); // 标记为第2轮
    setElapsedTime(0);
    setStatus('matching');
  };

  // v4.1: 退出匹配（第2次超时后选"否"）
  const handleExitMatch = () => {
    setStatus('exiting');
    // 清理本地存储
    localStorage.removeItem('xh_duo_match_id');
    localStorage.removeItem('xh_duo_identity');
    localStorage.removeItem('xh_duo_brainhole');
    // 返回首页
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="寻找搭档" showBack />

      {/* 中央区域：刘看山 + 匹配状态 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
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
        <AnimatePresence mode="wait">
          {status === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-base font-medium text-white/90 mb-2">
                刘看山正在为你寻找对撞人…
              </p>
              {/* v4.1: 高度可见的倒计时 */}
              <p className="text-2xl font-bold text-xh-gold mb-2">
                {remaining} 秒
              </p>
              {/* 进度条 */}
              <div className="w-56 h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-xh-gold rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-white/30">
                已等待 {elapsedTime} 秒
              </p>
              {matchId && (
                <p className="text-[10px] text-white/15 mt-3">匹配ID: {matchId.slice(0, 8)}...</p>
              )}
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
              <p className="text-base font-medium text-emerald-400 mb-2">
                匹配成功！
              </p>
              <p className="text-xs text-white/40">
                正在进入对白实验室...
              </p>
            </motion.div>
          )}

          {status === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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

          {status === 'exiting' && (
            <motion.div
              key="exiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-base font-medium text-white/50">
                正在返回首页...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* v4.1: 超时弹窗（模态框） */}
        <AnimatePresence>
          {status === 'timeout' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative w-full max-w-sm bg-[#1a1a2e] rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-6"
              >
                {/* 刘看山小头像 */}
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full relative"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
                      border: '2px solid #74b9ff',
                      boxShadow: '0 0 16px #74b9ff40',
                    }}
                  >
                    <div className="absolute -top-1.5 left-2 w-3 h-3 rounded-full bg-[#f5f5f5] border border-gray-200" />
                    <div className="absolute -top-1.5 right-2 w-3 h-3 rounded-full bg-[#f5f5f5] border border-gray-200" />
                    <div className="absolute inset-0.5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                      <div className="flex gap-2 items-center mt-[-1px]">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#74b9ff]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#74b9ff]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 弹窗文案 */}
                <p className="text-center text-base font-medium text-white/90 mb-1">
                  当前暂无真人
                </p>
                <p className="text-center text-sm text-white/50 mb-6">
                  是否与刘看山一起探讨？
                </p>

                {/* 按钮组 */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleChooseAI}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    是，与刘看山对白
                  </button>

                  {timeoutCount === 0 ? (
                    // 第1次超时：显示"继续等待"
                    <button
                      onClick={handleContinueWait}
                      className="w-full py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                    >
                      否，继续等待
                    </button>
                  ) : (
                    // 第2次超时：显示"返回首页"
                    <button
                      onClick={handleExitMatch}
                      className="w-full py-3 rounded-xl bg-white/5 text-white/60 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                    >
                      否，返回首页
                    </button>
                  )}
                </div>

                {/* 第几轮提示 */}
                <p className="text-center text-[10px] text-white/20 mt-4">
                  {timeoutCount === 0 ? '第 1 次匹配尝试' : '第 2 次匹配尝试（最后一次）'}
                </p>
              </motion.div>
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
