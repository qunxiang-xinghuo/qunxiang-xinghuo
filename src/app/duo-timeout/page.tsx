'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';

type Choice = 'ai' | 'wait' | 'exit';

function DuoTimeoutContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const searchParams = useSearchParams();
  const matchId = searchParams.get('matchId');
  const round = parseInt(searchParams.get('round') || '1', 10);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState('');

  const handleChooseAI = async () => {
    setChoice('ai');
    try {
      const identity = localStorage.getItem('xh_duo_identity') || '我';
      const guestId = localStorage.getItem('xh_user_id');

      console.log('[DuoTimeout] 开始创建AI房间, identity:', identity, 'guestId:', guestId);

      // v5.0-fix: 优先使用用户之前选择的brainholeId，没有才随机抽取
      let brainholeId = localStorage.getItem('xh_duo_brainhole') || undefined;
      // v8.3-fix: 防御性处理 —— 如果 localStorage 中存的是 JSON 对象字符串，提取 id
      if (brainholeId && brainholeId.startsWith('{')) {
        try {
          const parsed = JSON.parse(brainholeId);
          brainholeId = parsed.id || undefined;
        } catch { brainholeId = undefined; }
      }
      if (!brainholeId) {
        try {
          const randomRes = await fetch('/api/brainholes?mode=bubble&limit=1');
          const randomResult = await randomRes.json();
          console.log('[DuoTimeout] 随机脑洞响应:', JSON.stringify(randomResult));
          const randomBrainhole = randomResult.data?.brainholes?.[0];
          brainholeId = randomBrainhole?.id;
          console.log('[DuoTimeout] 使用随机脑洞:', randomBrainhole?.title, 'id:', brainholeId);
        } catch (bhErr) {
          console.warn('[DuoTimeout] 获取随机脑洞失败:', bhErr);
        }
      } else {
        console.log('[DuoTimeout] 使用用户选择的brainholeId:', brainholeId);
      }

      console.log('[DuoTimeout] POST /api/rooms/ai ...');
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({
          identity,
          brainholeId,
        }),
      });

      console.log('[DuoTimeout] 响应状态:', res.status);
      const result = await res.json();
      console.log('[DuoTimeout] 响应体:', JSON.stringify(result));

      if (result.success && result.data?.roomId) {
        if (result.data.userId) {
          localStorage.setItem('xh_user_id', result.data.userId);
        }
        console.log('[DuoTimeout] AI房间创建成功, roomId:', result.data.roomId);
        router.push(`/room/${result.data.roomId}`);
      } else {
        console.error('[DuoTimeout] 创建AI房间失败:', result);
        const errMsg = result.error?.message || result.message || '创建房间失败';
        setError('创建房间失败: ' + errMsg + '，请返回首页重试');
        setChoice(null);
      }
    } catch (err: any) {
      console.error('[DuoTimeout] 创建AI房间异常:', err);
      setError('网络异常: ' + (err.message || '请检查网络连接') + '，请返回首页重试');
      setChoice(null);
    }
  };

  const handleContinueWait = () => {
    setChoice('wait');
    // v5.0-fix: 继续等待时传递brainholeId，确保用户之前选择的脑洞不丢失
    let savedBrainhole = localStorage.getItem('xh_duo_brainhole');
    // v8.3-fix: 防御性处理 —— 如果 localStorage 中存的是 JSON 对象字符串，提取 id
    if (savedBrainhole && savedBrainhole.startsWith('{')) {
      try {
        const parsed = JSON.parse(savedBrainhole);
        savedBrainhole = parsed.id || null;
      } catch { savedBrainhole = null; }
    }
    const params = new URLSearchParams();
    if (savedBrainhole) params.set('brainholeId', savedBrainhole);
    params.set('round', '2');
    router.push(`/duo-waiting?${params.toString()}`);
  };

  const handleExit = () => {
    setChoice('exit');
    localStorage.removeItem('xh_duo_match_id');
    localStorage.removeItem('xh_duo_identity');
    localStorage.removeItem('xh_duo_brainhole');
    setTimeout(() => {
      router.push('/home');
    }, 300);
  };

  const isSecondRound = round >= 2;

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="匹配结果" showBack onBack={() => router.replace('/home')} />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 刘看山形象 */}
        <motion.div
          initial={mounted ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <LiuKanshanAvatar size="lg" animate emotion="sleepy" className="mb-8" />
        </motion.div>

        {/* 文案 */}
        <motion.div
          initial={mounted ? { y: 20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <p className="text-lg font-medium text-white/90 mb-2">
            四级匹配策略已用尽
          </p>
          <p className="text-sm text-white/40">
            已尝试：同话题→同类兴趣→热门话题→扩大搜索
          </p>
          <p className="text-sm text-white/40 mt-1">
            是否与刘看山一起探讨？
          </p>
          <p className="text-[10px] text-white/40 mt-3">
            {isSecondRound ? '第 2 次匹配尝试（最后一次）' : '第 1 次匹配尝试'} · v6.0 智能匹配
          </p>
        </motion.div>

        {/* 按钮组 */}
        {error && (
          <motion.p
            initial={mounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg py-2 px-4 mb-4"
          >
            {error}
          </motion.p>
        )}

        <motion.div
          initial={mounted ? { y: 30, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs space-y-3"
        >
          <button
            onClick={handleChooseAI}
            disabled={choice !== null}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {choice === 'ai' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '与刘看山对戏'
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
                '继续扩大搜索'
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
                '返回首页'
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
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoTimeoutContent />
    </Suspense>
  );
}
