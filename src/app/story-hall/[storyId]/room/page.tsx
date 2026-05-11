'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Pause, Play, Sparkles, BookOpen, Lightbulb, Vote, Users, Crown, MessageSquare, Flame, Bookmark, XCircle } from 'lucide-react';
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
  worldview: string;
  status: string;
  directorId: string;
  roles: { id: string; name: string; claimedBy: string | null; user: { id: string; name: string | null } | null }[];
}

export default function StoryRoomPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [assetSaved, setAssetSaved] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('xh_user_id') || `guest-${Date.now()}`;
    setCurrentUserId(uid);
    localStorage.setItem('xh_user_id', uid);
  }, []);

  const loadStory = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}`);
      const result = await res.json();
      if (result.success && result.data?.story) {
        setStory(result.data.story);
        const uid = localStorage.getItem('xh_user_id') || '';
        const myRole = result.data.story.roles.find((r: any) => r.claimedBy === uid);
        if (myRole) setMyIdentity(myRole.name);
      }
    } catch (e) { console.error('[StoryRoom] loadStory failed:', e); }
  }, [storyId]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/messages`);
      const result = await res.json();
      if (result.success && result.data?.messages) setMessages(result.data.messages);
    } catch (e) { console.error('[StoryRoom] loadMessages failed:', e); }
  }, [storyId]);

  const loadBranches = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/branches`);
      const result = await res.json();
      if (result.success && result.data?.branches) setBranches(result.data.branches);
    } catch (e) { console.error('[StoryRoom] loadBranches failed:', e); }
  }, [storyId]);

  const loadInspirations = useCallback(async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/inspirations`);
      const result = await res.json();
      if (result.success && result.data?.inspirations) setInspirations(result.data.inspirations);
    } catch (e) { console.error('[StoryRoom] loadInspirations failed:', e); }
  }, [storyId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([loadStory(), loadMessages(), loadBranches(), loadInspirations()]).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [loadStory, loadMessages, loadBranches, loadInspirations]);

  // WebSocket
  useEffect(() => {
    if (!storyId || !currentUserId || !myIdentity) return;
    joinRoom(`story-${storyId}`, currentUserId, myIdentity);
    const handleNewMessage = (msg: StoryMessage) => {
      setMessages((prev) => { if (prev.find((m) => m.id === msg.id)) return prev; return [...prev, msg]; });
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

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isPaused || !myIdentity) return;
    const content = input.trim();
    setInput('');
    setSendError('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    try {
      const res = await fetch(`/api/stories/${storyId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, identity: myIdentity }),
      });
      const result = await res.json();
      if (result.success && result.data?.message) socketSend(`story-${storyId}`, result.data.message);
      else setSendError('发送失败');
    } catch (e) {
      setSendError('网络异常，发送失败');
    }
  };

  const handleDirectorPause = async () => {
    try { await fetch(`/api/stories/${storyId}/pause`, { method: 'POST' }); setIsPaused(true); } catch (e) { console.error('[StoryRoom] pause failed:', e); }
  };
  const handleDirectorResume = async () => {
    try { await fetch(`/api/stories/${storyId}/resume`, { method: 'POST' }); setIsPaused(false); } catch (e) { console.error('[StoryRoom] resume failed:', e); }
  };

  const handleGenerateBranch = async () => {
    if (generatingBranch) return;
    setGeneratingBranch(true);
    try {
      const recentMessages = messages.slice(-20).map((m) => `${m.identity}: ${m.content}`).join('\n');
      const res = await fetch('/api/ai/story-weave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMessages, storyTitle: story?.title || '', mode: 'branch' }),
      });
      const result = await res.json();
      if (result.success && result.data?.branch) {
        await fetch(`/api/stories/${storyId}/branches`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: result.data.branch.content, options: result.data.branch.options }),
        });
        loadBranches();
        setShowBranches(true);
      }
    } catch (e) { console.error('[StoryRoom] generateBranch failed:', e); }
    setGeneratingBranch(false);
  };

  const handleVote = async (branchId: string, optionIdx: number) => {
    try {
      await fetch(`/api/stories/${storyId}/branches/${branchId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx }),
      });
    } catch (e) { console.error('[StoryRoom] vote failed:', e); }
  };

  const handleResolveBranch = async (branchId: string, optionIdx: number) => {
    try {
      await fetch(`/api/stories/${storyId}/branches/${branchId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIdx, resolve: true }),
      });
      loadBranches();
    } catch (e) { console.error('[StoryRoom] resolveBranch failed:', e); }
  };

  const handleSaveAsset = async () => {
    if (assetSaved) return;
    setIsSavingAsset(true);
    try {
      const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyId }) });
      const result = await res.json();
      if (result.success) setAssetSaved(true);
    } catch (e) { console.error('[StoryRoom] saveAsset failed:', e); }
    setIsSavingAsset(false);
  };

  const handleEndChat = async () => {
    await handleSaveAsset();
    router.push('/library');
  };

  const isDirector = story?.directorId === currentUserId;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full page-gradient">
        <TopBar title="对白室" showBack onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title={story?.title || '对白室'} showBack onBack={() => router.back()} />

      {/* 脑洞信息区 - 金色剧场风格 */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-xh-gold/8 to-xh-gold-dark/5 border-b border-xh-gold/15">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-xh-gold/15 flex items-center justify-center shrink-0 border border-xh-gold/20">
            <Sparkles className="w-4 h-4 text-xh-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-xh-gold truncate">{story?.title || '对白实验室'}</h3>
            {story?.worldview && (
              <p className="text-[11px] text-xh-gold/50 mt-0.5 line-clamp-2">{story.worldview}</p>
            )}
          </div>
        </div>
      </div>

      {/* 状态栏 - 更精致 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-slate-800/30 border-b border-slate-700/20">
        <div className="flex items-center gap-2.5">
          <span className={`flex items-center gap-1 text-[10px] ${isConnected ? 'text-emerald-400' : 'text-xh-gold'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-xh-gold'} animate-pulse`} />
            <Users className="w-3 h-3" />
            {isConnected ? '实时连接' : '连接中...'}
          </span>
          {isPaused && (
            <span className="text-[10px] text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/15">
              <Pause className="w-3 h-3" />导演已暂停
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isDirector && (
            <>
              {isPaused ? (
                <button onClick={handleDirectorResume} className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/12 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                  <Play className="w-3 h-3" />继续
                </button>
              ) : (
                <button onClick={handleDirectorPause} className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-red-500/12 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
                  <Pause className="w-3 h-3" />暂停
                </button>
              )}
            </>
          )}
          <button onClick={() => setShowBranches(!showBranches)} className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 transition-colors border border-slate-600/20">
            <Vote className="w-3 h-3" />分支
          </button>
          <button onClick={() => setShowInspirations(!showInspirations)} className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 transition-colors border border-slate-600/20">
            <Lightbulb className="w-3 h-3" />灵感
          </button>
          <button onClick={handleSaveAsset} disabled={isSavingAsset || assetSaved}
            className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full transition-colors border ${assetSaved ? 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 border-slate-600/20'}`}>
            <Bookmark className={`w-3 h-3 ${assetSaved ? 'fill-current' : ''}`} />
            {assetSaved ? '已保存' : '存素材'}
          </button>
          <button onClick={handleEndChat} className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/15 transition-colors border border-red-500/20">
            <XCircle className="w-3 h-3" />结束
          </button>
        </div>
      </div>

      {/* 分支侧边栏 */}
      <AnimatePresence>
        {showBranches && (
          <motion.div initial={mounted ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-b border-slate-700/20 bg-slate-800/20">
            <div className="p-3 max-h-48 overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-xh-gold" />剧情分支
                </span>
                <button onClick={handleGenerateBranch} disabled={generatingBranch}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-xh-gold/12 text-xh-gold hover:bg-xh-gold/20 transition-colors disabled:opacity-50 border border-xh-gold/20">
                  {generatingBranch ? <div className="w-3 h-3 border-2 border-xh-gold/30 border-t-xh-gold rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI生成分支
                </button>
              </div>
              {branches.length === 0 ? (
                <p className="text-[10px] text-slate-600 text-center py-3">暂无分支提案，点击上方按钮生成</p>
              ) : (
                <div className="space-y-2">
                  {branches.map((branch) => {
                    let opts: any[] = [];
                    try { opts = JSON.parse(branch.options || '[]'); } catch { opts = []; }
                    return (
                      <div key={branch.id} className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/15">
                        <p className="text-[11px] text-slate-300 mb-1.5">{branch.content}</p>
                        <div className="space-y-1">
                          {opts.map((opt: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <button onClick={() => handleVote(branch.id, idx)} disabled={branch.status === 'resolved'}
                                className={`flex-1 text-left text-[10px] px-2.5 py-1.5 rounded-md transition-colors ${
                                  branch.winnerIdx === idx ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/20 text-slate-500 hover:bg-slate-700/30'
                                }`}>
                                {opt.text || opt}
                              </button>
                              {isDirector && branch.status !== 'resolved' && (
                                <button onClick={() => handleResolveBranch(branch.id, idx)}
                                  className="text-[10px] px-2.5 py-1.5 rounded-md bg-xh-gold/12 text-xh-gold hover:bg-xh-gold/20 transition-colors border border-xh-gold/20">采纳</button>
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
          <motion.div initial={mounted ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-b border-slate-700/20 bg-slate-800/20">
            <div className="p-3 max-h-40 overflow-y-auto no-scrollbar">
              <span className="text-xs font-medium text-slate-300 block mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-xh-gold" />灵感库
              </span>
              {inspirations.length === 0 ? (
                <p className="text-[10px] text-slate-600 text-center py-3">AI生成的备用灵感将保存在这里</p>
              ) : (
                <div className="space-y-1.5">
                  {inspirations.map((inp) => (
                    <div key={inp.id} className="text-[10px] text-slate-500 bg-slate-700/20 rounded-md px-2.5 py-1.5 border border-slate-700/10">{inp.content}</div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 消息列表 - 精致消息气泡 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-xh-gold/8 flex items-center justify-center mb-3 border border-xh-gold/15">
              <BookOpen className="w-6 h-6 text-xh-gold/60" />
            </div>
            <p className="text-sm text-slate-400 font-medium mb-1">对白室已就绪</p>
            <p className="text-xs text-slate-600">
              {myIdentity ? `以「${myIdentity}」的身份发送第一句话` : '你需要先认领角色才能发言'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isDirectorMsg = msg.isDirectorNote;
            return (
              <motion.div key={msg.id} initial={mounted ? { opacity: 0, y: 6 } : false} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* 身份标签 */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className={`text-[10px] font-medium ${isMe ? 'text-xh-gold' : 'text-slate-500'}`}>{msg.identity}</span>
                    {isDirectorMsg && (
                      <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-xh-gold/12 text-xh-gold border border-xh-gold/15">
                        <Crown className="w-2.5 h-2.5" />导演
                      </span>
                    )}
                    <span className="text-[9px] text-slate-700">{new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {/* 气泡 - 带小尾巴 */}
                  <div className={`relative px-3.5 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-br from-xh-gold/15 to-xh-gold/5 text-slate-100 rounded-2xl rounded-tr-sm border border-xh-gold/20'
                      : isDirectorMsg
                      ? 'bg-xh-gold/8 text-slate-200 rounded-2xl rounded-tl-sm border border-xh-gold/15'
                      : 'bg-slate-800/50 text-slate-300 rounded-2xl rounded-tl-sm border border-slate-700/20'
                  }`}>
                    {msg.content}
                    {/* 小三角 */}
                    <div className={`absolute -bottom-[5px] w-2.5 h-2.5 rotate-45 ${
                      isMe
                        ? 'right-3 bg-xh-gold/15 border-r border-b border-xh-gold/20'
                        : isDirectorMsg
                        ? 'left-3 bg-xh-gold/8 border-l border-b border-xh-gold/15'
                        : 'left-3 bg-slate-800/50 border-l border-b border-slate-700/20'
                    }`} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入栏 - textarea自动增高 */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-700/20 bg-slate-900/50 backdrop-blur-xl">
        {sendError && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-[11px] text-red-400">{sendError}</p>
          </div>
        )}
        {isPaused ? (
          <div className="flex items-center justify-center py-2.5">
            <Pause className="w-4 h-4 text-red-400 mr-1.5" />
            <span className="text-xs text-red-400">导演已暂停对白</span>
          </div>
        ) : !myIdentity ? (
          <div className="flex items-center justify-center py-2.5">
            <Users className="w-4 h-4 text-slate-500 mr-1.5" />
            <span className="text-xs text-slate-500">你需要先认领角色才能发言</span>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/30 px-4 py-2.5 focus-within:border-xh-gold/30 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder={`以 ${myIdentity} 的身份发言...`}
                rows={1}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none max-h-24 caret-xh-gold"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
            </div>
            <button onClick={handleSend} disabled={!input.trim()}
              className="p-3 rounded-full transition-all disabled:bg-slate-800/30 disabled:text-slate-600 disabled:border-slate-700/20 bg-xh-btn/15 text-xh-btn border border-xh-btn/25 hover:bg-xh-btn/25 active:scale-95">
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
