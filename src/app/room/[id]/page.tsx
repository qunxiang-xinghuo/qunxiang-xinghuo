'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import ChatRoom from '@/components/room/ChatRoom';
import { Message } from '@/components/room/MessageBubble';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Flame } from 'lucide-react';

const aiPrompts = [
  '如果是你，会怎么处理这个冲突？',
  '从这个角色的视角，事情为什么会发展到这一步？',
  '你觉得对方心里可能在想什么？',
  '如果这是一个电影场景，下一句台词应该是什么？',
];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user } = useAuth();
  const { isConnected, joinRoom, leaveRoom, sendMessage, markSpark, on, off } = useSocket();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      userId: 'partner',
      content: '你好！很高兴和你匹配到这个脑洞。我是急诊科医生，你呢？',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isSparked: false,
      sparkCount: 0,
    },
  ]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [sparkCount, setSparkCount] = useState(0);
  const [partnerTyping, setPartnerTyping] = useState(false);

  useEffect(() => {
    if (!user || !roomId) return;

    const identity = user.identity?.label || '匿名用户';
    joinRoom(roomId, user.id || 'guest', identity);

    const handleNewMessage = (data: { message: { senderId: string; content: string; createdAt: string } }) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        userId: data.message.senderId === user.id ? 'me' : 'partner',
        content: data.message.content,
        timestamp: new Date(data.message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
      };
      setMessages((prev) => [...prev, msg]);
    };

    const handleSparkMarked = (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, isSparked: true, sparkCount: m.sparkCount + 1 } : m
        )
      );
      setSparkCount((prev) => prev + 1);
    };

    const handleTyping = () => {
      setPartnerTyping(true);
      setTimeout(() => setPartnerTyping(false), 2000);
    };

    on('new-message', handleNewMessage);
    on('spark-marked', handleSparkMarked);
    on('user-typing', handleTyping);

    return () => {
      off('new-message', handleNewMessage);
      off('spark-marked', handleSparkMarked);
      off('user-typing', handleTyping);
      leaveRoom(roomId, user.id || 'guest');
    };
  }, [user, roomId, joinRoom, leaveRoom, on, off]);

  const handleSendMessage = useCallback(
    (content: string) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        userId: 'me',
        content,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
      };
      setMessages((prev) => [...prev, msg]);

      sendMessage(roomId, {
        id: msg.id,
        senderId: user?.id || 'me',
        content,
        createdAt: new Date().toISOString(),
      });
    },
    [roomId, user, sendMessage]
  );

  const handleSparkMessage = useCallback(
    (messageId: string) => {
      markSpark(roomId, messageId, user?.id || 'me');
    },
    [roomId, user, markSpark]
  );

  const partnerIdentity = {
    type: 'recommended' as const,
    label: '急诊科医生',
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        <Flame className="w-12 h-12 text-xh-gold mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
        <p className="text-gray-400 text-sm mb-6">登录后才能进入对白室</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-gradient-to-r from-xh-accent to-rose-600 text-white rounded-xl font-medium"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={`对白室 #${roomId}`}
        showBack
        onBack={() => router.push('/')}
      />
      {!isConnected && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <p className="text-xs text-yellow-400">正在连接实时服务器...</p>
        </div>
      )}
      {partnerTyping && (
        <div className="bg-gray-800/50 px-4 py-1 text-center">
          <p className="text-xs text-gray-400 animate-pulse">对方正在输入...</p>
        </div>
      )}
      <div className="flex-1 relative">
        <ChatRoom
          messages={messages}
          onSendMessage={handleSendMessage}
          onSparkMessage={handleSparkMessage}
          aiPrompts={aiPrompts}
          selectedPromptIndex={selectedPromptIndex}
          onSelectPrompt={setSelectedPromptIndex}
          sparkCount={sparkCount}
          partnerIdentity={partnerIdentity}
        />
      </div>
    </div>
  );
}
