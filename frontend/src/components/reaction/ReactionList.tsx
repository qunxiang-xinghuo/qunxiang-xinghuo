'use client';

import React from 'react';
import SparkButton from './SparkButton';
import IdentityBadge from '../identity/IdentityBadge';

export interface Reaction {
  id: string;
  identity: {
    label: string;
    type: 'real' | 'recommended' | 'custom';
  };
  content: string;
  sparkCount: number;
  isSparkedByMe: boolean;
  createdAt: string;
}

interface ReactionListProps {
  reactions: Reaction[];
  onSpark: (reactionId: string) => void;
  className?: string;
}

export default function ReactionList({ reactions, onSpark, className = '' }: ReactionListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <IdentityBadge identity={reaction.identity} />
            <span className="text-[10px] text-gray-500">{reaction.createdAt}</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed mb-2">{reaction.content}</p>
          <div className="flex justify-end">
            <SparkButton
              isSparked={reaction.isSparkedByMe}
              count={reaction.sparkCount}
              onClick={() => onSpark(reaction.id)}
              size="sm"
            />
          </div>
        </div>
      ))}

      {reactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">还没有反应，快来第一个留下你的想法吧</p>
        </div>
      )}
    </div>
  );
}
