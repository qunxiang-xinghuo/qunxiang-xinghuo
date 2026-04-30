'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import ChatRoom from '@/components/room/ChatRoom';
import { Message } from '@/components/room/MessageBubble';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Eye, Sparkles } from 'lucide-react';

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
      content: '你好！很高兴和你匹配到这个脑洞。我是刘看山，今天陪你一起探索这个故事。',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isSparked: false,
      sparkCount: 0,
      identity: '刘看山',
    },
  ]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [sparkCount, setSparkCount] = useState(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [viewerCount, setViewerCount] = useState(12);
  const [brainholeTitle, setBrainholeTitle] = useState('急诊室的冲突');
  const [brainholeScenario, setBrainholeScenario] = useState('一位急诊科医生在值班时遇到了一位特殊的病人...');
  const isProcessingAI = useRef(false);

  // 获取房间信息
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.brainhole) {
          setBrainholeTitle(res.data.brainhole.title);
          setBrainholeScenario(res.data.brainhole.scenario || '');
        }
      })
      .catch(() => {});
  }, [roomId]);

  // 围观人数波动
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(3, prev + change);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // AI 自动回复 - 刘看山温暖治愈语气
  const generateAIReply = useCallback(async (userMessage: string) => {
    if (isProcessingAI.current) return;
    isProcessingAI.current = true;

    setPartnerTyping(true);

    try {
      const systemPrompt = `你是刘看山，一位温暖、治愈、富有同理心的对话伙伴。你正在"群像·星火"创作平台上，与用户进行角色扮演对话。当前讨论主题是："${brainholeTitle}"。

你的语气特点：
- 温暖亲切，像一位懂你的朋友
- 善于倾听，能捕捉到对方话语中的情绪
- 回应有深度但不说教，会分享感受和思考
- 语言自然流畅，像真人聊天一样
- 字数控制在50-80字

请基于对话主题，用温暖治愈的语气回复对方。`;

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
        content: result.data?.content || '（刘看山静静地听你说完，眼神里满是理解）',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
        identity: '刘看山',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI 回复失败:', err);
      // fallback
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        userId: 'partner',
        content: '嗯，我能感受到你话里的分量。愿意多说说吗？',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
        identity: '刘看山',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
        identity: data.message.senderId === user.id ? (user.identity?.label || '我') : '对方',
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
        identity: user?.identity?.label || '我',
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
    label: '刘看山',
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6 bg-[#1a1a2e]">
        <Sparkles className="w-12 h-12 text-xh-gold mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
        <p className="text-white/40 text-sm mb-6">登录后才能进入对白室</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-gradient-to-r from-xh-gold to-orange-500 text-white rounded-xl font-medium"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar
        title="对白实验室"
        showBack
        onBack={() => router.push('/')}
      />

      {/* 脑洞信息区 - 固定顶部 */}
      <div className="shrink-0 px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-xh-gold mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{brainholeTitle}</h3>
            {brainholeScenario && (
              <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{brainholeScenario}</p>
            )}
          </div>
        </div>
      </div>

      {/* 连接状态 + 围观人数 */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5 shrink-0">
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
        <div className="bg-white/5 px-4 py-1.5 text-center shrink-0">
          <p className="text-[10px] text-white/40 animate-pulse">刘看山正在输入...</p>
        </div>
      )}

      <div className="flex-1 min-h-0">
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
