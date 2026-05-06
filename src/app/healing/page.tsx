'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Plus, MessageCircle, Lock, Clock, ArrowRight } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

interface HealingSessionItem {
  id: string;
  status: string;
  title: string;
  topic: string | null;
  isPublic: boolean;
  messageCount: number;
  createdAt: string;
  closedAt: string | null;
}

export default function HealingPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HealingSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setError('');
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/healing', {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      if (!res.ok) {
        setError(`加载失败 (${res.status})`);
        return;
      }
      const result = await res.json();
      if (result.success && result.data) {
        setSessions(result.data);
      } else {
        setError(result.error?.message || '加载失败');
      }
    } catch (e) {
      console.error('加载疗愈会话失败:', e);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreateSession = async () => {
    setCreating(true);
    setError('');
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/healing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError(`创建失败 (${res.status})`);
        return;
      }
      const result = await res.json();
      if (result.success && result.data?.sessionId) {
        router.push(`/healing/session/${result.data.sessionId}`);
      } else {
        setError(result.error?.message || '创建失败');
      }
    } catch (e) {
      console.error('创建疗愈会话失败:', e);
      setError('网络错误，请重试');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="个人疗愈" showBack onBack={() => router.back()} />

      {/* 顶部引导区 */}
      <div className="px-5 pt-4 pb-3">
        <motion.div
          initial={mounted ? { opacity: 0, y: -10 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4 border-l-2 border-rose-400/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-rose-400/70 font-medium">绝对私密</span>
            <Lock className="w-3 h-3 text-rose-400/50 ml-auto" />
          </div>
          <p className="text-sm text-slate-100 font-medium leading-relaxed">
            这里是一个安全的空间。你可以放下防备，和刘看山聊聊任何想聊的——情绪、困惑、或者只是想说说话。
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5">
            所有对话内容均经过加密处理，仅你本人可见。
          </p>
        </motion.div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-5 pb-3">
          <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg py-2">{error}</p>
        </div>
      )}

      {/* 新建会话按钮 */}
      <div className="px-5 pb-3">
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-300 text-sm font-medium hover:from-rose-500/30 hover:to-pink-500/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              开始新的对话
            </>
          )}
        </button>
      </div>

      {/* 历史会话列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flame className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">暂无对话记录</p>
            <p className="text-xs text-white/20 mt-1">点击上方按钮，开启你的第一次疗愈对话</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 mb-2 px-1">历史对话</p>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={mounted ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/healing/session/${session.id}`)}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {session.title}
                      </span>
                      {session.status === 'active' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          进行中
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {session.messageCount} 条消息
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
