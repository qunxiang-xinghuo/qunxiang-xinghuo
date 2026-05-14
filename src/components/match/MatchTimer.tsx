'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface MatchTimerProps {
  brainholeTitle: string;
  elapsedTime?: number;
  className?: string;
}

export default function MatchTimer({ brainholeTitle: _brainholeTitle, elapsedTime = 0, className = '' }: MatchTimerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-xh-accent/20 to-purple-500/20 flex items-center justify-center border border-xh-accent/30 animate-pulse">
          <Loader2 className="w-10 h-10 text-xh-accent animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border border-xh-accent/20 animate-ping-slow" />
        <div className="absolute inset-0 rounded-full border border-xh-accent/10 animate-ping-slow" style={{ animationDelay: '0.5s' }} />
      </div>

      <h3 className="text-xl font-bold text-white mb-2 text-center">正在寻找另一个接戏的人…</h3>
      <p className="text-sm text-gray-400 text-center">
        有人在世界的某个角落，
        <br />
        和你看着同一个脑洞
      </p>
      {elapsedTime > 0 && (
        <p className="text-xs text-gray-500 mt-4">已等待 {elapsedTime} 秒</p>
      )}
    </div>
  );
}
