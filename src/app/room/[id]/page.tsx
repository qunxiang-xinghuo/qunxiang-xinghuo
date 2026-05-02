'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import ChatRoom from '@/components/room/ChatRoom';
import { Message } from '@/components/room/MessageBubble';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import { Flame, Eye, Sparkles, Bookmark, XCircle } from 'lucide-react';

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
  const { user: authUser } = useAuth();
  // v5.2-fix: 优先从localStorage获取稳定的身份和userId
  // 确保房间参与者匹配时userId一致
  const savedIdentity = typeof window !== 'undefined' ? localStorage.getItem('xh_duo_identity') : null;
  const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;
  const user = authUser || (savedIdentity ? {
    id: savedUserId || 'guest-' + Date.now(),
    name: savedIdentity,
    identity: { type: 'custom' as const, label: savedIdentity },
  } : null);
  const { isConnected, joinRoom, leaveRoom, sendMessage, markSpark, on, off } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [sparkCount, setSparkCount] = useState(0);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [viewerCount, setViewerCount] = useState(12);
  const [brainholeTitle, setBrainholeTitle] = useState('');
  const [brainholeScenario, setBrainholeScenario] = useState('');
  const [partnerIdentity, setPartnerIdentity] = useState({ type: 'recommended' as const, label: '对方' });
  const [myIdentity, setMyIdentity] = useState('我');
  const [isAiRoom, setIsAiRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [assetSaved, setAssetSaved] = useState(false);
  const assetSavedRef = useRef(false);
  const isProcessingAI = useRef(false);

  // v5.2-fix: 获取房间信息，优先使用localStorage中的身份作为回退
  useEffect(() => {
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;
    const localIdentity = typeof window !== 'undefined' ? localStorage.getItem('xh_duo_identity') : null;
    fetch(`/api/rooms/${roomId}`, {
      headers: guestId ? { 'x-guest-id': guestId } : {},
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const room = res.data;
          console.log('[Room] Room data:', room);

          // 设置脑洞信息
          if (room.brainhole) {
            setBrainholeTitle(room.brainhole.title);
            setBrainholeScenario(room.brainhole.scenario || '');
          }

          // 判断是否是AI房间
          const aiRoom = room.type === 'ai_duet';
          setIsAiRoom(aiRoom);

          // 从参与者信息中获取身份
          let myIdentityLabel = localIdentity || '我';
          let partnerIdentityLabel = aiRoom ? '刘看山' : '对方';

          if (room.participants && Array.isArray(room.participants)) {
            // v5.2-fix: 先尝试用userId匹配，如果失败则尝试用identity匹配
            let me = room.participants.find((p: any) => p.userId === user?.id);
            // 如果userId不匹配（guest id变化），尝试找非AI/非对方的参与者
            if (!me && room.participants.length > 0) {
              me = room.participants.find((p: any) => p.userId !== 'liu_kanshan_ai');
            }
            const partner = room.participants.find((p: any) => p.userId !== (me?.userId || user?.id));

            if (me) {
              myIdentityLabel = me.identity || localIdentity || '我';
              setMyIdentity(myIdentityLabel);
            } else if (localIdentity) {
              // 参与者记录没找到，但localStorage有身份，直接使用
              setMyIdentity(localIdentity);
            }

            if (partner) {
              partnerIdentityLabel = partner.identity || (aiRoom ? '刘看山' : '对方');
              setPartnerIdentity({
                type: 'recommended',
                label: partnerIdentityLabel,
              });
            } else if (aiRoom) {
              setPartnerIdentity({ type: 'recommended', label: '刘看山' });
            }
          } else if (localIdentity) {
            // 没有参与者记录，但localStorage有身份
            setMyIdentity(localIdentity);
          }

          // 加载历史消息
          if (room.messages && Array.isArray(room.messages)) {
            const myId = user?.id;
            const effectiveIdentity = myIdentityLabel;
            const historyMessages: Message[] = room.messages.map((m: any) => ({
              id: m.id,
              userId: m.senderId === myId ? 'me' : 'partner',
              content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              isSparked: m.isSpark,
              sparkCount: m.isSpark ? 1 : 0,
              identity: m.identity || (m.senderId === myId ? effectiveIdentity : partnerIdentityLabel),
            }));
            setMessages(historyMessages);
          }
        }
      })
      .catch((err) => {
        console.error('[Room] Fetch room error:', err);
      })
      .finally(() => setIsLoading(false));
  }, [roomId, user?.id]);

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
  // v4.8: 带上最近5-10条历史消息作为上下文，同时调用DeepSeek+知乎直答
  const generateAIReply = useCallback(async (userMessage: string) => {
    if (isProcessingAI.current) return;
    isProcessingAI.current = true;

    setPartnerTyping(true);

    try {
      // v4.8: 收集最近10条历史消息作为上下文
      const historyMessages = messages.slice(-10).map((msg) => ({
        role: msg.userId === 'me' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));

      console.log('[Room AI] 发送消息, 历史上下文条数:', historyMessages.length, 'topic:', brainholeTitle);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...historyMessages,
            { role: 'user', content: userMessage },
          ],
          topic: brainholeTitle || '一个有趣的话题',
        }),
      });

      const result = await res.json();
      console.log('[Room AI] 收到回复, source:', result.data?.source);

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
  }, [brainholeTitle, messages]);

  useEffect(() => {
    if (!user || !roomId) return;

    const identity = myIdentity || user.identity?.label || '匿名用户';
    joinRoom(roomId, user.id || 'guest', identity);

    const handleNewMessage = (data: { message: { senderId: string; content: string; createdAt: string; identity?: string } }) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        userId: data.message.senderId === user.id ? 'me' : 'partner',
        content: data.message.content,
        timestamp: new Date(data.message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
        identity: data.message.identity || (data.message.senderId === user.id ? myIdentity : partnerIdentity.label),
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
  }, [user, roomId, myIdentity, partnerIdentity, joinRoom, leaveRoom, on, off]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        userId: 'me',
        content,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isSparked: false,
        sparkCount: 0,
        identity: myIdentity,
      };
      setMessages((prev) => [...prev, msg]);

      sendMessage(roomId, {
        id: msg.id,
        senderId: user?.id || 'me',
        content,
        createdAt: new Date().toISOString(),
      });

      // AI房间才触发AI回复
      if (isAiRoom) {
        generateAIReply(content);
      }
    },
    [roomId, user, myIdentity, isAiRoom, sendMessage, generateAIReply]
  );

  const handleSparkMessage = useCallback(
    (messageId: string) => {
      markSpark(roomId, messageId, user?.id || 'me');
    },
    [roomId, user, markSpark]
  );

  // v4.8: 保存对白到素材库（支持自动保存）
  const saveAssetInternal = useCallback(async () => {
    if (!roomId || assetSavedRef.current) return false;
    setIsSavingAsset(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      const result = await res.json();
      if (result.success) {
        setAssetSaved(true);
        assetSavedRef.current = true;
        return true;
      }
    } catch (err) {
      console.error('Save asset failed:', err);
    } finally {
      setIsSavingAsset(false);
    }
    return false;
  }, [roomId]);

  const handleSaveAsset = useCallback(async () => {
    await saveAssetInternal();
  }, [saveAssetInternal]);

  // v4.8: 结束对撞，保存并退出
  const handleEndChat = useCallback(async () => {
    await saveAssetInternal();
    router.push('/library');
  }, [saveAssetInternal, router]);

  // v4.8: 组件卸载时自动保存对白记录
  useEffect(() => {
    return () => {
      if (roomId && !assetSavedRef.current) {
        // 使用 sendBeacon 或 keep-alive fetch 确保请求发出
        try {
          fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId }),
            keepalive: true,
          }).catch(() => {});
        } catch {
          // 静默失败
        }
      }
    };
  }, [roomId]);

  // v4.3-fix: 删除硬拦截登录页。双人流程中已登录，useAuth不读取NextAuth session
  // 允许无user状态进入房间，使用fallback身份

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-white/20 border-t-xh-gold rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/40">正在加载房间...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar
        title="对白实验室"
        showBack
        onBack={() => router.back()}
      />

      {/* 脑洞信息区 - 固定顶部 */}
      <div className="shrink-0 px-4 py-3 bg-[rgba(226,176,74,0.1)] border-b border-[#e2b04a]/20">
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-[#e2b04a] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#e2b04a] truncate">{brainholeTitle || '对白实验室'}</h3>
            {brainholeScenario && (
              <p className="text-[11px] text-[#e2b04a]/60 mt-0.5 line-clamp-2">{brainholeScenario}</p>
            )}
          </div>
        </div>
      </div>

      {/* 连接状态 + 保存素材 + 围观人数 */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          {!isConnected && (
            <span className="text-[10px] text-yellow-400">连接中...</span>
          )}
          {isConnected && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isAiRoom ? 'AI 对话' : '实时连接'}
            </span>
          )}
          {/* v5.0: 保存到素材库 + 结束对撞，触控区域最小44px */}
          <button
            onClick={handleSaveAsset}
            disabled={isSavingAsset || assetSaved}
            className={`flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full transition-colors ${
              assetSaved
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
            }`}
          >
            <Bookmark className={`w-3 h-3 ${assetSaved ? 'fill-current' : ''}`} />
            {isSavingAsset ? '保存中...' : assetSaved ? '已保存' : '存素材库'}
          </button>
          <button
            onClick={handleEndChat}
            className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <XCircle className="w-3 h-3" />
            结束对撞
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <Eye className="w-3 h-3" />
          <span>{viewerCount} 人围观</span>
        </div>
      </div>

      {/* 对方输入中 */}
      {partnerTyping && (
        <div className="bg-white/5 px-4 py-1.5 text-center shrink-0">
          <p className="text-[10px] text-white/40 animate-pulse">
            {partnerIdentity.label}正在输入...
          </p>
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
