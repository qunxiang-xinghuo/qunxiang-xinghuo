'use client';

import React from 'react';
import { X, Flame } from 'lucide-react';
import { Message } from './MessageBubble';
import { Identity } from '../identity/IdentityBadge';
import IdentityBadge from '../identity/IdentityBadge';

interface SparkWallProps {
  isOpen: boolean;
  onClose: () => void;
  sparkedMessages: (Message & { userIdentity: Identity })[];
  className?: string;
}

export default function SparkWall({ isOpen, onClose, sparkedMessages, className = '' }: SparkWallProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-[85%] h-full bg-xh-dark border-l border-gray-800 flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-xh-gold" />
            <h3 className="text-white font-medium">火花墙</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {sparkedMessages.map((message) => (
            <div
              key={message.id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
            >
              <div className="flex items-center justify-between mb-2">
                <IdentityBadge identity={message.userIdentity} />
                <span className="text-[10px] text-gray-500">{message.timestamp}</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{message.content}</p>
              <div className="flex justify-end mt-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-xh-gold/20 text-xh-gold text-xs">
                  <Flame className="w-3 h-3 fill-xh-gold" />
                  <span>{message.sparkCount}</span>
                </div>
              </div>
            </div>
          ))}

          {sparkedMessages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">还没有火花，快为精彩的反应点赞吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
