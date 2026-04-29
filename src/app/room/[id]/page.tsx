'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import ChatRoom from '@/components/room/ChatRoom';
import { Message } from '@/components/room/MessageBubble';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Eye } from 'lucide-react';

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
  const [viewerCount, setViewerCount] = useState(12);
  const [brainholeTitle, setBrainholeTitle] = useState('急诊室的冲突');
  const isProcessingAI = useRef(false);

  // 获取房间信息（包括脑洞标题）
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.brainhole?.title) {
          setBrainholeTitle(res.data.brainhole.title);
        }
      })
      .catch(() => {});
  }, [roomId]);

  // 围观人数波动模拟
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(3, prev + change);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // AI 自动回复
  const generateAIReply = useCallback(async (userMessage: string) => {
    if (isProcessingAI.current) return;
    isProcessingAI.current = true;

    setPartnerTyping(true);

    try {
      const systemPrompt = `你是一位有着丰富职业经验的创作者，当前正在一个名为"群像·星火"的创作平台上，与另一位用户进行角色扮演对话。你们的讨论主题是："${brainholeTitle}"。你的身份是"急诊科医生"。请基于你的职业视角，对对方的话做出真实、有深度的回应。保持对话自然，像真人一样思考，不要机械。字数控制在50-100字。`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const result = await res.json();

      // 模拟打字延迟
      const delay = 800 + Math.random() * 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        userId: 'partner',
        content: result.data?.content || '（对方沉默了一会儿）',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI 回复失败:', err);
    } finally {
      setPartnerTyping(false);
      isProcessingAI.current = false;
    }
  }, [brainholeTitle]);

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
    async (content: string) => {
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

      // 触发 AI 回复
      generateAIReply(content);
    },
    [roomId, user, sendMessage, generateAIReply]
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
        <Flame className="w-12 h-12 text-orange-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
        <p className="text-gray-400 text-sm mb-6">登录后才能进入对白室</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-medium"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={`对白室 · ${brainholeTitle}`}
        showBack
        onBack={() => router.push('/')}
      />

      {/* 连接状态 + 围观人数 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          {!isConnected && (
            <span className="text-[10px] text-yellow-400">连接中...</span>
          )}
          {isConnected && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              实时连接
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <Eye className="w-3 h-3" />
          <span>{viewerCount} 人围观</span>
        </div>
      </div>

      {/* 对方输入中 */}
      {partnerTyping && (
        <div className="bg-white/5 px-4 py-1.5 text-center">
          <p className="text-[10px] text-white/40 animate-pulse">对方正在输入...</p>
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
