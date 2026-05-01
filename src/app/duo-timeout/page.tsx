'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

type Choice = 'ai' | 'wait' | 'exit';

function DuoTimeoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const round = parseInt(searchParams.get('round') || '1', 10);
  const [choice, setChoice] = useState<Choice | null>(null);

  const handleChooseAI = async () => {
    setChoice('ai');
    try {
      const identity = localStorage.getItem('xh_duo_identity') || '我';
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      });

      const result = await res.json();
      if (result.success && result.data?.roomId) {
        router.push(`/room/${result.data.roomId}`);
      } else {
        router.push('/room/1');
      }
    } catch {
      router.push('/room/1');
    }
  };

  const handleContinueWait = () => {
    setChoice('wait');
    if (matchId) {
      // 第二轮等待，跳回 waiting 页面
      router.push(`/duo-waiting?matchId=${matchId}&round=2`);
    } else {
      router.push('/duo-match');
    }
  };

  const handleExit = () => {
    setChoice('exit');
    localStorage.removeItem('xh_duo_match_id');
    localStorage.removeItem('xh_duo_identity');
    localStorage.removeItem('xh_duo_brainhole');
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  const isSecondRound = round >= 2;

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="匹配结果" showBack />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 刘看山形象 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full relative mb-8"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
            border: '2px solid #74b9ff',
            boxShadow: '0 0 24px #74b9ff40, inset -2px -2px 6px rgba(0,0,0,0.1)',
          }}
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

        {/* 文案 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="text-lg font-medium text-white/90 mb-2">
            当前暂无真人
          </p>
          <p className="text-sm text-white/40">
            是否与刘看山一起探讨？
          </p>
          <p className="text-[10px] text-white/20 mt-3">
            {isSecondRound ? '第 2 次匹配尝试（最后一次）' : '第 1 次匹配尝试'}
          </p>
        </motion.div>

        {/* 按钮组 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs space-y-3"
        >
          <button
            onClick={handleChooseAI}
            disabled={choice !== null}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {choice === 'ai' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '是，与刘看山对白'
            )}
          </button>

          {!isSecondRound ? (
            <button
              onClick={handleContinueWait}
              disabled={choice !== null}
              className="w-full py-3.5 rounded-xl bg-white/5 text-white/60 border border-white/10 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {choice === 'wait' ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
              ) : (
                '否，继续等待'
              )}
            </button>
          ) : (
            <button
              onClick={handleExit}
              disabled={choice !== null}
              className="w-full py-3.5 rounded-xl bg-white/5 text-white/60 border border-white/10 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {choice === 'exit' ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
              ) : (
                '否，返回首页'
              )}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function DuoTimeoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoTimeoutContent />
    </Suspense>
  );
}
