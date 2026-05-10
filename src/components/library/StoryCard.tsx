'use client';

import React from 'react';
import { Book, Flame } from 'lucide-react';

interface StoryCardProps {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  sparkCount: number;
  isDraft?: boolean;
  className?: string;
}

export default function StoryCard({
  id,
  title,
  preview,
  createdAt,
  sparkCount,
  isDraft = false,
  className = '',
}: StoryCardProps) {
  return (
    <div className={`bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Book className="w-4 h-4 text-xh-gold" />
          <span className="text-xs font-medium text-white">{isDraft ? '故事草稿' : '已发布故事'}</span>
        </div>
        <span className="text-[10px] text-gray-500">{createdAt}</span>
      </div>
      <h3 className="text-base font-bold text-white leading-relaxed mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-3 line-clamp-2">{preview}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-xh-gold">
          <Flame className="w-3 h-3 fill-xh-yellow" />
          <span>{sparkCount} 火花</span>
        </div>
        <button className="text-xs text-xh-accent hover:underline">查看详情</button>
      </div>
    </div>
  );
}
