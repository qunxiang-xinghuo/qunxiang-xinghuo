'use client';

import React from 'react';
import { Send, Flame } from 'lucide-react';
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
  messages,
  onSendMessage,
  onSparkMessage,
  aiPrompts,
  selectedPromptIndex,
  onSelectPrompt,
  sparkCount,
  partnerIdentity,
  showStoryButton = false,
  onGoToStory,
  className = '',
}: ChatRoomProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSparkWall, setShowSparkWall] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const sparkedMessages = messages
    .filter((m) => m.isSparked)
    .map((m) => ({
      ...m,
      userIdentity: m.userId === 'me' ? { type: 'real' as const, label: '我' } : partnerIdentity,
    }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.map((message, idx) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSpark={onSparkMessage}
            index={idx}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 mb-3">
        <AIPromptBanner
          prompts={aiPrompts}
          selectedPromptIndex={selectedPromptIndex}
          onSelectPrompt={onSelectPrompt}
        />
      </div>

      <div className="p-4 border-t border-white/5 bg-[#1a1a2e]/80 backdrop-blur-md">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 px-4 py-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="写下你的反应..."
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder-white/20 resize-none focus:outline-none max-h-24 caret-xh-gold"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 rounded-full transition-all disabled:bg-white/5 disabled:text-white/20 bg-xh-gold/20 text-xh-gold border border-xh-gold/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowSparkWall(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-xh-gold/15 text-xh-gold text-xs border border-xh-gold/20"
          >
            <Flame className="w-3 h-3" />
            火花墙
            <span className="bg-xh-gold text-[#1a1a2e] text-[10px] px-1.5 rounded-full font-bold">
              {sparkCount}
            </span>
          </button>

          {showStoryButton && onGoToStory && (
            <button
              onClick={onGoToStory}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-xh-gold/15 border border-xh-gold/20 text-xh-gold text-sm font-medium"
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
