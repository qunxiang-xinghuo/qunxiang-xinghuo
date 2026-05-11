'use client';

import React from 'react';
import { Send, Flame, Sparkles } from 'lucide-react';
import MessageBubble, { Message } from './MessageBubble';
import AIPromptBanner from './AIPromptBanner';
import SparkWall from './SparkWall';
import { Identity } from '../identity/IdentityBadge';

interface ChatRoomProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onSparkMessage: (messageId: string) => void;
  aiPrompts: string[];
  selectedPromptIndex: number;
  onSelectPrompt: (index: number) => void;
  sparkCount: number;
  partnerIdentity: Identity;
  showStoryButton?: boolean;
  onGoToStory?: () => void;
  className?: string;
}

export default function ChatRoom({
  messages, onSendMessage, onSparkMessage, aiPrompts, selectedPromptIndex,
  onSelectPrompt, sparkCount, partnerIdentity, showStoryButton = false,
  onGoToStory, className = '',
}: ChatRoomProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSparkWall, setShowSparkWall] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
  };

  const sparkedMessages = messages
    .filter((m) => m.isSparked)
    .map((m) => ({
      ...m,
      userIdentity: m.userId === 'me' ? { type: 'real' as const, label: '我' } : partnerIdentity,
    }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-xh-gold/10 flex items-center justify-center mb-3 border border-xh-gold/20">
              <Sparkles className="w-5 h-5 text-xh-gold" />
            </div>
            <p className="text-sm text-slate-400 font-medium mb-1">对白室已就绪</p>
            <p className="text-xs text-slate-600">写下你的第一句话，开启这场对撞</p>
          </div>
        )}
        {messages.map((message, idx) => (
          <MessageBubble key={message.id} message={message} onSpark={onSparkMessage} index={idx} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* AI 提示横幅 */}
      <div className="px-4 mb-2">
        <AIPromptBanner
          prompts={aiPrompts}
          selectedPromptIndex={selectedPromptIndex}
          onSelectPrompt={onSelectPrompt}
        />
      </div>

      {/* 输入区 */}
      <div className="p-3 border-t border-slate-700/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/30 px-4 py-2.5 focus-within:border-xh-gold/30 transition-colors">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="写下你的反应..."
              rows={1}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none max-h-24 caret-xh-gold"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 rounded-full transition-all disabled:bg-slate-800/30 disabled:text-slate-600 disabled:border-slate-700/20 bg-xh-btn/15 text-xh-btn border border-xh-btn/25 hover:bg-xh-gold/25 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          <button
            onClick={() => setShowSparkWall(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-xh-yellow/10 text-xh-yellow text-xs border border-xh-yellow/20 hover:bg-xh-yellow/15 transition-colors"
          >
            <Flame className="w-3 h-3" />
            火花墙
            <span className="bg-xh-yellow text-slate-900 text-[10px] px-1.5 rounded-full font-bold min-w-[16px] text-center">
              {sparkCount}
            </span>
          </button>

          {showStoryButton && onGoToStory && (
            <button
              onClick={onGoToStory}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-xh-yellow/15 border border-xh-yellow/20 text-xh-yellow text-sm font-medium hover:bg-xh-yellow/20 transition-colors"
            >
              <Flame className="w-4 h-4" />
              串联故事
            </button>
          )}
        </div>
      </div>

      <SparkWall
        isOpen={showSparkWall}
        onClose={() => setShowSparkWall(false)}
        sparkedMessages={sparkedMessages}
      />
    </div>
  );
}
