'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import MatchCard from '@/components/match/MatchCard';
import DuoIdentityModal from '@/components/match/DuoIdentityModal';
import { Zap } from 'lucide-react';

interface BrainholeItem {
  id: string;
  title: string;
  content: string;
  source: string;
}

function DuoMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBrainholeId = searchParams.get('brainholeId');

  const [brainholes, setBrainholes] = useState<BrainholeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrainhole, setSelectedBrainhole] = useState<BrainholeItem | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isQuickMatch, setIsQuickMatch] = useState(false);

  // 从API获取脑洞列表
  useEffect(() => {
    fetch('/api/brainholes?limit=20')
      .then((r) => r.json())
      .then((res) => {
        let items: BrainholeItem[] = [];
        if (res.success && res.data?.items) {
          items = res.data.items.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            content: String(b.scenario || b.content || '').slice(0, 80),
            source: String(b.source || '用户'),
          }));
        } else if (res.success && res.data?.brainholes) {
          items = res.data.brainholes.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            content: String(b.scenario || b.content || '').slice(0, 80),
            source: String(b.source || '用户'),
          }));
        }
        setBrainholes(items);

        // 如果URL带了brainholeId，自动选中并弹出身份选择
        if (urlBrainholeId && items.length > 0) {
          const target = items.find((b) => b.id === urlBrainholeId);
          if (target) {
            setSelectedBrainhole(target);
            localStorage.setItem('xh_duo_brainhole', JSON.stringify(target));
            setShowIdentityModal(true);
          }
        }
      })
      .catch((err) => {
        console.error('[DuoMatch] Fetch brainholes failed:', err);
      })
      .finally(() => setIsLoading(false));
  }, [urlBrainholeId]);

  const handleSelectBrainhole = (brainhole: BrainholeItem) => {
    setSelectedBrainhole(brainhole);
    localStorage.setItem('xh_duo_brainhole', JSON.stringify(brainhole));
    setIsQuickMatch(false);
    setShowIdentityModal(true);
  };

  const handleQuickMatch = () => {
    // 快速匹配：不选具体脑洞，系统随机分配
    setSelectedBrainhole(null);
    localStorage.removeItem('xh_duo_brainhole');
    setIsQuickMatch(true);
    setShowIdentityModal(true);
  };

  const handleConfirmIdentity = async (identity: string, type: 'zhihu' | 'ai' | 'custom') => {
    setIsMatching(true);
    setShowIdentityModal(false);

    try {
      console.log('[DuoMatch] Creating match request...');
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: selectedBrainhole?.id || undefined,
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: isQuickMatch ? 'quick' : 'duo',
        }),
      });

      const result = await res.json();
      console.log('[DuoMatch] Match response:', result);

      if (result.success) {
        const matchId = result.data?.matchId;
        if (matchId) {
          localStorage.setItem('xh_duo_match_id', matchId);
          localStorage.setItem('xh_duo_identity', identity);
          // 快速模式也要保存brainhole信息到localStorage（如果服务器返回了）
          if (selectedBrainhole) {
            localStorage.setItem('xh_duo_brainhole', JSON.stringify(selectedBrainhole));
          }
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

      <div className="px-6 py-4">
        <p className="text-sm text-white/40">
          选一个让你"有感觉"的脑洞，系统会为你匹配一个同样选中它的陌生人。
        </p>
      </div>

      {/* 快速匹配按钮 */}
      <div className="px-4 mb-3">
        <button
          onClick={handleQuickMatch}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium flex items-center justify-center gap-2 hover:from-orange-500/30 hover:to-rose-500/30 transition-all"
        >
          <Zap className="w-4 h-4" />
          快速匹配（任意脑洞）
        </button>
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar pb-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-white/30">加载脑洞中...</p>
          </div>
        ) : brainholes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs text-white/30">暂无可用脑洞</p>
          </div>
        ) : (
          brainholes.map((brainhole) => (
            <MatchCard
              key={brainhole.id}
              brainhole={brainhole}
              isSelected={selectedBrainhole?.id === brainhole.id && !isQuickMatch}
              onSelect={() => handleSelectBrainhole(brainhole)}
            />
          ))
        )}
      </div>

      {/* 身份确认弹窗 */}
      <DuoIdentityModal
        isOpen={showIdentityModal}
        brainholeTitle={selectedBrainhole?.title || '快速匹配'}
        onClose={() => setShowIdentityModal(false)}
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
