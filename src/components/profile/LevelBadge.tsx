'use client';

import React from 'react';

interface LevelBadgeProps {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  className?: string;
}

export default function LevelBadge({ level, currentExp, nextLevelExp, className = '' }: LevelBadgeProps) {
  const progress = Math.min(100, Math.max(0, (currentExp / nextLevelExp) * 100));
  return (
    <div className={`bg-gradient-to-br from-xh-gold/20 to-xh-gold-dark/20 rounded-xl p-4 border border-xh-gold/30 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">当前等级</p>
          <h3 className="text-2xl font-bold text-xh-gold">Lv.{level}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">升级进度</p>
          <p className="text-sm text-white font-medium">{currentExp}/{nextLevelExp} EXP</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-xh-gold to-xh-gold-dark transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
