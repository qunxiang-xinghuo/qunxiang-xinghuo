'use client';

import React from 'react';
import { Flame } from 'lucide-react';

interface SparkButtonProps {
  isSparked: boolean;
  onClick: () => void;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SparkButton({
  isSparked,
  onClick,
  count,
  size = 'md',
  className = '',
}: SparkButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full transition-all ${sizeClasses[size]} ${
        isSparked
          ? 'bg-xh-gold/20 text-xh-gold border border-xh-gold/30'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
      } ${className}`}
    >
      <Flame className={`${iconSizes[size]} ${isSparked ? 'fill-xh-gold' : ''}`} />
      {count !== undefined && <span className="font-medium">{count}</span>}
    </button>
  );
}
