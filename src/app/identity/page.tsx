'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import IdentitySelector from '@/components/identity/IdentitySelector';
import { Identity } from '@/components/identity/IdentityBadge';
import { useAuth } from '@/hooks/useAuth';

function IdentityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'solo';
  const { updateIdentity } = useAuth();

  const [selectedIdentity, setSelectedIdentity] = React.useState<Identity['type'] | null>(null);
  const [customLabel, setCustomLabel] = React.useState('');

  const handleConfirm = () => {
    if (!selectedIdentity) return;
    if (selectedIdentity === 'custom' && !customLabel.trim()) return;

    let identity: Identity;
    if (selectedIdentity === 'real') {
      identity = { type: 'real', label: '知乎认证用户' };
    } else if (selectedIdentity === 'recommended') {
      identity = { type: 'recommended', label: '故事讲述者' };
    } else {
      identity = { type: 'custom', label: customLabel.trim() };
    }

    updateIdentity(identity);

    if (mode === 'solo') {
      router.push('/match');
    } else {
      router.push('/duo-match');
    }
  };

  const isValid = selectedIdentity && (selectedIdentity !== 'custom' || customLabel.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="选择你的身份" showBack onBack={() => router.back()} />

      <div className="px-6 py-4">
        <p className="text-sm text-gray-400 leading-relaxed">
          你的身份标签会伴随每一次反应记录，
          <br />
          让读者知道&quot;这是一个_____的真实想法&quot;。
        </p>
      </div>

      <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-6">
        <IdentitySelector
          selectedIdentity={selectedIdentity}
          customLabel={customLabel}
          onSelect={setSelectedIdentity}
          onCustomLabelChange={setCustomLabel}
        />
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-medium text-center transition-all ${
            isValid
              ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认身份，进入脑洞广场
        </button>
      </div>
    </div>
  );
}

export default function IdentityPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">加载中...</div>}>
      <IdentityPageContent />
    </Suspense>
  );
}
