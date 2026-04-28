'use client';

import React from 'react';
import { MessageSquare, Flame, Users, Book } from 'lucide-react';

interface UserStatsProps {
  reactionCount: number;
  sparkCount: number;
  matchCount: number;
  storyCount: number;
  className?: string;
}

export default function UserStats({ reactionCount, sparkCount, matchCount, storyCount, className = '' }: UserStatsProps) {
  const stats = [
    {
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
      label: '反应数',
      value: reactionCount,
      color: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: <Flame className="w-4 h-4 text-xh-gold" />,
      label: '火花数',
      value: sparkCount,
      color: 'bg-xh-gold/10 border-xh-gold/20',
    },
    {
      icon: <Users className="w-4 h-4 text-xh-accent" />,
      label: '匹配数',
      value: matchCount,
      color: 'bg-xh-accent/10 border-xh-accent/20',
    },
    {
      icon: <Book className="w-4 h-4 text-violet-400" />,
      label: '故事数',
      value: storyCount,
      color: 'bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`rounded-xl p-3 border ${stat.color}`}
        >
          <div className="flex items-center gap-2 mb-1">
            {stat.icon}
            <span className="text-xs text-gray-400">{stat.label}</span>
          </div>
          <p className="text-xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
