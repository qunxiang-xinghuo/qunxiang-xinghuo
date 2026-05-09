'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, Flame, Lock, ArrowLeft, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';

interface Message {
  id: string;
  senderId: string;
  content: string;
  identity: string;
  isAi: boolean;
  createdAt: string;
}

export default function HealingSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'closed'>('active');
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [stableUserId, setStableUserId] = useState('guest');

  useEffect(() => {
    const saved = localStorage.getItem('xh_user_id');
    if (saved) setStableUserId(saved);
  }, []);

  // 加载会话状态 + 消息
  useEffect(() => {
    if (!sessionId) return;
    const guestId = localStorage.getItem('xh_user_id');

    Promise.all([
      fetch(`/api/healing/${sessionId}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      }).then((r) => r.json()),
      fetch(`/api/healing/${sessionId}/messages`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      }).then((r) => r.json()),
    ])
      .then(([sessionRes, messagesRes]) => {
        if (sessionRes.success && sessionRes.data) {
          setSessionStatus(sessionRes.data.status);
        }
        if (messagesRes.success && messagesRes.data) {
          setMessages(messagesRes.data);
        }
      })
      .catch((err) => console.error('[Healing] 加载失败:', err))
      .finally(() => setIsLoading(false));
  }, [sessionId]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sending || sessionStatus === 'closed') return;

    setSending(true);
    const guestId = localStorage.getItem('xh_user_id');

    // 乐观添加
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: stableUserId,
      content,
      identity: '我',
      isAi: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');

    try {
      const res = await fetch(`/api/healing/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({ content, identity: '我' }),
      });
      const result = await res.json();
      if (result.success) {
        // 重新加载消息（获取AI回复）
        const reloadRes = await fetch(`/api/healing/${sessionId}/messages`, {
          headers: guestId ? { 'x-guest-id': guestId } : {},
        });
        const reloadResult = await reloadRes.json();
        if (reloadResult.success && reloadResult.data) {
          setMessages(reloadResult.data);
        }
      }
    } catch (err) {
      console.error('[Healing] 发送失败:', err);
    } finally {
      setSending(false);
    }
  }, [inputValue, sending, sessionId, sessionStatus, stableUserId]);

  // 结束疗愈会话
  const handleClose = useCallback(async () => {
    if (!confirm('确定结束这次疗愈对话吗？')) return;
    setClosing(true);
    const guestId = localStorage.getItem('xh_user_id');
    try {
      const res = await fetch(`/api/healing/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
      });
      const result = await res.json();
      if (result.success) {
        setSessionStatus('closed');
        setToast({ type: 'success', message: '疗愈对话已结束' });
      } else {
        setToast({ type: 'error', message: result.error?.message || '结束失败' });
      }
    } catch (err) {
      console.error('[Healing] 结束失败:', err);
      setToast({ type: 'error', message: '结束失败，请重试' });
    } finally {
      setClosing(false);
      setTimeout(() => setToast(null), 3000);
    }
  }, [sessionId]);

  const handlePublish = async () => {
    const content = messages.filter((m) => !m.isAi).map((m) => m.content).join('\n\n');
    if (!content) {
      setToast({ type: 'error', message: '没有可公开的内容' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setPublishing(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({
          title: '疗愈对话节选',
          summary: content.slice(0, 200),
          content: content.slice(0, 2000),
          isPublic: true,
        }),
      });
      setToast({ type: 'success', message: '已公开至火花墙' });
    } catch (err) {
      console.error('公开失败:', err);
      setToast({ type: 'error', message: '公开失败，请重试' });
    } finally {
      setPublishing(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="个人疗愈" showBack onBack={() => router.back()} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flame className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">刘看山正在等待你</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === stableUserId;
            const isAi = msg.isAi;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 头像 */}
                <div className="shrink-0">
                  {isMe ? (
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <span className="text-[10px] text-slate-400">我</span>
                    </div>
                  ) : isAi ? (
                    <LiuKanshanAvatar size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-rose-400" />
                    </div>
                  )}
                </div>

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] mx-2`}>
                  {/* 姓名标签 */}
                  <span className="text-[10px] text-white/25 mb-1 px-1">
                    {msg.identity}
                  </span>
                  {/* 消息气泡 */}
                  <div
                    className={`relative px-3.5 py-2.5 rounded-2xl ${
                      isMe
                        ? 'bg-rose-500/15 border border-rose-500/20 text-white/90 rounded-br-md'
                        : isAi
                        ? 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                        : 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${isMe ? 'text-rose-400/30' : 'text-white/20'}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部操作区 */}
      <div className="shrink-0 px-4 py-3 border-t border-white/5">
        {sessionStatus === 'active' ? (
          <>
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="想聊点什么..."
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-rose-500/30 resize-none max-h-24"
                rows={1}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="shrink-0 w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 hover:bg-rose-500/30 disabled:opacity-30 transition-all"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 结束会话按钮 */}
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleClose}
                disabled={closing}
                className="text-[10px] text-slate-600 hover:text-slate-500 disabled:opacity-30"
              >
                {closing ? '结束中...' : '结束疗愈'}
              </button>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-slate-700" />
                <span className="text-[10px] text-slate-700">加密保护中</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-center py-2">
              <p className="text-xs text-slate-600">会话已结束</p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/50 text-xs hover:bg-white/[0.06] flex items-center justify-center gap-2"
            >
              <Globe className="w-3 h-3" />
              {publishing ? '处理中...' : '公开至火花墙'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
