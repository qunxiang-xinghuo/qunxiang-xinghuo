'use client';

import React from 'react';
import SparkButton from '../reaction/SparkButton';

export interface Message {
  id: string;
  userId: 'me' | 'partner';
  content: string;
  timestamp: string;
  isSparked: boolean;
  sparkCount: number;
}

interface MessageBubbleProps {
  message: Message;
  onSpark: (messageId: string) => void;
  className?: string;
}

export default function MessageBubble({ message, onSpark, className = '' }: MessageBubbleProps) {
  const isMe = message.userId === 'me';
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMe
              ? 'bg-xh-accent text-white rounded-tr-none'
              : 'bg-gray-800 text-white rounded-tl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{message.timestamp}</span>
          {!isMe && (
            <SparkButton
              isSparked={message.isSparked}
              count={message.sparkCount}
              onClick={() => onSpark(message.id)}
              size="sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
