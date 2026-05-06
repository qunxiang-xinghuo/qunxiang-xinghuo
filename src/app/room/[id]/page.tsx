'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Flame, MessageCircle, Send, Trash2, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
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

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

// v8.1: 对白详情页 — 只读模式 + 评论区
export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { user: authUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [brainholeTitle, setBrainholeTitle] = useState('');
  const [brainholeScenario, setBrainholeScenario] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [identities, setIdentities] = useState<Record<string, string>>({});

  // 评论区状态
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // 加载房间信息和消息
  useEffect(() => {
    fetch(`/api/rooms/${roomId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        if (res.success && res.data) {
          const room = res.data;
          if (room.brainhole) {
            setBrainholeTitle(room.brainhole.title);
            setBrainholeScenario(room.brainhole.scenario || '');
          }
          if (room.messages && Array.isArray(room.messages)) {
            const history: Message[] = room.messages.map((m: any) => ({
              id: m.id,
              userId: m.senderId || m.userId,
              content: m.content,
              timestamp: new Date(m.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              identity: m.identity,
              isSpark: m.isSpark,
            }));
            setMessages(history);
          }
          // 收集参与者身份映射
          const idMap: Record<string, string> = {};
          if (room.participants && Array.isArray(room.participants)) {
            room.participants.forEach((p: any) => {
              if (p.userId && p.identity) idMap[p.userId] = p.identity;
            });
          }
          setIdentities(idMap);
        }
      })
      .catch((err) => console.error('[Room] Fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [roomId]);

  // 加载评论
  useEffect(() => {
    if (!roomId) return;
    setCommentsLoading(true);
    fetch(`/api/room-comments?roomId=${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.data?.list || []);
      })
      .catch((err) => console.error('[Comments] Load error:', err))
      .finally(() => setCommentsLoading(false));
  }, [roomId]);

  // 提交评论
  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content || content.length > 500) return;
    setCommentLoading(true);
    try {
      const res = await fetch('/api/room-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, content }),
      });
      const data = await res.json();
      if (data.success && data.data?.comment) {
        setComments((prev) => [data.data.comment, ...prev]);
        setCommentInput('');
      }
    } catch (e) {
      console.error('[Comments] Submit error:', e);
    } finally {
      setCommentLoading(false);
    }
  };

  // 删除评论
  const deleteComment = async (commentId: string) => {
    setCommentDeletingId(commentId);
    try {
      const res = await fetch(`/api/room-comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error('[Comments] Delete error:', e);
    } finally {
      setCommentDeletingId(null);
    }
  };

  // 判断消息发送者身份
  const getSenderLabel = (msg: Message) => {
    if (identities[msg.userId]) return identities[msg.userId];
    if (msg.identity) return msg.identity;
    return '匿名';
  };

  // 按 userId 分组判断左右
  const uniqueUsers = Array.from(new Set(messages.map((m) => m.userId)));
  const meUserId = uniqueUsers[0] || 'me'; // 第一个用户放右边

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在加载对白...</p>
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
            <h1 className="text-lg font-bold text-[#e2b04a] break-words leading-tight">{brainholeTitle || '对白详情'}</h1>
            {brainholeScenario && (
              <p className="text-xs text-[#e2b04a]/60 break-words mt-0.5 leading-relaxed">{brainholeScenario}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{messages.length}</span>
          </div>
        </div>
      </div>

      {/* 消息列表 — 微信聊天风格 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">暂无对白内容</p>
          </div>
        )}
        {messages.map((msg) => {
          const isRight = msg.userId === meUserId;
          const senderLabel = getSenderLabel(msg);
          return (
            <div key={msg.id} className={`flex ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* 头像 */}
              <div className={`flex-shrink-0 ${isRight ? 'ml-2' : 'mr-2'}`}>
                {isRight ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/20 flex items-center justify-center">
                    <span className="text-xs text-[#e2b04a] font-bold">{senderLabel.charAt(0)}</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10 border border-[#74b9ff]/20 flex items-center justify-center">
                    <span className="text-xs text-[#74b9ff] font-bold">{senderLabel.charAt(0)}</span>
                  </div>
                )}
              </div>
              {/* 气泡 */}
              <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[72%]`}>
                <span className="text-[10px] text-white/25 mb-1 px-1">{senderLabel}</span>
                <div className={`relative px-3.5 py-2.5 rounded-2xl ${
                  msg.isSpark
                    ? 'bg-[#e2b04a]/8 border-2 border-[#e2b04a]/40 text-white/90 shadow-[0_0_12px_rgba(226,176,74,0.12)]'
                    : isRight
                      ? 'bg-[#e2b04a]/15 border border-[#e2b04a]/20 text-white/90 rounded-br-md'
                      : 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-2 mt-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isRight ? 'text-[#e2b04a]/30' : 'text-white/20'}`}>
                      {msg.timestamp}
                    </span>
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
      </div>

      {/* 评论区 */}
      <div className="shrink-0 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="px-4 py-3">
          {/* 评论标题 */}
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs text-white/40">评论 ({comments.length})</span>
          </div>

          {/* 评论输入 */}
          <div className="flex items-end gap-2 mb-3">
            <div className="flex-1 bg-white/[0.05] rounded-xl border border-white/10 px-3 py-2 focus-within:border-[#e2b04a]/30 transition-colors">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的看法..."
                maxLength={500}
                className="w-full bg-transparent text-sm text-white/90 placeholder-white/20 focus:outline-none caret-[#e2b04a]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
                }}
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

          {/* 评论列表 */}
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
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-2 py-1.5"
                  >
                    {/* 头像 */}
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
                        <span className="text-[10px] text-white/15">
                          {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                        </span>
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
    </div>
  );
}
