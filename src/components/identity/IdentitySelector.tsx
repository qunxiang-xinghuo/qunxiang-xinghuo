'use client';

import React from 'react';
import { User, Check } from 'lucide-react';
import { Identity } from './IdentityBadge';

interface IdentityOption {
  id: Identity['type'];
  title: string;
  desc: string;
  detail: string;
  badge: string;
  color: string;
}

const identityOptions: IdentityOption[] = [
  {
    id: 'real',
    title: '真实身份',
    desc: '绑定知乎认证，用真实职业标签参与',
    detail: '医生 / 律师 / 教师 / 工程师...',
    badge: '最具可信度',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'recommended',
    title: '推荐身份',
    desc: '系统根据你的回答风格智能推荐',
    detail: '故事讲述者 / 生活观察家 / 逻辑分析师...',
    badge: 'AI推荐',
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'custom',
    title: '自创标签',
    desc: '自定义简短标签，自由表达身份',
    detail: '输入你的专属身份标签',
    badge: '最自由',
    color: 'from-xh-gold to-xh-gold-dark',
  },
];

interface IdentitySelectorProps {
  selectedIdentity: Identity['type'] | null;
  customLabel: string;
  onSelect: (type: Identity['type']) => void;
  onCustomLabelChange: (label: string) => void;
  className?: string;
}

export default function IdentitySelector({
  selectedIdentity,
  customLabel,
  onSelect,
  onCustomLabelChange,
  className = '',
}: IdentitySelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {identityOptions.map((option) => (
        <div
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 ${
            selectedIdentity === option.id
              ? 'border-xh-gold bg-xh-gold/10'
              : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color}`}>
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-medium">{option.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {option.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{option.desc}</p>
              <p className="text-xs text-gray-500">{option.detail}</p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                selectedIdentity === option.id ? 'border-xh-gold bg-xh-gold' : 'border-gray-600'
              }`}
            >
              {selectedIdentity === option.id && (
                <Check className="w-3 h-3 text-xh-primary" strokeWidth={3} />
              )}
            </div>
          </div>

          {option.id === 'custom' && selectedIdentity === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => onCustomLabelChange(e.target.value)}
                placeholder="例如：北漂程序员、三胎妈妈、退休教师..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-xh-btn transition-colors"
                maxLength={20}
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-[10px] text-gray-500 mt-1 text-right">
                {customLabel.length}/20
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
