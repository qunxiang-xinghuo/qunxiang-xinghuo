'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, Sparkles, ArrowLeft, Flame, XCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  identity?: string;
  isSpark?: boolean;
}

// v6.0: 微信聊天风格对白室
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user: authUser } = useAuth();
  const savedIdentity = typeof window !== 'undefined' ? localStorage.getItem('xh_duo_identity') : null;
  const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;
  const user = authUser || (savedIdentity ? {
    id: savedUserId || 'guest-' + Date.now(),
    name: savedIdentity,
    identity: { type: 'custom' as const, label: savedIdentity },
  } : null);
  const { isConnected, joinRoom, leaveRoom, sendMessage, on, off } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [brainholeTitle, setBrainholeTitle] = useState('');
  const [brainholeScenario, setBrainholeScenario] = useState('');
  const [myIdentity, setMyIdentity] = useState('我');
  const [isAiRoom, setIsAiRoom] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [assetSaved, setAssetSaved] = useState(false);
  const isProcessingAI = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加载房间信息
  useEffect(() => {
    const guestId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;
    const localIdentity = typeof window !== 'undefined' ? localStorage.getItem('xh_duo_identity') : null;
    fetch(`/api/rooms/${roomId}`, { headers: guestId ? { 'x-guest-id': guestId } : {} })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const room = res.data;
          if (room.brainhole) {
            setBrainholeTitle(room.brainhole.title);
            setBrainholeScenario(room.brainhole.scenario || '');
          }
          setIsAiRoom(room.type === 'ai_duet');
          if (localIdentity) setMyIdentity(localIdentity);

          if (room.messages && Array.isArray(room.messages)) {
            const history: Message[] = room.messages.map((m: any) => ({
              id: m.id,
              userId: m.senderId,
              content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              identity: m.identity,
              isSpark: m.isSpark,
            }));
            setMessages(history);
          }
        }
      })
      .catch((err) => console.error('[Room] Fetch room error:', err))
      .finally(() => setIsLoading(false));
  }, [roomId, user?.id]);

  // AI 动态催化问题（30秒推送一次）
  useEffect(() => {
    if (!brainholeTitle) return;
    loadAiPrompts();
    const interval = setInterval(loadAiPrompts, 30000);
    return () => clearInterval(interval);
  }, [brainholeTitle, messages]);

  async function loadAiPrompts() {
    try {
      const lastMessages = messages.slice(-6).map(m => ({
        role: m.userId === user?.id ? 'user' : 'assistant',
        content: m.content,
      }));
      const res = await fetch('/api/ai/catalyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: brainholeTitle,
          messages: lastMessages,
          identity: myIdentity,
        }),
      });
      const data = await res.json();
      if (data.data?.prompts) {
        setAiPrompts(data.data.prompts);
      }
    } catch (e) {
      console.error('AI催化加载失败:', e);
    }
  }

  // AI 回复
  const generateAIReply = useCallback(async (userMessage: string) => {
    if (isProcessingAI.current) return;
    isProcessingAI.current = true;
    setPartnerTyping(true);
    try {
      const historyMessages = messages.slice(-10).map((msg) => ({
        role: msg.userId === user?.id ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...historyMessages, { role: 'user', content: userMessage }],
          topic: brainholeTitle || '一个有趣的话题',
        }),
      });
      const result = await res.json();
      const delay = 800 + Math.random() * 1200;
      await new Promise((resolve) => setTimeout(resolve, delay));
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        userId: 'liu_kanshan_ai',
        content: result.data?.content || '嗯，我能感受到你话里的分量。愿意多说说吗？',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        identity: '刘看山',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setPartnerTyping(false);
      isProcessingAI.current = false;
    }
  }, [brainholeTitle, messages, user?.id]);

  // WebSocket
  useEffect(() => {
    if (!user || !roomId) return;
    const identity = myIdentity || user.identity?.label || '匿名';
    joinRoom(roomId, user.id || 'guest', identity);

    const handleNewMessage = (data: { message: { senderId: string; content: string; createdAt: string; identity?: string } }) => {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        userId: data.message.senderId,
        content: data.message.content,
        timestamp: new Date(data.message.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        identity: data.message.identity,
      };
      setMessages((prev) => [...prev, msg]);
    };
    const handleTyping = () => { setPartnerTyping(true); setTimeout(() => setPartnerTyping(false), 2000); };

    on('new-message', handleNewMessage);
    on('user-typing', handleTyping);

    return () => {
      off('new-message', handleNewMessage);
      off('user-typing', handleTyping);
      leaveRoom(roomId, user.id || 'guest');
    };
  }, [user, roomId, myIdentity, joinRoom, leaveRoom, on, off]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const msg: Message = {
      id: `msg-${Date.now()}`,
      userId: user?.id || 'me',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      identity: myIdentity,
    };
    setMessages((prev) => [...prev, msg]);
    sendMessage(roomId, { id: msg.id, senderId: user?.id || 'me', content, createdAt: new Date().toISOString() });
    if (isAiRoom) generateAIReply(content);
  }, [roomId, user, myIdentity, isAiRoom, inputValue, sendMessage, generateAIReply]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
  };

  // 标记为火花
  const markAsSpark = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/spark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, isSpark: true } : m));
    } catch (e) {
      console.error('标记火花失败:', e);
    }
  }, [roomId]);

  // 结束对白并保存
  const handleEndChat = useCallback(async () => {
    if (savingAsset || assetSaved) return;
    setSavingAsset(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ roomId }),
      });
      const result = await res.json();
      if (result.success || result.data?.asset) {
        setAssetSaved(true);
        router.push('/library');
      }
    } catch (err) {
      console.error('保存失败:', err);
    } finally {
      setSavingAsset(false);
    }
  }, [roomId, savingAsset, assetSaved, router]);

  // 获取用户头像组件
  const UserAvatar = ({ isMe }: { isMe: boolean }) => (
    <div className={`flex-shrink-0 ${isMe ? 'ml-2' : 'mr-2'}`}>
      {isMe ? (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/20 flex items-center justify-center">
          <span className="text-xs text-[#e2b04a] font-bold">我</span>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#74b9ff]/20 bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10">
          <Image src="/liukanshan.jpg" alt="刘看山" width={32} height={32} className="object-cover" sizes="32px" />
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在加载对白室...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      {/* 顶部标题栏 + 脑洞信息 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white/90 truncate">{brainholeTitle || '对白室'}</h1>
            {brainholeScenario && (
              <p className="text-[11px] text-white/30 truncate mt-0.5">{brainholeScenario}</p>
            )}
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              在线
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              连接中
            </span>
          )}
        </div>
      </div>

      {/* AI 催化区 */}
      {aiPrompts.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-[#e2b04a]/60" />
            <span className="text-[10px] text-white/30">AI 催化</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {aiPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputValue(prompt);
                  inputRef.current?.focus();
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#e2b04a]/8 border border-[#e2b04a]/15 text-[11px] text-[#e2b04a]/80 hover:bg-[#e2b04a]/15 transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 消息列表 —— 微信聊天风格 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">对白室已就绪</p>
            <p className="text-xs text-white/20 mt-1">写下你的第一句话，开启这场对撞</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === user?.id || msg.userId === 'me';
          const isLiuKanshan = msg.userId === 'liu_kanshan_ai';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <UserAvatar isMe={isMe} />
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {/* 姓名标签 */}
                <span className="text-[10px] text-white/25 mb-1 px-1">
                  {isMe ? (user?.name || '我') : (isLiuKanshan ? '刘看山' : (msg.identity || '对方'))}
                </span>
                {/* 消息气泡 */}
                <div className={`relative px-3.5 py-2.5 rounded-2xl ${
                  isMe
                    ? 'bg-[#e2b04a]/15 border border-[#e2b04a]/20 text-white/90 rounded-br-md'
                    : 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isMe ? 'text-[#e2b04a]/30' : 'text-white/20'}`}>
                      {msg.timestamp}
                    </span>
                    {/* 火花标记按钮 */}
                    {!isMe && !msg.isSpark && (
                      <button
                        onClick={() => markAsSpark(msg.id)}
                        className="text-[10px] text-white/15 hover:text-[#e2b04a] transition-colors flex items-center gap-0.5"
                      >
                        <Flame className="w-3 h-3" />
                        火花
                      </button>
                    )}
                    {msg.isSpark && (
                      <span className="text-[10px] text-[#e2b04a] flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        火花
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {partnerTyping && (
          <div className="flex flex-row">
            <UserAvatar isMe={false} />
            <div className="flex flex-col items-start max-w-[70%]">
              <span className="text-[10px] text-white/25 mb-1 px-1">刘看山</span>
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/5 rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 + 结束按钮 */}
      <div className="shrink-0 p-3 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        {/* 结束按钮 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={handleEndChat}
            disabled={savingAsset || assetSaved}
            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full transition-colors ${
              assetSaved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400/60 border border-red-500/20 hover:bg-red-500/15'
            }`}
          >
            <XCircle className="w-3 h-3" />
            {savingAsset ? '保存中...' : assetSaved ? '已保存' : '结束对白'}
          </button>
          <span className="text-[10px] text-white/15">{messages.length} 条消息</span>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/[0.05] rounded-2xl border border-white/10 px-4 py-2.5 focus-within:border-[#e2b04a]/30 transition-colors">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="写下你的反应..."
              rows={1}
              className="w-full bg-transparent text-sm text-white/90 placeholder-white/20 resize-none focus:outline-none max-h-24 caret-[#e2b04a]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 rounded-full transition-all disabled:bg-white/[0.03] disabled:text-white/10 disabled:border-white/5 bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25 hover:bg-[#e2b04a]/25 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
