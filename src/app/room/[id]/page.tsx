'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Flame, MessageCircle, Send, Trash2, Sparkles, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import Image from 'next/image';

interface Message {
  id: string; userId: string; content: string;
  timestamp: string; identity?: string; isSpark?: boolean;
}

interface CommentItem {
  id: string; content: string; createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface StoryInfo {
  id: string; title: string; eraBackground: string;
  act1Reveal: string; act2Reveal: string; act3Reveal: string; act4Truth: string;
}

// v8.0: 对白室 — 支持实时聊天+只读浏览+故事系统
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user: authUser } = useAuth();
  const { isConnected, joinRoom, leaveRoom, sendMessage, on, off, removeAllListeners } = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [roomStatus, setRoomStatus] = useState<'created' | 'active' | 'closed'>('created');
  const [roomType, setRoomType] = useState('');
  const [isAiRoom, setIsAiRoom] = useState(false);

  // 故事信息
  const [story, setStory] = useState<StoryInfo | null>(null);
  const [myRoleName, setMyRoleName] = useState('');
  const [myOpeningInfo, setMyOpeningInfo] = useState('');
  const [aiRoleName, setAiRoleName] = useState('');

  // 评论区
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // AI 催化
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingAI = useRef(false);

  // 当前用户ID
  const userId = authUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null);

  // 滚动到底部
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 加载房间信息
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const room = res.data;
          setRoomStatus(room.status);
          setRoomType(room.type);
          setIsAiRoom(room.isAiRoom);

          if (room.messages && Array.isArray(room.messages)) {
            setMessages(room.messages.map((m: any) => ({
              id: m.id, userId: m.senderId || m.userId, content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              identity: m.identity, isSpark: m.isSpark,
            })));
          }

          // 故事信息
          if (room.story) {
            setStory(room.story);
          }

          // 找到自己的角色
          if (room.participants && Array.isArray(room.participants)) {
            const me = room.participants.find((p: any) => p.userId === userId);
            if (me) {
              setMyRoleName(me.identity || '我');
              // 从 story.roles 找 openingInfo
              if (room.story?.roles) {
                const myRole = room.story.roles.find((r: any) => r.name === me.identity);
                if (myRole?.openingInfo) setMyOpeningInfo(myRole.openingInfo);
                // 找 AI 角色
                const aiRole = room.story.roles.find((r: any) => r.name !== me.identity);
                if (aiRole) setAiRoleName(aiRole.name);
              }
            }
          }
        }
      })
      .catch((err) => console.error('[Room] Fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [roomId, userId]);

  // 加载评论
  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/room-comments?roomId=${roomId}`)
      .then((r) => r.json())
      .then((data) => setComments(data.data?.list || []))
      .catch((err) => console.error('[Comments] Load error:', err))
      .finally(() => setCommentsLoading(false));
  }, [roomId]);

  // WebSocket
  useEffect(() => {
    if (!roomId || !userId || roomStatus === 'closed') return;
    joinRoom(roomId, userId, myRoleName || '我');
    removeAllListeners('new-message');

    const handleNewMessage = (data: any) => {
      const raw = data.message || data;
      const msgId = raw.id || `msg-${Date.now()}`;
      const senderId = raw.senderId || raw.userId;
      if (senderId === userId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, {
          id: msgId, userId: senderId, content: raw.content,
          timestamp: new Date(raw.createdAt || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          identity: raw.identity,
        }];
      });
    };
    on('new-message', handleNewMessage);
    return () => {
      off('new-message', handleNewMessage);
      leaveRoom(roomId, userId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, myRoleName, roomStatus]);

  // AI 催化（按消息数）
  useEffect(() => {
    if (!story || !roomId || roomStatus === 'closed') return;
    const msgCount = messages.length;
    if (msgCount >= 6 && msgCount % 5 === 0) {
      fetch(`/api/stories/${story.id}/catalyst?roomId=${roomId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.prompt) {
            setAiPrompt(data.data.prompt);
            setShowAiPrompt(true);
            setTimeout(() => setShowAiPrompt(false), 10000);
          }
        })
        .catch(() => {});
    }
  }, [messages.length, story, roomId, roomStatus]);

  // AI 房间自动回复
  const generateAIReply = useCallback(async (userMessage: string) => {
    if (isProcessingAI.current || !story) return;
    isProcessingAI.current = true;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          topic: story.title,
          persona: 'catalyst',
        }),
      });
      const result = await res.json();
      await new Promise((r) => setTimeout(r, 800));
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        userId: `agent_${story.id}`,
        content: result.data?.content || '嗯，我能感受到你话里的分量。愿意多说说吗？',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        identity: aiRoleName || '刘看山',
      };
      setMessages((prev) => [...prev, aiMsg]);
      // 保存到数据库
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: aiMsg.content, identity: aiMsg.identity }),
      });
    } catch (e) { console.error('AI回复失败:', e); }
    finally { isProcessingAI.current = false; }
  }, [story, roomId, aiRoleName]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || roomStatus === 'closed') return;
    const content = inputValue.trim();
    setInputValue('');
    const msgId = `msg-${Date.now()}`;
    const msg: Message = {
      id: msgId, userId: userId || 'me', content,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      identity: myRoleName || '我',
    };
    setMessages((prev) => [...prev, msg]);
    sendMessage(roomId, { id: msgId, senderId: userId || 'me', content, createdAt: new Date().toISOString() });

    // HTTP 保存
    try {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, identity: myRoleName }),
      });
    } catch (e) { console.error('消息保存失败:', e); }

    // AI 房间自动回复
    if (isAiRoom && story) {
      generateAIReply(content);
    }
  }, [inputValue, roomId, userId, myRoleName, roomStatus, isAiRoom, story, generateAIReply, sendMessage]);

  // 评论
  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content || content.length > 500) return;
    setCommentLoading(true);
    try {
      const res = await fetch('/api/room-comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, content }),
      });
      const data = await res.json();
      if (data.success && data.data?.comment) {
        setComments((prev) => [data.data.comment, ...prev]);
        setCommentInput('');
      }
    } catch (e) { console.error('[Comments] Submit error:', e); }
    finally { setCommentLoading(false); }
  };

  const deleteComment = async (commentId: string) => {
    setCommentDeletingId(commentId);
    try {
      const res = await fetch(`/api/room-comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) { console.error('[Comments] Delete error:', e); }
    finally { setCommentDeletingId(null); }
  };

  const isReadonly = roomStatus === 'closed';
  const displayTitle = story?.title || '对白室';
  const displaySubtitle = story?.eraBackground || '';

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
      {/* 顶部标题栏 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#e2b04a] break-words leading-tight">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-[11px] text-[#e2b04a]/50 break-words mt-0.5 leading-relaxed">{displaySubtitle}</p>
            )}
            {myRoleName && (
              <p className="text-[11px] text-white/30 mt-0.5">你扮演：{myRoleName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{messages.length}</span>
            </div>
            {isReadonly && (
              <span className="text-[10px] text-white/20 bg-white/[0.05] px-2 py-0.5 rounded-full">已完结</span>
            )}
            {isConnected && !isReadonly && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                在线
              </span>
            )}
          </div>
        </div>
      </div>

      {/* OpeningInfo 提示 */}
      {myOpeningInfo && !isReadonly && (
        <div className="shrink-0 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          <p className="text-[11px] text-white/40 leading-relaxed">
            <span className="text-[#e2b04a]/50 font-medium">你的开场信息：</span>
            {myOpeningInfo}
          </p>
        </div>
      )}

      {/* AI 催化提示 */}
      {showAiPrompt && aiPrompt && (
        <div className="shrink-0 px-4 py-2 border-b border-[#e2b04a]/10 bg-[#e2b04a]/5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e2b04a]/60 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#e2b04a]/70 leading-relaxed">{aiPrompt}</p>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">{isReadonly ? '暂无对白内容' : '对白室已就绪，写下你的第一句话'}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === userId || msg.userId === 'me';
          const isAi = msg.userId.startsWith('agent_');
          return (
            <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 ${isMe ? 'ml-2' : 'mr-2'}`}>
                {isMe ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/20 flex items-center justify-center">
                    <span className="text-xs text-[#e2b04a] font-bold">{myRoleName.charAt(0) || '我'}</span>
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isAi ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20' : 'bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10 border-[#74b9ff]/20'}`}>
                    <span className={`text-xs font-bold ${isAi ? 'text-emerald-400' : 'text-[#74b9ff]'}`}>{(msg.identity || '对').charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                <span className="text-[10px] text-white/25 mb-1 px-1">{isMe ? (myRoleName || '我') : (msg.identity || '对方')}</span>
                <div className={`relative px-3.5 py-2.5 rounded-2xl ${
                  msg.isSpark
                    ? 'bg-[#e2b04a]/8 border-2 border-[#e2b04a]/40 text-white/90 shadow-[0_0_12px_rgba(226,176,74,0.12)]'
                    : isMe
                      ? 'bg-[#e2b04a]/15 border border-[#e2b04a]/20 text-white/90 rounded-br-md'
                      : 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isMe ? 'text-[#e2b04a]/30' : 'text-white/20'}`}>{msg.timestamp}</span>
                    {msg.isSpark && (
                      <span className="text-[10px] text-[#e2b04a] flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />火花
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

      {/* 输入区（仅 active 状态显示） */}
      {!isReadonly && (
        <div className="shrink-0 p-3 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white/[0.05] rounded-2xl border border-white/10 px-4 py-2.5 focus-within:border-[#e2b04a]/30 transition-colors">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="写下你的反应..."
                className="w-full bg-transparent text-sm text-white/90 placeholder-white/20 focus:outline-none caret-[#e2b04a]"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
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
      )}

      {/* 评论区（仅 closed 状态显示） */}
      {isReadonly && (
        <div className="shrink-0 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs text-white/40">评论 ({comments.length})</span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <div className="flex-1 bg-white/[0.05] rounded-xl border border-white/10 px-3 py-2 focus-within:border-[#e2b04a]/30 transition-colors">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="写下你的看法..."
                  maxLength={500}
                  className="w-full bg-transparent text-sm text-white/90 placeholder-white/20 focus:outline-none caret-[#e2b04a]"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                />
              </div>
              <button
                onClick={submitComment}
                disabled={!commentInput.trim() || commentLoading}
                className="p-2.5 rounded-xl transition-all disabled:bg-white/[0.03] disabled:text-white/10 disabled:border-white/5 bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25 hover:bg-[#e2b04a]/25 active:scale-95"
              >
                {commentLoading ? (
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {commentsLoading ? (
                <div className="flex justify-center py-2">
                  <span className="w-4 h-4 border border-white/20 border-t-[#e2b04a] rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[11px] text-white/15 text-center py-2">还没有评论，来抢沙发吧</p>
              ) : (
                comments.map((c) => {
                  const isMine = authUser?.id === c.user.id;
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {c.user.image ? (
                          <Image src={c.user.image} alt="" width={24} height={24} className="object-cover" />
                        ) : (
                          <span className="text-[10px] text-white/40">{(c.user.name || '匿').charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-white/50 font-medium">{c.user.name}</span>
                          <span className="text-[10px] text-white/15">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed mt-0.5">{c.content}</p>
                      </div>
                      {isMine && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          disabled={commentDeletingId === c.id}
                          className="p-1 rounded hover:bg-white/5 text-white/15 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          {commentDeletingId === c.id ? (
                            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
