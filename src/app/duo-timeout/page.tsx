'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';

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
      const guestId = localStorage.getItem('xh_user_id');

      console.log('[DuoTimeout] 开始创建AI房间, identity:', identity, 'guestId:', guestId);

      // v4.7: 随机抽取一个脑洞用于AI对话
      let brainholeId = undefined;
      try {
        const randomRes = await fetch('/api/brainholes?mode=bubble&limit=1');
        const randomResult = await randomRes.json();
        console.log('[DuoTimeout] 随机脑洞响应:', JSON.stringify(randomResult));
        const randomBrainhole = randomResult.data?.brainholes?.[0];
        brainholeId = randomBrainhole?.id;
        console.log('[DuoTimeout] 使用脑洞:', randomBrainhole?.title, 'id:', brainholeId);
      } catch (bhErr) {
        console.warn('[DuoTimeout] 获取随机脑洞失败，将不使用脑洞:', bhErr);
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
        alert('创建房间失败: ' + errMsg + '，请返回首页重试');
        setChoice(null);
      }
    } catch (err: any) {
      console.error('[DuoTimeout] 创建AI房间异常:', err);
      alert('网络异常: ' + (err.message || '请检查网络连接') + '，请返回首页重试');
      setChoice(null);
    }
  };

  const handleContinueWait = () => {
    setChoice('wait');
    // v4.6: 继续等待时，跳转回等待页（不再依赖matchId，等待页会重新发起匹配请求）
    router.push(`/duo-waiting?round=2`);
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
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <LiuKanshanAvatar size="lg" animate emotion="sleepy" className="mb-8" />
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
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoTimeoutContent />
    </Suspense>
  );
}
