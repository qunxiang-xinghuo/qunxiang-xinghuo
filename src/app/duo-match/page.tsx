'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import DuoIdentityModal from '@/components/match/DuoIdentityModal';

export default function DuoMatchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoMatchContent />
    </Suspense>
  );
}

function DuoMatchContent() {
  const router = useRouter();
  const [showIdentityModal, setShowIdentityModal] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  // v4.1 改造：进入页面直接显示身份选择弹窗，不显示任何脑洞
  // 原有脑洞选择逻辑已移除，改为快速匹配模式（mode=quick）

  const handleConfirmIdentity = async (identity: string, type: 'zhihu' | 'ai' | 'custom') => {
    setIsMatching(true);
    setShowIdentityModal(false);

    try {
      console.log('[DuoMatch] Creating quick match request...');
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // v4.1: 快速匹配不指定具体brainholeId，系统随机分配
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'quick',
        }),
      });

      const result = await res.json();
      console.log('[DuoMatch] Match response:', result);

      if (result.success) {
        const matchId = result.data?.matchId;
        if (matchId) {
          localStorage.setItem('xh_duo_match_id', matchId);
          localStorage.setItem('xh_duo_identity', identity);
          // v4.1: 清空可能存在的旧brainhole，等待服务器分配
          localStorage.removeItem('xh_duo_brainhole');
          router.push(`/duo-waiting?matchId=${matchId}`);
        } else {
          alert('匹配请求创建失败');
          setIsMatching(false);
        }
      } else {
        alert(result.message || '匹配请求失败');
        setIsMatching(false);
      }
    } catch (err) {
      console.error('[DuoMatch] Match request error:', err);
      alert('网络错误，请重试');
      setIsMatching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="双人接戏" showBack />

      {/* v4.1: 身份选择引导文案 */}
      <div className="px-6 py-4">
        <p className="text-sm text-white/40">
          选择一个身份，系统会为你随机匹配一个对戏伙伴。
        </p>
      </div>

      {/* 身份选择弹窗 - 进入页面直接弹出 */}
      <DuoIdentityModal
        isOpen={showIdentityModal}
        brainholeTitle="快速匹配"
        onClose={() => {
          // 关闭弹窗返回首页
          setShowIdentityModal(false);
          router.push('/');
        }}
        onConfirm={handleConfirmIdentity}
      />

      {/* 匹配中遮罩 */}
      {isMatching && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-xh-gold/30 border-t-xh-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/60">正在创建匹配请求...</p>
          </div>
        </div>
      )}
    </div>
  );
}
