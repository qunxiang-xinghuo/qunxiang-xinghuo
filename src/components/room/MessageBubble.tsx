'use client';

import React from 'react';
import { motion } from 'framer-motion';
import SparkButton from '../reaction/SparkButton';

export interface Message {
  id: string;
  userId: 'me' | 'partner';
  content: string;
  timestamp: string;
  isSparked: boolean;
  sparkCount: number;
  identity?: string;
}

interface MessageBubbleProps {
  message: Message;
  onSpark: (messageId: string) => void;
  className?: string;
  index?: number;
}

export default function MessageBubble({ message, onSpark, className = '', index = 0 }: MessageBubbleProps) {
  const isMe = message.userId === 'me';
  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 30 : -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.03,
        type: 'spring',
        stiffness: 200,
        damping: 18,
      }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* 身份标签 */}
        <span className={`text-[10px] text-white/50 ${isMe ? 'text-right' : 'text-left'}`}>
          {message.identity || (isMe ? '我' : '对方')}
        </span>

        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMe
              ? 'bg-xh-gold/15 text-white rounded-tr-none border border-xh-gold/20'
              : 'bg-white/5 text-white rounded-tl-none border border-white/[0.08]'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">{message.timestamp}</span>
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
    </motion.div>
  );
}
