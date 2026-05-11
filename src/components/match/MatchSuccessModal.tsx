'use client';

import React from 'react';
import { Check, MessageSquare } from 'lucide-react';
import { Identity } from '../identity/IdentityBadge';
import IdentityBadge from '../identity/IdentityBadge';

interface MatchSuccessModalProps {
  isOpen: boolean;
  onEnterChat: () => void;
  partnerIdentity: Identity;
  brainholeTitle: string;
}

export default function MatchSuccessModal({
  isOpen,
  onEnterChat,
  partnerIdentity,
  brainholeTitle,
}: MatchSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-xh-dark rounded-2xl p-6 w-full max-w-sm border border-gray-700 text-center animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-xh-primary z-10">
              我
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-xh-accent to-rose-500 flex items-center justify-center text-white text-xs font-bold border-4 border-xh-primary">
              <div className="text-center">
                <Check className="w-5 h-5 mx-auto mb-0.5" />
                <span className="text-[10px]">搭档</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">匹配成功！</h3>
        <p className="text-sm text-gray-400 mb-4">
          你们都选择了脑洞：
          <br />
          <span className="text-xh-gold font-medium">{brainholeTitle}</span>
        </p>

        <div className="flex items-center justify-center mb-6">
          <IdentityBadge identity={partnerIdentity} />
        </div>

        <button
          onClick={onEnterChat}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white py-4 rounded-xl font-medium shadow-lg"
        >
          <MessageSquare className="w-4 h-4" />
          进入双人对白室
        </button>
      </div>
    </div>
  );
}
