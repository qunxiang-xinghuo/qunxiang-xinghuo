'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import BrainholeStack from '@/components/brainhole/BrainholeStack';
import { useBrainhole } from '@/hooks/useBrainhole';
import { useCollection } from '@/hooks/useCollection';

export default function MatchPage() {
  const router = useRouter();
  const { brainholes, loading } = useBrainhole();
  const { collectBrainhole } = useCollection();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeRight = (brainhole: any) => {
    collectBrainhole(brainhole);
    router.push(`/brainhole/${brainhole.id}`);
  };

  const handleSwipeLeft = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-xh-gold/30 border-t-xh-gold rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 text-sm">加载脑洞中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="脑洞广场"
        showBack
        onBack={() => router.back()}
      />

      <BrainholeStack
        brainholes={brainholes}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
      />
    </div>
  );
}
