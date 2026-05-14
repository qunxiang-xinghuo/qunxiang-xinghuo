'use client';

import React from 'react';
import { Flame, BookOpen } from 'lucide-react';

interface SparkCollectionProps {
  id: string;
  title: string;
  brainholeTitle: string;
  reactionCount: number;
  createdAt: string;
  className?: string;
}

export default function SparkCollection({
  id: _id,
  title,
  brainholeTitle,
  reactionCount,
  createdAt,
  className = '',
}: SparkCollectionProps) {
  return (
    <div className={`bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-xh-yellow" />
          <span className="text-xs font-medium text-white">火花收藏</span>
        </div>
        <span className="text-[10px] text-gray-500">{createdAt}</span>
      </div>
      <h3 className="text-base font-bold text-white leading-relaxed mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-3">来自脑洞：{brainholeTitle}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-xh-accent">
          <BookOpen className="w-3 h-3" />
          <span>{reactionCount} 条反应</span>
        </div>
        <button className="text-xs text-xh-accent hover:underline">查看全部</button>
      </div>
    </div>
  );
}
