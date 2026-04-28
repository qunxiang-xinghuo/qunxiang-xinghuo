'use client';

import { useState, useEffect } from 'react';

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  isSpark: boolean;
  isSelf: boolean;
}

export interface Room {
  id: string;
  brainholeTitle: string;
  participants: {
    id: string;
    name: string;
    identity: string;
    isOnline: boolean;
  }[];
  sparks: number;
  status: 'waiting' | 'active' | 'finished';
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock room data
    setTimeout(() => {
      setRoom({
        id: roomId,
        brainholeTitle: '如果某天醒来，全世界只剩下你一个人，你会先去哪个地方？为什么？',
        participants: [
          { id: 'self', name: '我', identity: '程序员', isOnline: true },
          { id: 'partner', name: '搭档', identity: '设计师', isOnline: true },
        ],
        sparks: 2,
        status: 'active',
      });

      // Mock initial messages
      setMessages([
        { id: '1', userId: 'partner', content: '我先说吧。如果是我在急诊室值班，突然全世界只剩我一个人，我第一反应会是——所有监护仪同时静默的那一秒。', timestamp: '14:32', isSpark: true, isSelf: false },
        { id: '2', userId: 'self', content: '哇，那个画面太有冲击力了。我是做程序的，我会下意识去检查服务器还在不在跑，就好像确认世界是不是只是网络断了。', timestamp: '14:33', isSpark: false, isSelf: true },
        { id: '3', userId: 'partner', content: '哈哈，你比我理性多了。但我猜，最多十分钟后，你也会走出房间，去确认还有没有活物。', timestamp: '14:34', isSpark: false, isSelf: false },
        { id: '4', userId: 'self', content: '会的。而且我可能会先去便利店，不是找吃的，是找个能发出声音的东西，证明"热闹"还存在。', timestamp: '14:35', isSpark: true, isSelf: true },
      ]);
      setLoading(false);
    }, 500);
  }, [roomId]);

  const sendMessage = (content: string, isSpark = false) => {
    const newMessage: Message = {
      id: 'msg-' + Date.now(),
      userId: 'self',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isSpark,
      isSelf: true,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const addSpark = () => {
    setRoom(prev => prev ? { ...prev, sparks: prev.sparks + 1 } : null);
  };

  return {
    room,
    messages,
    loading,
    sendMessage,
    addSpark,
  };
}
