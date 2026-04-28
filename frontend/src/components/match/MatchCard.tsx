'use client';

import React from 'react';
import { Book, Heart } from 'lucide-react';
import { Brainhole } from '../brainhole/BrainholeCard';

interface MatchCardProps {
  brainhole: Brainhole;
  isSelected: boolean;
  onSelect: () => void;
  className?: string;
}

export default function MatchCard({ brainhole, isSelected, onSelect, className = '' }: MatchCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-xh-gold bg-xh-gold/10'
          : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Book className="w-3 h-3" />
          {brainhole.source}
        </span>
        {isSelected && (
          <span className="text-xs text-xh-gold flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current" />
            已选中
          </span>
        )}
      </div>
      <h3 className="text-base font-bold text-white leading-relaxed mb-2">
        {brainhole.title}
      </h3>
      <p className="text-xs text-gray-400">{brainhole.content}</p>
      {isSelected && (
        <div className="mt-3 text-center">
          <span className="text-xs text-xh-gold animate-pulse">正在进入匹配...</span>
        </div>
      )}
    </div>
  );
}
