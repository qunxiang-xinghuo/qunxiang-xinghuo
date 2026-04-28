'use client';

import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';

interface PlaceholderEntryProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isLocked?: boolean;
  className?: string;
}

export default function PlaceholderEntry({
  icon,
  title,
  subtitle,
  isLocked = false,
  className = '',
}: PlaceholderEntryProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-700/30 ${
        isLocked ? 'opacity-60' : 'hover:bg-gray-800 cursor-pointer'
      } transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-700/50 text-gray-400">{icon}</div>
        <div>
          <h4 className="text-sm font-medium text-white">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {isLocked ? (
        <Lock className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </div>
  );
}
