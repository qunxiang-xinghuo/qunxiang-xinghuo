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
      initial={{ opacity: 0, y: isMe ? 10 : 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.02, type: 'spring', stiffness: 250, damping: 20 }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* 身份标签 */}
        <span className={`text-[10px] text-slate-500 ${isMe ? 'text-right' : 'text-left'} px-1`}>
          {message.identity || (isMe ? '我' : '对方')}
        </span>

        {/* 气泡 */}
        <div
          className={`relative rounded-2xl px-4 py-3 ${
            isMe
              ? 'bg-gradient-to-br from-xh-gold/15 to-xh-gold/5 text-slate-100 rounded-tr-sm border border-xh-gold/20'
              : 'bg-slate-800/50 text-slate-100 rounded-tl-sm border border-slate-700/30'
          }`}
        >
          {/* 对方气泡小尾巴 */}
          {!isMe && (
            <div className="absolute -left-1 top-0 w-2 h-2 bg-slate-800/50 border-l border-t border-slate-700/30 rotate-45" />
          )}
          {/* 我方气泡小尾巴 */}
          {isMe && (
            <div className="absolute -right-1 top-0 w-2 h-2 bg-xh-gold/15 border-r border-t border-xh-gold/20 rotate-45" />
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* 时间 + 火花 */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] text-slate-600">{message.timestamp}</span>
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
