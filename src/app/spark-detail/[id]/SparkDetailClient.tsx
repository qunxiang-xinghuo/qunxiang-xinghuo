'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Clock, Sparkles, MessageCircle, Send, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  identity: string;
  senderId: string;
  roleCharacter?: string | null;
  isSpark: boolean;
  createdAt: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface SparkDetailData {
  id: string;
  title: string;
  content: string;
  hotScore: number;
  createdAt: string;
  identity: string;
  identityPair: string;
  brainholeTitle: string;
  brainholeCategory: string;
  brainholeScenario: string;
  roomId: string | null;
  roomStatus: string | null;
  closedAt: string | null;
  messageCount: number;
  sparkCount: number;
  ownerId: string;
  messages: Message[];
}

export default function SparkDetailClient({ data }: { data: SparkDetailData }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [hotScore, setHotScore] = useState(data.hotScore);
  const [likeLoading, setLikeLoading] = useState(false);

  // v8.2: 评论功能
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // 加载当前用户ID
  useEffect(() => {
    const guestId = localStorage.getItem('xh_user_id');
    if (guestId) setCurrentUserId(guestId);
  }, []);

  // v8.2: 加载评论
  useEffect(() => {
    if (!data.roomId) {
      setCommentsLoading(false);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/room-comments?roomId=${data.roomId}`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then((data) => { setComments(data.data?.list || []); })
      .catch((err) => { if (err.name !== 'AbortError') console.error('[Comments] Load error:', err); })
      .finally(() => { setCommentsLoading(false); });
    return () => ctrl.abort();
  }, [data.roomId]);

  // v8.1-fix: 根据 senderId 判断消息归属
  const isMyMessage = (msg: Message) => msg.senderId === data.ownerId;

  // v8.1: 点赞功能
  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/sparks/${data.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('xh_user_id') ? { 'x-guest-id': localStorage.getItem('xh_user_id')! } : {}),
        },
      });
      const result = await res.json();
      if (result.success) {
        setLiked(result.data?.liked);
        setHotScore(result.data?.hotScore ?? hotScore);
      }
    } catch (e) {
      console.error('点赞失败:', e);
    } finally {
      setLikeLoading(false);
    }
  };

  // v8.2: 提交评论
  const submitComment = async () => {
    const content = commentInput.trim();
    if (!content || !data.roomId) return;
    setCommentLoading(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/room-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({ roomId: data.roomId, content }),
      });
      const dataRes = await res.json();
      if (dataRes.success && dataRes.data?.comment) {
        setComments((prev) => [dataRes.data.comment, ...prev]);
        setCommentInput('');
      }
    } catch (e) {
      console.error('[Comments] Submit error:', e);
    } finally {
      setCommentLoading(false);
    }
  };

  // v8.2: 删除评论
  const deleteComment = async (commentId: string) => {
    setCommentDeletingId(commentId);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch(`/api/room-comments/${commentId}`, {
        method: 'DELETE',
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const dataRes = await res.json();
      if (dataRes.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error('[Comments] Delete error:', e);
    } finally {
      setCommentDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部栏 */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.push('/home')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white/90 truncate">{data.brainholeTitle || data.title}</h1>
          <p className="text-[11px] text-white/30">{data.identityPair}</p>
        </div>
        {/* v8.1: 点赞按钮 */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all active:scale-95 ${
            liked
              ? 'bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25'
              : 'bg-white/[0.03] text-white/30 border border-white/5 hover:bg-white/[0.06] hover:text-white/50'
          }`}
        >
          {likeLoading ? (
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Flame className={`w-3.5 h-3.5 ${liked ? 'fill-current drop-shadow-[0_0_4px_rgba(226,176,74,0.5)]' : ''}`} />
          )}
          {hotScore}
        </button>
      </div>

      {/* 场景描述 */}
      {data.brainholeScenario && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/50 leading-relaxed">{data.brainholeScenario}</p>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <div className="space-y-4">
          {data.messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={mounted ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex ${isMyMessage(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isMyMessage(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* 身份标签 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-white/40">{msg.identity}</span>
                  {msg.isSpark && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#e2b04a]">
                      <Sparkles className="w-3 h-3" />
                      火花
                    </span>
                  )}
                </div>
                {/* 消息气泡 */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMyMessage(msg)
                      ? 'bg-[#e2b04a]/15 text-white/85 rounded-tr-sm border border-[#e2b04a]/20'
                      : 'bg-white/[0.06] text-white/85 rounded-tl-sm border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>
                {/* 时间 */}
                <span className="text-[9px] text-white/20 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 结束提示 */}
        {data.roomStatus === 'finished' || data.roomStatus === 'closed' ? (
          <div className="flex flex-col items-center mt-8 mb-4">
            <div className="w-8 h-px bg-white/10 mb-3" />
            <p className="text-[11px] text-white/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {data.closedAt
                ? `对白已结束 · ${new Date(data.closedAt).toLocaleDateString('zh-CN')}`
                : '对白已结束'}
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              共 {data.messageCount} 条消息 · {data.sparkCount} 个火花
            </p>
          </div>
        ) : null}

        {/* v8.2: 评论区 */}
        {data.roomId && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-white/30" />
              <span className="text-xs text-white/40">评论 ({comments.length})</span>
            </div>

            {/* 评论输入 */}
            <div className="flex items-end gap-2 mb-4">
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写下你的评论..."
                rows={2}
                className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-sm text-white/70 placeholder:text-white/20 outline-none resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
              />
              <button
                onClick={submitComment}
                disabled={!commentInput.trim() || commentLoading}
                className="p-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25 hover:bg-[#e2b04a]/25 transition-colors disabled:opacity-20"
              >
                {commentLoading ? (
                  <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 评论列表 */}
            {commentsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-white/15 text-center py-4">还没有评论</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/40 flex-shrink-0">
                      {(c.user.name || '匿').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/50 font-medium">{c.user.name || '匿名用户'}</span>
                        <span className="text-[9px] text-white/15">
                          {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                        {currentUserId && c.user.id === currentUserId && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            disabled={commentDeletingId === c.id}
                            className="ml-auto p-1 rounded hover:bg-white/5 text-white/15 hover:text-red-400 transition-colors"
                          >
                            {commentDeletingId === c.id ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <p className="text-[13px] text-white/70 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
