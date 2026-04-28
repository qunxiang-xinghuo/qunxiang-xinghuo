'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import MatchCard from '@/components/match/MatchCard';
import { Brainhole } from '@/components/brainhole/BrainholeCard';

const duoBrainholes: Brainhole[] = [
  {
    id: 'bh_d1',
    title: '如果某天醒来，全世界只剩下你一个人，你会先去哪个地方？为什么？',
    content: '没有网络，没有外卖，没有声音...',
    source: '知乎',
  },
  {
    id: 'bh_d2',
    title: '你在工作中做过最"出格"的一次决定是什么？结果如何？',
    content: '那天下班后，我回了老板一封很长的邮件...',
    source: '知乎',
  },
  {
    id: 'bh_d3',
    title: '如果你能和任何职业的人互换一天身份，你会选谁？',
    content: '飞行员、急诊医生、还是幼儿园老师？',
    source: '知乎',
  },
];

export default function DuoMatchPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleSelect = (brainhole: Brainhole) => {
    setSelectedId(brainhole.id);
    localStorage.setItem('xh_duo_brainhole', JSON.stringify(brainhole));
    setTimeout(() => {
      router.push('/duo-waiting');
    }, 500);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="双人接戏" showBack />

      <div className="px-6 py-4">
        <p className="text-sm text-gray-400">
          选一个让你“有感觉”的脑洞，系统会为你匹配一个同样选中它的陌生人。
        </p>
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar pb-6">
        {duoBrainholes.map((brainhole) => (
          <MatchCard
            key={brainhole.id}
            brainhole={brainhole}
            isSelected={selectedId === brainhole.id}
            onSelect={() => handleSelect(brainhole)}
          />
        ))}
      </div>
    </div>
  );
}
