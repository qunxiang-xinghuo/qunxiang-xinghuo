'use client';

import React from 'react';
import { Mic, Send } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

interface ReactionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ReactionInput({
  value,
  onChange,
  onSubmit,
  placeholder = '在这里写下你的第一反应...',
  disabled = false,
  className = '',
}: ReactionInputProps) {
  const [showVoiceRecorder, setShowVoiceRecorder] = React.useState(false);
  const charCount = value.length;

  const handleVoiceResult = (text: string) => {
    onChange(value + text);
    setShowVoiceRecorder(false);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative flex-1 bg-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden mb-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
          className="w-full h-full bg-transparent p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none disabled:opacity-50"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-gray-600">{charCount} 字</div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowVoiceRecorder(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-800 text-gray-400 border border-gray-700 hover:text-white disabled:opacity-50"
        >
          <Mic className="w-4 h-4" />
          <span>语音输入</span>
        </button>

        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg"
        >
          <Send className="w-4 h-4" />
          <span>记录这个反应</span>
        </button>
      </div>

      {showVoiceRecorder && (
        <VoiceRecorder onResult={handleVoiceResult} onClose={() => setShowVoiceRecorder(false)} />
      )}
    </div>
  );
}
