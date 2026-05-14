'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Flame, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useSocket } from '@/hooks/useSocket';
import Image from 'next/image';
import { getErrorMessage, getErrorCode } from "@/lib/error-utils";

interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  identity?: string;
  isSpark?: boolean;
}

interface RoomData {
  id: string;
  type: string;
  status: string;
  brainhole: {
    title: string;
    scenario: string;
  } | null;
  messages?: Array<{
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    identity?: string;
    isSpark?: boolean;
  }>;
  participants?: Array<{
    userId: string;
    identity: string;
    role: string;
    isOnline: boolean;
  }>;
}

export default function SpectateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [mounted, setMounted] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [roomList, setRoomList] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const { isConnected, joinRoom, leaveRoom, sendLike, on, off } = useSocket();

  useEffect(() => {
    setMounted(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 从 localStorage 获取公开房间列表
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xh_spectate_rooms');
      if (saved) {
        const list = JSON.parse(saved) as string[];
        setRoomList(list);
        const idx = list.indexOf(roomId);
        setCurrentIdx(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      console.error('[Spectate] parse room list error:', e);
    }
  }, [roomId]);

  // 加载房间数据
  const loadRoom = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      // 先注册为 spectator
      await fetch(`/api/rooms/${id}/spectate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ identity: '观众' }),
      });

      // 获取房间详情
      const res = await fetch(`/api/rooms/${id}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      if (!res.ok) {
        console.error(`[Spectate] fetch room ${id} failed: ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        const r = data.data as RoomData;
        setRoom(r);
        if (r.messages) {
          setMessages(r.messages.map((m) => ({
            id: m.id,
            userId: m.senderId,
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            identity: m.identity,
            isSpark: m.isSpark,
          })));
        }
      }
    } catch (e) {
      console.error('[Spectate] 加载房间失败:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    loadRoom(roomId);
  }, [roomId, loadRoom]);

  // Socket
  const stableUserIdRef = useRef(`spectator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const stableUserId = stableUserIdRef.current;

  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId, stableUserId, '观众');

    const handleNewMessage = (data: unknown) => {
      const raw = data as { id?: string; content?: string; senderId?: string; userId?: string; createdAt?: string; identity?: string; isSpark?: boolean };
      const msgId = raw.id || `msg-${Date.now()}`;
      if (!raw.content) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, {
          id: msgId,
          userId: raw.senderId || raw.userId || 'unknown',
          content: raw.content || '',
          timestamp: new Date(raw.createdAt || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          identity: raw.identity || '',
          isSpark: raw.isSpark || false,
        }];
      });
    };

    const handleNewLike = () => {
      if (!mountedRef.current) return;
      setLikeCount((prev) => prev + 1);
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
      likeTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setLikeCount((prev) => Math.max(0, prev - 1));
      }, 1500);
    };

    const handleViewerCount = (data: { count: number; roomId: string }) => {
      if (data.roomId === roomId) {
        setViewerCount(data.count);
      }
    };

    on('new-message', handleNewMessage);
    on('new-like', handleNewLike);
    on('room-viewer-count', handleViewerCount);

    return () => {
      off('new-message', handleNewMessage);
      off('new-like', handleNewLike);
      off('room-viewer-count', handleViewerCount);
      leaveRoom(roomId, stableUserId);
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
    };
  }, [roomId, joinRoom, leaveRoom, on, off, stableUserId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 上下滑动切换房间
  const switchRoom = useCallback((direction: 'up' | 'down') => {
    if (roomList.length < 2 || isSwitching) return;
    let nextIdx = direction === 'up' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = roomList.length - 1;
    if (nextIdx >= roomList.length) nextIdx = 0;
    setIsSwitching(true);
    setCurrentIdx(nextIdx);
    router.push(`/spectate/${roomList[nextIdx]}`);
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) setIsSwitching(false);
    }, 600);
  }, [roomList, currentIdx, isSwitching, router]);

  const swipeHandlers = useSwipeable({
    onSwipedUp: () => switchRoom('up'),
    onSwipedDown: () => switchRoom('down'),
    trackMouse: false,
    delta: 50,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#8a9ab0]/30 border-t-[#3B82F6] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在进入围观房间...</p>
      </div>
    );
  }

  const isAiAgent = (uid: string) => uid === 'agent_catalyst' || uid === 'liu_kanshan_ai';

  return (
    <div className="flex flex-col h-full page-gradient" {...swipeHandlers}>
      {/* 顶部栏 —— 抖音直播风格 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white/90 truncate">
              {room?.brainhole?.title || '围观房间'}
            </h1>
            <p className="text-[10px] text-white/30 truncate mt-0.5">
              {room?.brainhole?.scenario || ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 👁 在线人数 */}
            <div className="flex items-center gap-1 text-[11px] text-white/40">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewerCount}</span>
            </div>
            {/* 连接状态 */}
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                在线
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-xh-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-xh-gold" />
                连接中
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 消息流 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">房间暂无消息</p>
            <p className="text-xs text-white/20 mt-1">等待参与者开始对话</p>
          </div>
        )}
        {messages.map((msg) => {
          const isAi = isAiAgent(msg.userId);
          return (
            <div key={msg.id} className="flex flex-row">
              {/* 头像 */}
              <div className="flex-shrink-0 mr-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#74b9ff]/20 bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10">
                  <Image
                    src="/liukanshan.jpg"
                    alt={isAi ? 'AI' : '用户'}
                    width={32}
                    height={32}
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start max-w-[75%]">
                <span className="text-[10px] text-white/25 mb-1 px-1">
                  {isAi ? (msg.identity || '刘看山') : (msg.identity || '对方')}
                </span>
                <div className="relative px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/20">{msg.timestamp}</span>
                    {msg.isSpark && (
                      <span className="text-[10px] text-[#8a9ab0] flex items-center gap-0.5">
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
        <div ref={messagesEndRef} />
      </div>

      {/* 滑动切换提示 + 观众操作区 */}
      <div className="shrink-0 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        {/* 点赞动画 */}
        {likeCount > 0 && (
          <div className="relative h-0">
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
              {Array.from({ length: Math.min(likeCount, 5) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={mounted ? { opacity: 1, y: 0, scale: 1 } : false}
                  animate={{ opacity: 0, y: -60 - i * 15, scale: 1.5, x: (i - 2) * 20 }}
                  transition={{ duration: 1.2, delay: i * 0.08 }}
                  className="absolute text-[#8a9ab0] text-xl"
                >
                  ❤️
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3">
          {/* 左：切换提示 */}
          <div className="flex flex-col gap-0.5 text-white/20">
            {currentIdx > 0 && (
              <span className="text-[10px] flex items-center gap-0.5">
                <ChevronUp className="w-3 h-3" /> 上一个房间
              </span>
            )}
            {currentIdx < roomList.length - 1 && (
              <span className="text-[10px] flex items-center gap-0.5">
                <ChevronDown className="w-3 h-3" /> 下一个房间
              </span>
            )}
          </div>

          {/* 中：观众标识 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#74b9ff]/60 bg-[#74b9ff]/10 px-2 py-1 rounded-full border border-[#74b9ff]/20">
              👁 观众模式
            </span>
            <span className="text-[10px] text-white/20 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {viewerCount}
            </span>
          </div>

          {/* 右：点赞 */}
          <button
            onClick={() => {
              sendLike(roomId, stableUserId, '观众');
              setLikeCount((prev) => prev + 1);
              if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
              likeTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) setLikeCount((prev) => Math.max(0, prev - 1));
              }, 1500);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#8a9ab0]/10 text-[#8a9ab0] border border-[#8a9ab0]/20 text-xs hover:bg-[#3B82F6]/20 active:scale-95 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            点赞
          </button>
        </div>
      </div>
    </div>
  );
}
