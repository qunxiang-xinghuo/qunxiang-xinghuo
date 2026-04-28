'use client';

import React from 'react';
import TopBar from '@/components/layout/TopBar';
import { Sparkles, Lock } from 'lucide-react';

export default function MultiplayerPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center">
      <TopBar title="故事广场" />

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">多人组队 · 开发中</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-xs">
          支持3-8人共同参与一个脑洞故事，轮流续写，投票决定剧情走向，共同创作属于你们的群像故事。
        </p>
        <div className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-xh-gold/10 text-xh-gold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Phase 3 功能，敬请期待</span>
        </div>
      </div>
    </div>
  );
}
