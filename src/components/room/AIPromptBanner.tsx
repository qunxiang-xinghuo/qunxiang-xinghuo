'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

interface AIPromptBannerProps {
  prompts: string[];
  selectedPromptIndex: number;
  onSelectPrompt: (index: number) => void;
  className?: string;
}

export default function AIPromptBanner({
  prompts,
  selectedPromptIndex,
  onSelectPrompt,
  className = '',
}: AIPromptBannerProps) {
  return (
    <div className={`bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 ${className}`}>
      <div className="flex items-start gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-violet-300 mb-1">AI 催化剂</p>
          <p className="text-sm text-gray-200">{prompts[selectedPromptIndex]}</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {prompts.map((_, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(index)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] transition-colors ${
              index === selectedPromptIndex
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            引导 {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
