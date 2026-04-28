'use client';

import React from 'react';
import { User } from 'lucide-react';

export interface Identity {
  type: 'real' | 'recommended' | 'custom';
  label: string;
}

interface IdentityBadgeProps {
  identity: Identity;
  className?: string;
  showIcon?: boolean;
}

export default function IdentityBadge({ identity, className = '', showIcon = true }: IdentityBadgeProps) {
  const colorClasses = {
    real: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    recommended: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    custom: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClasses[identity.type]} ${className}`}>
      {showIcon && <User className="w-3 h-3" />}
      <span>{identity.label}</span>
    </div>
  );
}
