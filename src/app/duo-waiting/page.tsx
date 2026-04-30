'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

const MATCH_TIMEOUT = 60; // 1分钟

export default function DuoWaitingPage() {
  const router = useRouter();
  const [brainhole, setBrainhole] = React.useState<any>(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [status, setStatus] = React.useState<'matching' | 'timeout' | 'ai'>('matching');

  React.useEffect(() => {
    const saved = localStorage.getItem('xh_duo_brainhole');
    if (saved) {
      setBrainhole(JSON.parse(saved));
    } else {
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

    return () => clearInterval(timer);
  }, [router]);

  const handleChooseAI = () => {
    setStatus('ai');
    // 延迟后进入对白室
    setTimeout(() => {
      router.push('/room/1');
    }, 1500);
  };

  const handleContinueWait = () => {
    setElapsedTime(0);
    setStatus('matching');
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
  };

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);

  if (!brainhole) return null;

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="寻找搭档" showBack />

      {/* 脑洞信息 */}
      <div className="px-4 mb-6">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/30 mb-1">当前脑洞</p>
          <p className="text-sm text-white/80 leading-relaxed">{brainhole.title}</p>
        </div>
      </div>

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
