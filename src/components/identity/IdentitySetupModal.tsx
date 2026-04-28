'use client';

import React from 'react';
import { X } from 'lucide-react';
import IdentitySelector from './IdentitySelector';
import { Identity } from './IdentityBadge';

interface IdentitySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (identity: Identity) => void;
  selectedIdentity: Identity['type'] | null;
  customLabel: string;
  onSelect: (type: Identity['type']) => void;
  onCustomLabelChange: (label: string) => void;
}

export default function IdentitySetupModal({
  isOpen,
  onClose,
  onConfirm,
  selectedIdentity,
  customLabel,
  onSelect,
  onCustomLabelChange,
}: IdentitySetupModalProps) {
  if (!isOpen) return null;

  const isValid =
    selectedIdentity && (selectedIdentity !== 'custom' || customLabel.trim().length > 0);

  const handleConfirm = () => {
    if (!isValid) return;
    let label = '';
    if (selectedIdentity === 'real') label = '知乎认证用户';
    else if (selectedIdentity === 'recommended') label = '故事讲述者';
    else if (selectedIdentity === 'custom') label = customLabel.trim();
    onConfirm({ type: selectedIdentity, label });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-xh-dark rounded-2xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">选择你的身份</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          你的身份标签会伴随每一次反应记录，
          <br />
          让读者知道“这是一个_____的真实想法”。
        </p>

        <IdentitySelector
          selectedIdentity={selectedIdentity}
          customLabel={customLabel}
          onSelect={onSelect}
          onCustomLabelChange={onCustomLabelChange}
          className="mb-6"
        />

        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-medium text-center transition-all ${
            isValid
              ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认身份，进入脑洞广场
        </button>
      </div>
    </div>
  );
}
