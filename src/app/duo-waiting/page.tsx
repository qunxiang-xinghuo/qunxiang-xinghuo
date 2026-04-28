'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import MatchTimer from '@/components/match/MatchTimer';
import MatchSuccessModal from '@/components/match/MatchSuccessModal';

export default function DuoWaitingPage() {
  const router = useRouter();
  const [brainhole, setBrainhole] = React.useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    const saved = localStorage.getItem('xh_duo_brainhole');
    if (saved) {
      setBrainhole(JSON.parse(saved));
    } else {
      router.push('/duo-match');
    }

    // Simulate matching
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Show success after 3 seconds
    const successTimeout = setTimeout(() => {
      setShowSuccessModal(true);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(successTimeout);
    };
  }, [router]);

  const handleEnterChat = () => {
    router.push('/room/1');
  };

  if (!brainhole) return null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="寻找搭档" showBack />

      <div className="px-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
          <p className="text-[10px] text-gray-500 mb-1">你选择的脑洞</p>
          <p className="text-sm text-white leading-relaxed">{brainhole.title}</p>
        </div>
      </div>

      <div className="flex-1 px-6">
        <MatchTimer brainholeTitle={brainhole.title} elapsedTime={elapsedTime} />
      </div>

      <MatchSuccessModal
        isOpen={showSuccessModal}
        onEnterChat={handleEnterChat}
        partnerIdentity={{ type: 'recommended', label: '创意工作者' }}
        brainholeTitle={brainhole.title}
      />
    </div>
  );
}
