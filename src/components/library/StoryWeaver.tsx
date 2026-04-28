'use client';

import React from 'react';
import { Sparkles, Lock } from 'lucide-react';

interface StoryWeaverProps {
  className?: string;
}

export default function StoryWeaver({ className = '' }: StoryWeaverProps) {
  return (
    <div className={`bg-gray-800/30 rounded-2xl p-6 border border-gray-700/30 text-center opacity-70 ${className}`}>
      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-gray-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-400 mb-2">故事织机 · 开发中</h3>
      <p className="text-sm text-gray-500 mb-3">
        用AI将你们的对白自动串联成完整故事，
        <br />
        支持二次编辑和公开发布
      </p>
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-xh-gold/10 text-xh-gold text-xs">
        <Sparkles className="w-3 h-3" />
        <span>Phase 4 功能，敬请期待</span>
      </div>
    </div>
  );
}
