'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Pause, Play, Sparkles, BookOpen, Lightbulb, Vote, Users, ArrowLeft } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useSocket } from '@/hooks/useSocket';

interface StoryMessage {
  id: string;
  senderId: string;
  content: string;
  identity: string;
  isDirectorNote: boolean;
  isSpark: boolean;
  createdAt: string;
}

interface StoryBranch {
  id: string;
  content: string;
  options: string;
  status: string;
  winnerIdx: number | null;
}

interface StoryDetail {
  id: string;
  title: string;
  status: string;
  directorId: string;
  roles: { id: string; name: string; claimedBy: string | null; user: { id: string; name: string | null } | null }[];
}

export default function StoryRoomPage() {
  const router = useRouter();
  const params = useParams();
  const storyId = params.storyId as string;

  const { isConnected, joinRoom, leaveRoom, sendMessage: socketSend, on, off } = useSocket();
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [branches, setBranches] = useState<StoryBranch[]>([]);
  const [showBranches, setShowBranches] = useState(false);
  const [showInspirations, setShowInspirations] = useState(false);
  const [inspirations, setInspirations] = useState<any[]>([]);
  const [generatingBranch, setGeneratingBranch] = useState(false);
  const [myIdentity, setMyIdentity] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const uid = localStorage.getItem('xh_user_id') || `guest-${Date.now()}`;
    setCurrentUserId(uid);
    localStorage.setItem('xh_user_id', uid);
  }, []);

  // 加载故事详情
  const loadStory = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      const result = await res.json();
      if (result.success && result.data?.story) {
        setStory(result.data.story);
        // 找到自己的角色身份
        const uid = localStorage.getItem('xh_user_id') || '';
        const myRole = result.data.story.roles.find((r: any) => r.claimedBy === uid);
        if (myRole) {
          setMyIdentity(myRole.name);
        }
      }
    } catch (err) {
      console.error('Load story failed:', err);
    }
  }, [storyId]);

  // 加载消息
  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/messages`);
      const result = await res.json();
      if (result.success && result.data?.messages) {
        setMessages(result.data.messages);
      }
    } catch (err) {
      console.error('Load messages failed:', err);
    }
  }, [storyId]);

  // 加载分支
  const loadBranches = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/branches`);
      const result = await res.json();
      if (result.success && result.data?.branches) {
        setBranches(result.data.branches);
      }
    } catch (err) {
      console.error('Load branches failed:', err);
    }
  }, [storyId]);

  // 加载灵感
  const loadInspirations = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/inspirations`);
      const result = await res.json();
      if (result.success && result.data?.inspirations) {
        setInspirations(result.data.inspirations);
      }
    } catch (err) {
      console.error('Load inspirations failed:', err);
    }
  }, [storyId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStory(), loadMessages(), loadBranches(), loadInspirations()]).finally(() =>
      setLoading(false)
    );
  }, [loadStory, loadMessages, loadBranches, loadInspirations]);

  // WebSocket事件
  useEffect(() => {
    if (!storyId || !currentUserId || !myIdentity) return;

    joinRoom(`story-${storyId}`, currentUserId, myIdentity);

    const handleNewMessage = (msg: StoryMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);

    on('new-story-message', handleNewMessage);
    on('director-pause', handlePause);
    on('director-resume', handleResume);

    return () => {
      off('new-story-message', handleNewMessage);
      off('director-pause', handlePause);
      off('director-resume', handleResume);
      leaveRoom(`story-${storyId}`, currentUserId);
    };
  }, [storyId, currentUserId, myIdentity, joinRoom, leaveRoom, on, off]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isPaused || !myIdentity) return;

    const content = input.trim();
    setInput('');

    try {
      const res = await fetch(`/api/stories/${storyId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          identity: myIdentity,
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.message) {
        // 通过WebSocket广播
        socketSend(`story-${storyId}`, result.data.message);
      }
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleDirectorPause = async () => {
    try {
      await fetch(`/api/stories/${storyId}/pause`, { method: 'POST' });
      setIsPaused(true);
    } catch (err) {
      console.error('Pause failed:', err);
    }
  };

  const handleDirectorResume = async () => {
    try {
      await fetch(`/api/stories/${storyId}/resume`, { method: 'POST' });
      setIsPaused(false);
    } catch (err) {
      console.error('Resume failed:', err);
    }
  };

  // AI生成分支剧情
  const handleGenerateBranch = async () => {
    if (generatingBranch) return;
    setGeneratingBranch(true);
    try {
      // 收集最近20条消息作为上下文
      const recentMessages = messages.slice(-20).map((m) => `${m.identity}: ${m.content}`).join('\n');

      const res = await fetch('/api/ai/story-weave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages,
          storyTitle: story?.title || '',
          mode: 'branch',
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.branch) {
        const branchData = result.data.branch;
        // 保存到数据库
        const saveRes = await fetch(`/api/stories/${storyId}/branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: branchData.content,
            options: branchData.options,
          }),
        });
        if (saveRes.ok) {
          loadBranches();
          setShowBranches(true);
        }
      }
    } catch (err) {
      console.error('Generate branch failed:', err);
    } finally {
      setGeneratingBranch(false);
    }
  };

  // 投票
  const handleVote = async (branchId: string, optionIdx: number) => {
    try {
      await fetch(`/api/stories/${storyId}/branches/${branchId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx }),
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // 导演决议
  const handleResolveBranch = async (branchId: string, optionIdx: number) => {
    try {
      await fetch(`/api/stories/${storyId}/branches/${branchId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx, resolve: true }),
      });
      loadBranches();
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  };

  const isDirector = story?.directorId === currentUserId;

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="对白室" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title={story?.title || '对白室'} showBack onBack={() => router.back()} />

      {/* 状态栏 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] ${isConnected ? 'text-emerald-400' : 'text-yellow-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse`} />
            {isConnected ? '实时连接' : '连接中...'}
          </span>
          {isPaused && (
            <span className="text-[10px] text-red-400 flex items-center gap-1">
              <Pause className="w-3 h-3" />
              导演已暂停
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isDirector && (
            <>
              {isPaused ? (
                <button
                  onClick={handleDirectorResume}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  继续
                </button>
              ) : (
                <button
                  onClick={handleDirectorPause}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                >
                  <Pause className="w-3 h-3" />
                  暂停
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          >
            <Vote className="w-3 h-3" />
            分支
          </button>
          <button
            onClick={() => setShowInspirations(!showInspirations)}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            灵感
          </button>
        </div>
      </div>

      {/* 分支侧边栏 */}
      <AnimatePresence>
        {showBranches && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-b border-white/5 bg-white/[0.02]"
          >
            <div className="p-3 max-h-48 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">剧情分支</span>
                <button
                  onClick={handleGenerateBranch}
                  disabled={generatingBranch}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-xh-gold/15 text-xh-gold hover:bg-xh-gold/25 transition-colors disabled:opacity-50"
                >
                  {generatingBranch ? (
                    <div className="w-3 h-3 border-2 border-xh-gold/30 border-t-xh-gold rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI生成分支
                </button>
              </div>
              {branches.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-2">暂无分支提案</p>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => {
                    const opts = JSON.parse(branch.options || '[]');
                    return (
                      <div key={branch.id} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06]">
                        <p className="text-[11px] text-white/70 mb-1.5">{branch.content}</p>
                        <div className="space-y-1">
                          {opts.map((opt: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleVote(branch.id, idx)}
                                disabled={branch.status === 'resolved'}
                                className={`flex-1 text-left text-[10px] px-2 py-1 rounded-md transition-colors ${
                                  branch.winnerIdx === idx
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                              >
                                {opt.text || opt}
                              </button>
                              {isDirector && branch.status !== 'resolved' && (
                                <button
                                  onClick={() => handleResolveBranch(branch.id, idx)}
                                  className="text-[10px] px-2 py-1 rounded-md bg-xh-gold/15 text-xh-gold hover:bg-xh-gold/25 transition-colors"
                                >
                                  采纳
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 灵感侧边栏 */}
      <AnimatePresence>
        {showInspirations && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-b border-white/5 bg-white/[0.02]"
          >
            <div className="p-3 max-h-40 overflow-y-auto no-scrollbar">
              <span className="text-xs font-medium text-white/70 block mb-2">灵感库</span>
              {inspirations.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-2">AI生成的备用灵感将保存在这里</p>
              ) : (
                <div className="space-y-1.5">
                  {inspirations.map((inp) => (
                    <div key={inp.id} className="text-[10px] text-white/40 bg-white/[0.03] rounded-md px-2 py-1.5">
                      {inp.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="w-10 h-10 text-white/10 mb-2" />
            <p className="text-white/30 text-xs">还没有对白</p>
            <p className="text-white/20 text-[10px] mt-1">以你的角色身份发送第一条消息</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-white/40">{msg.identity}</span>
                    {msg.isDirectorNote && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-xh-gold/15 text-xh-gold">导演</span>
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? 'bg-xh-gold/15 text-white/90 rounded-br-sm border border-xh-gold/20'
                        : 'bg-white/5 text-white/80 rounded-bl-sm border border-white/[0.06]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 */}
      <div className="shrink-0 px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        {isPaused ? (
          <div className="flex items-center justify-center py-2">
            <Pause className="w-4 h-4 text-red-400 mr-1.5" />
            <span className="text-xs text-red-400">导演已暂停对白</span>
          </div>
        ) : !myIdentity ? (
          <div className="flex items-center justify-center py-2">
            <Users className="w-4 h-4 text-white/30 mr-1.5" />
            <span className="text-xs text-white/30">你需要先认领角色才能发言</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`以 ${myIdentity} 的身份发言...`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-xh-gold/40 pr-10"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-xh-gold/20 text-xh-gold hover:bg-xh-gold/30 transition-colors disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
