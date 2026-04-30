'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import MatchCard from '@/components/match/MatchCard';
import DuoIdentityModal from '@/components/match/DuoIdentityModal';

interface BrainholeItem {
  id: string;
  title: string;
  content: string;
  source: string;
}

export default function MultiMatchPage() {
  const router = useRouter();
  const [brainholes, setBrainholes] = useState<BrainholeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrainhole, setSelectedBrainhole] = useState<BrainholeItem | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    fetch('/api/brainholes?limit=20')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.items) {
          setBrainholes(res.data.items.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            content: String(b.scenario || b.content || '').slice(0, 80),
            source: String(b.source || '用户'),
          })));
        } else if (res.success && res.data?.brainholes) {
          setBrainholes(res.data.brainholes.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            content: String(b.scenario || b.content || '').slice(0, 80),
            source: String(b.source || '用户'),
          })));
        }
      })
      .catch((err) => {
        console.error('[MultiMatch] Fetch brainholes failed:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectBrainhole = (brainhole: BrainholeItem) => {
    setSelectedBrainhole(brainhole);
    localStorage.setItem('xh_multi_brainhole', JSON.stringify(brainhole));
    setShowIdentityModal(true);
  };

  const handleConfirmIdentity = async (identity: string) => {
    if (!selectedBrainhole) return;
    setIsMatching(true);
    setShowIdentityModal(false);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: selectedBrainhole.id,
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'multi',
        }),
      });

      const result = await res.json();

      if (result.success) {
        const matchId = result.data?.matchId;
        if (matchId) {
          localStorage.setItem('xh_multi_match_id', matchId);
          localStorage.setItem('xh_multi_identity', identity);
          router.push(`/multi-waiting?matchId=${matchId}`);
        } else {
          alert('匹配请求创建失败');
          setIsMatching(false);
        }
      } else {
        alert(result.message || '匹配请求失败');
        setIsMatching(false);
      }
    } catch (err) {
      console.error('[MultiMatch] Match request error:', err);
      alert('网络错误，请重试');
      setIsMatching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="多人组队" showBack />

      <div className="px-6 py-4">
        <p className="text-sm text-white/40">
          选一个脑洞，系统会为你匹配一群同样选中它的陌生人，一起群像共创。
          凑不齐人会自动降级双人，再不行就召唤AI搭档。
        </p>
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
              isSelected={selectedBrainhole?.id === brainhole.id}
              onSelect={() => handleSelectBrainhole(brainhole)}
            />
          ))
        )}
      </div>

      {selectedBrainhole && (
        <DuoIdentityModal
          isOpen={showIdentityModal}
          brainholeTitle={selectedBrainhole.title}
          onClose={() => setShowIdentityModal(false)}
          onConfirm={handleConfirmIdentity}
        />
      )}

      {isMatching && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/60">正在创建组队请求...</p>
          </div>
        </div>
      )}
    </div>
  );
}
