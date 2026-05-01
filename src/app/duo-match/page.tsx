'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // v4.1-fix: 检查用户登录状态
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.id) {
          setIsLoggedIn(true);
          setShowIdentityModal(true);
        } else {
          setIsLoggedIn(false);
          // 未登录，提示并跳转到登录页
          alert('请先登录后再进行双人匹配');
          router.push('/login');
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        alert('请先登录后再进行双人匹配');
        router.push('/login');
      });
  }, [router]);

  const handleConfirmIdentity = async (identity: string, type: 'zhihu' | 'ai' | 'custom') => {
    setIsMatching(true);
    setShowIdentityModal(false);

    try {
      console.log('[DuoMatch] Creating quick match request...');
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          localStorage.removeItem('xh_duo_brainhole');
          // 选完身份后自动进入等待页
          router.push(`/duo-waiting?matchId=${matchId}`);
        } else {
          alert('匹配请求创建失败');
          setIsMatching(false);
          setShowIdentityModal(true); // 重新显示身份选择
        }
      } else {
        alert(result.message || '匹配请求失败');
        setIsMatching(false);
        setShowIdentityModal(true); // 重新显示身份选择
      }
    } catch (err) {
      console.error('[DuoMatch] Match request error:', err);
      alert('网络错误，请重试');
      setIsMatching(false);
      setShowIdentityModal(true); // 重新显示身份选择
    }
  };

  // 未登录或加载中，显示加载状态
  if (isLoggedIn === null) {
    return (
      <div className="flex flex-col h-full bg-[#1a1a2e]">
        <TopBar title="双人接戏" showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/40">检查登录状态...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="双人接戏" showBack />

      <div className="px-6 py-4">
        <p className="text-sm text-white/40">
          选择一个身份，系统会为你随机匹配一个对戏伙伴。
        </p>
      </div>

      <DuoIdentityModal
        isOpen={showIdentityModal}
        brainholeTitle="快速匹配"
        onClose={() => {
          setShowIdentityModal(false);
          router.push('/');
        }}
        onConfirm={handleConfirmIdentity}
      />

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
