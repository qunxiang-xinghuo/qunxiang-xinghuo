'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Flame, MessageCircle, Send, Trash2, Sparkles, Eye, Lock, X, Share2, Copy, Bot, RefreshCw,
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
  const [roomError, setRoomError] = useState(false);
  const [roomStatus, setRoomStatus] = useState<'created' | 'active' | 'closed'>('created');
  const [roomType, setRoomType] = useState('');
  const [isAiRoom, setIsAiRoom] = useState(false);

  // 故事信息
  const [story, setStory] = useState<StoryInfo | null>(null);
  const [myRoleName, setMyRoleName] = useState('');
  const [myOpeningInfo, setMyOpeningInfo] = useState('');
  const [aiRoleName, setAiRoleName] = useState('');
  const [actProgress, setActProgress] = useState(0); // v9.1: 剧情阶段 0=开场 1=发展 2=转折 3=真相

  // Brainhole 信息
  const [brainholeTitle, setBrainholeTitle] = useState('');
  const [brainholeScenario, setBrainholeScenario] = useState('');

  // v8.5: 邀请房间信息
  const [inviteCode, setInviteCode] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  // 评论区
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // AI 催化
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showTruth, setShowTruth] = useState(false);

  // 交互优化状态
  const [openingInfoCollapsed, setOpeningInfoCollapsed] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // v8.5: 邀请房间超时弹窗
  const [inviteCountdown, setInviteCountdown] = useState(120); // 2分钟 = 120秒
  const [showInviteTimeoutModal, setShowInviteTimeoutModal] = useState(false);
  const [inviteExtended, setInviteExtended] = useState(false);
  const inviteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingAI = useRef(false);
  const catalystCalledRef = useRef<Set<number>>(new Set());
  const aiPromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasJoinedRef = useRef(false);
  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  // v8.0-selftest: roomId 变化时重置所有房间状态，防止旧数据残留
  useEffect(() => {
    setMessages([]);
    setRoomStatus('created');
    setRoomType('');
    setIsAiRoom(false);
    setStory(null);
    setMyRoleName('');
    setMyOpeningInfo('');
    setAiRoleName('');
    setBrainholeTitle('');
    setBrainholeScenario('');
    setComments([]);
    setCommentsLoading(true);
    setFinished(false);
    setShowTruth(false);
    setShowEndConfirm(false);
    setShowAiPrompt(false);
    setAiPrompt('');
    if (aiPromptTimerRef.current) clearTimeout(aiPromptTimerRef.current);
    catalystCalledRef.current.clear();
    hasJoinedRef.current = false;
    isProcessingAI.current = false;
  }, [roomId]);

  // 当前用户ID
  const userId = authUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null);
  const userIdRef = useRef(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // 滚动到底部
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // openingInfo 30秒后自动折叠
  useEffect(() => {
    if (!myOpeningInfo || roomStatus === 'closed' || finished) return;
    const t = setTimeout(() => setOpeningInfoCollapsed(true), 30000);
    return () => clearTimeout(t);
  }, [myOpeningInfo, roomStatus, finished]);

  // 加载房间信息
  useEffect(() => {
    if (!roomId) return;
    setRoomError(false);
    const ctrl = new AbortController();
    fetch(`/api/rooms/${roomId}`, {
      signal: ctrl.signal,
      headers: { ...(userId ? { 'x-guest-id': userId } : {}) },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        if (!isMountedRef.current) return;
        if (res.success && res.data) {
          const room = res.data;
          setRoomStatus(room.status);
          setRoomType(room.type);
          setIsAiRoom(room.isAiRoom);
          setInviteCode(room.inviteCode || '');
          setParticipantCount(room.participants?.filter((p: any) => p.role === 'actor').length || 0);
          setActProgress(room.actProgress || 0);

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
          if (room.actProgress !== undefined) {
            setActProgress(room.actProgress);
          }

          // Brainhole 信息
          // v8.1-fix: 统一处理 brainhole 和 scene，避免空字符串导致的问题
          const bhTitle = room.brainhole?.title || '';
          const bhScenario = room.brainhole?.scenario || room.scene || '';
          setBrainholeTitle(bhTitle);
          setBrainholeScenario(bhScenario);

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
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('[Room] Fetch error:', err);
          if (isMountedRef.current) setRoomError(true);
        }
      })
      .finally(() => { if (isMountedRef.current) setIsLoading(false); });
    return () => ctrl.abort();
  }, [roomId, userId]);

  // v8.5: 邀请房间 2 分钟倒计时
  useEffect(() => {
    if (roomType !== 'invite_duet' || participantCount >= 2 || roomStatus === 'closed') {
      if (inviteTimerRef.current) {
        clearInterval(inviteTimerRef.current);
        inviteTimerRef.current = null;
      }
      return;
    }
    // 已经显示弹窗了就不再启动倒计时
    if (showInviteTimeoutModal) return;

    inviteTimerRef.current = setInterval(() => {
      setInviteCountdown((prev) => {
        if (prev <= 1) {
          if (inviteTimerRef.current) {
            clearInterval(inviteTimerRef.current);
            inviteTimerRef.current = null;
          }
          setShowInviteTimeoutModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (inviteTimerRef.current) {
        clearInterval(inviteTimerRef.current);
        inviteTimerRef.current = null;
      }
    };
  }, [roomType, participantCount, roomStatus, showInviteTimeoutModal]);

  // 加载评论
  useEffect(() => {
    if (!roomId) return;
    const ctrl = new AbortController();
    fetch(`/api/room-comments?roomId=${roomId}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => { if (isMountedRef.current) setComments(data.data?.list || []); })
      .catch((err) => { if (err.name !== 'AbortError') console.error('[Comments] Load error:', err); })
      .finally(() => { if (isMountedRef.current) setCommentsLoading(false); });
    return () => ctrl.abort();
  }, [roomId]);

  // WebSocket
  useEffect(() => {
    if (!roomId || !userId || roomStatus === 'closed') return;
    if (!myRoleName) return; // 等待角色信息加载完成后再加入
    if (hasJoinedRef.current) return; // 防止重复加入
    hasJoinedRef.current = true;

    // v8.5-fix: 使用 userIdRef.current 避免 userId 变化导致监听器被反复移除/重注册
    const currentUserId = userIdRef.current || userId || 'me';
    joinRoom(roomId, currentUserId, myRoleName || '我');

    const handleNewMessage = (data: any) => {
      const raw = data.message || data;
      const msgId = raw.id || `msg-${Date.now()}`;
      const senderId = raw.senderId || raw.userId;
      // 使用 ref 获取最新 userId，避免闭包陈旧
      if (senderId === userIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, {
          id: msgId, userId: senderId, content: raw.content,
          timestamp: new Date(raw.createdAt || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          identity: raw.identity, isSpark: raw.isSpark,
        }];
      });
    };
    // v8.5: 对方离开提示
    const handleOpponentLeft = (data: any) => {
      const leftUserId = data.userId;
      if (leftUserId === userIdRef.current) return;
      alert('对方已结束对白，即将返回发现页');
      router.push('/home');
    };
    on('new-message', handleNewMessage);
    on('opponent-left', handleOpponentLeft);
    return () => {
      off('new-message', handleNewMessage);
      off('opponent-left', handleOpponentLeft);
      leaveRoom(roomId, currentUserId);
      hasJoinedRef.current = false;
    };
    // 移除 userId 依赖，避免 temp ID 初始变化时导致监听器被移除
  }, [roomId, myRoleName, roomStatus, joinRoom, leaveRoom, on, off]);

  // AI 催化（按消息数）— 使用 ref 标记已调用
  useEffect(() => {
    if (!roomId || roomStatus === 'closed') return;
    const msgCount = messages.length;
    if (msgCount >= 6 && msgCount % 5 === 0 && !catalystCalledRef.current.has(msgCount)) {
      catalystCalledRef.current.add(msgCount);

      // v8.0-catalyst-universal: 支持故事模式和脑洞模式
      let abortCtrl: AbortController | null = null;
      const doCatalyst = async () => {
        let prompt = '';
        let phase = 'act1';

        if (story) {
          // 故事模式：调用 story catalyst API
          try {
            abortCtrl = new AbortController();
            const r = await fetch(`/api/stories/${story.id}/catalyst?roomId=${roomId}`, { signal: abortCtrl.signal });
            const data = await r.json();
            if (data.success && data.data?.prompt) {
              prompt = data.data.prompt;
              phase = data.data.phase || 'act1';
            }
          } catch { /* ignore */ }
        } else if (brainholeTitle) {
          // 脑洞模式：本地生成催化提示
          const catalysts = [
            `如果「${brainholeTitle}」中的冲突升级，你最担心的是哪一方？`,
            `换个角度：如果你是另一方，你会怎么看待这个问题？`,
            `这个问题背后，真正让人难受的点是什么？`,
            `如果是三年后的你，会怎么看待现在的讨论？`,
            `刚才提到的某个细节，如果可以改变一个变量，你会选什么？`,
          ];
          prompt = catalysts[Math.floor(Math.random() * catalysts.length)];
          phase = 'brainhole';
        }

        if (prompt && isMountedRef.current) {
          setAiPrompt(prompt);
          setShowAiPrompt(true);
          if (aiPromptTimerRef.current) clearTimeout(aiPromptTimerRef.current);
          aiPromptTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setShowAiPrompt(false);
          }, 15000);
          // 记录催化日志
          fetch('/api/ai-training/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'catalyst',
              roomId,
              storyId: story?.id,
              prompt,
              phase,
              msgCount,
            }),
          }).catch(() => {});
        }
      };

      doCatalyst();
      return () => {
        abortCtrl?.abort();
        if (aiPromptTimerRef.current) clearTimeout(aiPromptTimerRef.current);
      };
    }
    return () => {
      if (aiPromptTimerRef.current) clearTimeout(aiPromptTimerRef.current);
    };
  }, [messages.length, story, roomId, roomStatus, brainholeTitle]);

  // AI 房间自动回复 — 刘看山角色 + DM 推进
  const generateAIReply = useCallback(async (userMessage: string, currentMsgCount: number) => {
    // v8.0-fix: 允许无 story 无 brainholeTitle 时使用 brainholeScenario/room.scene 作为话题
    if (isProcessingAI.current || (!story && !brainholeTitle && !brainholeScenario)) return;
    isProcessingAI.current = true;
    try {
      const msgCount = currentMsgCount;
      let systemPrompt = '';
      let topic = '';

      let context = '';
      if (story) {
        // ========== 故事模式：四幕推进 ==========
        let currentAct = 1;
        let actGuidance = '';
        if (msgCount < 6) {
          currentAct = 1;
          actGuidance = '这是故事的开端。引导对方分享信息，建立信任关系，自然透露一些背景线索，但不要一次性说完。';
        } else if (msgCount < 12) {
          currentAct = 2;
          actGuidance = '进入发展阶段。暗示事情不像表面那么简单，抛出一些矛盾或疑点，推动对话深入。';
        } else if (msgCount < 18) {
          currentAct = 3;
          actGuidance = '进入转折阶段。引入意外信息或冲突，让气氛紧张起来，某个隐藏的秘密即将浮出水面。';
        } else {
          currentAct = 4;
          actGuidance = '进入真相阶段。引导对话接近核心谜底，帮助对方拼凑线索，准备收尾和揭晓。';
        }

        context = [
          `当前你在参与一个解密故事《${story.title}》。`,
          `你的角色是「${aiRoleName || '刘看山'}」。`,
          myOpeningInfo ? `你的秘密信息：${myOpeningInfo}` : '',
          ``,
          `故事背景：`,
          story.act1Reveal ? `• 起（第一幕）：${story.act1Reveal}` : '',
          story.act2Reveal ? `• 承（第二幕）：${story.act2Reveal}` : '',
          story.act3Reveal ? `• 转（第三幕）：${story.act3Reveal}` : '',
          story.act4Truth ? `• 合（真相）：${story.act4Truth}` : '',
          ``,
          `你同时是DM（主持人）。当前是第${currentAct}幕。`,
          `DM职责：${actGuidance}`,
          `回复要求：像刘看山一样自然对话，同时悄悄推动剧情向下一幕发展。不要直接告诉用户你在推进剧情。`,
        ].filter(Boolean).join('\n');
        topic = story.title;
      } else {
        // ========== 脑洞模式：自由对话 ==========
        // v8.0-fix: 使用 brainholeScenario 或默认话题作为回退
        const actualTopic = brainholeTitle || brainholeScenario || '一个有趣的话题';
        context = [
          `当前讨论的话题是：「${actualTopic}」。`,
          brainholeScenario ? `话题背景：${brainholeScenario}` : '',
          ``,
          `你的任务：`,
          `- 作为对话参与者，自然地回应对方的观点`,
          `- 偶尔提出一个简短的追问，推动对话深入`,
          `- 像真正的朋友一样，有自己的情绪和立场`,
        ].filter(Boolean).join('\n');
        topic = actualTopic;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          topic,
          persona: 'liukanshan',
          context,
        }),
      });
      const result = await res.json();
      await new Promise((r) => setTimeout(r, 800));
      // v8.0-fix: 组件卸载后不再执行 setState
      if (!isMountedRef.current) { isProcessingAI.current = false; return; }
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        userId: story ? `agent_${story.id}` : 'agent_liukanshan',
        content: result.data?.content || '嗯，我能感受到你话里的分量。愿意多说说吗？',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        identity: aiRoleName || '刘看山',
      };
      setMessages((prev) => [...prev, aiMsg]);
      // v8.3-fix: 保存AI消息时必须传递AI的userId，否则cookie会让人类userId覆盖senderId
      const aiUserId = story ? `agent_${story.id}` : 'agent_catalyst';
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': aiUserId,
        },
        body: JSON.stringify({ content: aiMsg.content, identity: aiMsg.identity }),
      });
      // v8.0-ai-evolution: 记录学习日志（通过API）
      if (isMountedRef.current) {
        fetch('/api/ai-training/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'learning',
            sceneType: story ? 'story' : 'brainhole',
            referenceId: story?.id || roomId,
            aiContent: aiMsg.content,
            messageIndex: msgCount,
          }),
        }).catch(() => {});
      }
    } catch (e) { console.error('AI回复失败:', e); }
    finally { isProcessingAI.current = false; }
  }, [story, roomId, aiRoleName, myOpeningInfo, messages.length, brainholeTitle, brainholeScenario]);

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
    // 计算包含新消息的总数，避免闭包陈旧状态
    const newMsgCount = messages.length + 1;
    setMessages((prev) => [...prev, msg]);
    sendMessage(roomId, { id: msgId, senderId: userId || 'me', content, createdAt: new Date().toISOString() });

    // HTTP 保存
    try {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-guest-id': userId } : {}) },
        body: JSON.stringify({ content, identity: myRoleName }),
      });
    } catch (e) { console.error('消息保存失败:', e); }

    // AI 房间自动回复（传入正确的消息计数）
    if (isAiRoom) {
      generateAIReply(content, newMsgCount);
    }
  }, [inputValue, roomId, userId, myRoleName, roomStatus, isAiRoom, story, generateAIReply, sendMessage, messages.length]);

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

  const handleFinish = async () => {
    if (finishing || finished) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/finish`, {
        method: 'POST',
        headers: { ...(userId ? { 'x-guest-id': userId } : {}) },
      });
      const data = await res.json();
      if (data.success) {
        setFinished(true);
        setRoomStatus('closed');
        if (data.data?.truth) setShowTruth(true);
        // v8.1-fix: 审核静默完成，不弹窗。成功后直接跳转发现页
        router.push('/home');
      } else {
        // v8.0-fix: API 返回错误时给用户反馈
        console.error('结束对白失败:', data.error);
        alert(data.error?.message || '结束对白失败，请重试');
      }
    } catch (e) {
      console.error('结束失败:', e);
      alert('网络异常，结束对白失败');
    } finally {
      setFinishing(false);
    }
  };

  // v8.1-fix5: 页面关闭/刷新时由 socket disconnect 事件自动处理清理
  // 不再在 beforeunload 中调用 finish，避免无认证信息导致 401 或重复创建 Asset

  const isReadonly = roomStatus === 'closed' || finished;

  // v8.5-fix: 拦截浏览器返回/关闭/刷新，防止误操作丢失对话
  useEffect(() => {
    if (isReadonly) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReadonly]);

  useEffect(() => {
    if (isReadonly) return;
    // 压入一个空状态，使 popstate 能被拦截
    history.pushState({ roomGuard: true }, '');
    const handlePopState = (e: PopStateEvent) => {
      if (!isReadonly) {
        if (confirm('房间仍在进行中，确定要返回吗？')) {
          // 允许返回
          return;
        }
        // 阻止返回：重新压入状态并停留
        history.pushState({ roomGuard: true }, '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isReadonly]);
  // v8.0-fix: 增强标题回退链，使用 room.scene 作为最终回退
  // v8.5-fix: invite_duet 无脑洞时显示默认话题
  const hasBrainhole = !!brainholeTitle || !!brainholeScenario;
  const displayTitle = story?.title || brainholeTitle || (hasBrainhole ? '自由对话' : '对白室');
  const displaySubtitle = story?.eraBackground || brainholeScenario || (roomType === 'invite_duet' && !hasBrainhole ? '你们的话题由对话自然生发' : '');

  if (roomError) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient px-6">
        <Sparkles className="w-10 h-10 text-white/10 mb-3" />
        <p className="text-sm text-white/30 mb-1">房间加载失败</p>
        <p className="text-xs text-white/20 mb-4">房间不存在或网络异常</p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white/50 hover:bg-white/[0.08] transition-colors"
        >
          返回发现页
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center page-gradient">
        <div className="w-8 h-8 border-2 border-[#8a9ab0]/30 border-t-[#3B82F6] rounded-full animate-spin mb-4" />
        <p className="text-sm text-white/30">正在加载对白室...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full page-gradient">
      {/* 顶部标题栏 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => {
              // v8.5-fix: 只要房间未关闭就提示，不依赖消息数量
              if (!isReadonly) {
                if (confirm('房间仍在进行中，离开后可以从发现页重新进入。确认离开吗？')) {
                  router.push('/home');
                }
              } else {
                router.push('/home');
              }
            }}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="返回发现页"
          >
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white/90 break-words leading-tight">{displayTitle}</h1>
            {displaySubtitle && (
              <p className="text-[11px] text-[#D4B830]/50 break-words mt-0.5 leading-relaxed italic">{displaySubtitle}</p>
            )}
            {/* v9.1: 剧情阶段标签 */}
            {story && actProgress > 0 && (
              <p className="text-[11px] text-[#D4B830]/40 mt-0.5">
                剧情阶段：{['开场', '发展', '转折', '真相'][actProgress] || '开场'}
              </p>
            )}
            {/* v8.1-fix: 人机模式不显示重复的身份提示，故事模式才显示 */}
            {myRoleName && story && (
              <p className="text-[11px] text-white/30 mt-0.5">你扮演：{myRoleName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const url = window.location.href;
                const doCopy = (text: string) => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => alert('房间链接已复制')).catch(() => fallbackCopy());
                  } else {
                    fallbackCopy();
                  }
                };
                const fallbackCopy = () => {
                  const ta = document.createElement('textarea');
                  ta.value = url;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  alert('房间链接已复制');
                };
                doCopy(url);
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title="分享房间"
            >
              <Share2 className="w-4 h-4 text-white/40" />
            </button>
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

      {/* v8.5: 邀请房间 — 显示邀请码等待朋友加入 */}
      {roomType === 'invite_duet' && participantCount < 2 && !isReadonly && inviteCode && (
        <div className="shrink-0 px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-400/60 mb-1">等待好友加入</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-400 tracking-widest">{inviteCode}</span>
                <button
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(inviteCode).then(() => alert('房间号已复制'));
                    } else {
                      const ta = document.createElement('textarea');
                      ta.value = inviteCode;
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                      alert('房间号已复制');
                    }
                  }}
                  className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  <Copy className="w-3 h-3 text-emerald-400/70" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30">把房间号发给好友</p>
              <p className="text-[10px] text-white/20">好友输入后即可加入对戏</p>
            </div>
          </div>
        </div>
      )}

      {/* OpeningInfo 提示 — 30秒后自动折叠 */}
      {myOpeningInfo && !isReadonly && (
        <div className="shrink-0 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
          {openingInfoCollapsed ? (
            <button
              onClick={() => setOpeningInfoCollapsed(false)}
              className="flex items-center gap-1.5 text-[11px] text-[#8a9ab0]/40 hover:text-[#3B82F6]/60 transition-colors"
            >
              <span>📋</span>
              <span>查看开场信息</span>
            </button>
          ) : (
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#8a9ab0]/50 font-medium">你的开场信息：</span>
              {myOpeningInfo}
            </p>
          )}
        </div>
      )}

      {/* AI 催化提示 */}
      {showAiPrompt && aiPrompt && (
        <div className="shrink-0 px-4 py-2 border-b border-[#3B82F6]/10 bg-[#3B82F6]/5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]/60 mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#60A5FA]/70 leading-relaxed">{aiPrompt}</p>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">{isReadonly ? '暂无对白内容' : '帷幕已拉开，写下你的第一句台词'}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === userId || msg.userId === 'me';
          const isAi = msg.userId?.startsWith('agent_') || false;
          const isSystem = msg.userId === 'system' || msg.identity === '剧情提示';
          // v9.1: 系统提示消息居中显示
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="px-4 py-2 rounded-full bg-[#D4B830]/5 border border-[#D4B830]/10">
                  <p className="text-[11px] text-[#D4B830]/60 italic text-center">{msg.content}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 ${isMe ? 'ml-2' : 'mr-2'}`}>
                {isMe ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8a9ab0]/20 to-[#6c7c90]/20 border border-[#8a9ab0]/20 flex items-center justify-center overflow-hidden">
                    {authUser?.avatar ? (
                      <Image src={authUser.avatar} alt="" width={32} height={32} className="object-cover" />
                    ) : (
                      <span className="text-xs text-[#8a9ab0] font-bold">{myRoleName.charAt(0) || '我'}</span>
                    )}
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border overflow-hidden ${isAi ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20' : 'bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10 border-[#74b9ff]/20'}`}>
                    {isAi ? (
                      <Image src="/liukanshan.jpg" alt="刘看山" width={32} height={32} className="object-cover" />
                    ) : (
                      <span className={`text-xs font-bold ${isAi ? 'text-emerald-400' : 'text-[#74b9ff]'}`}>{(msg.identity || '对').charAt(0)}</span>
                    )}
                  </div>
                )}
              </div>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[72%]`}>
                <span className="text-[10px] text-white/25 mb-1 px-1">{isMe ? (myRoleName || '我') : (msg.identity || '对方')}</span>
                <div className={`relative px-3.5 py-2.5 rounded-2xl ${
                  msg.isSpark
                    ? 'bg-xh-yellow/8 border-2 border-xh-yellow/40 text-white/90 shadow-[0_0_12px_rgba(212,184,48,0.12)]'
                    : isMe
                      ? 'bg-[#8a9ab0]/15 border border-[#8a9ab0]/20 text-white/90 rounded-br-md'
                      : 'bg-white/[0.05] border border-white/5 text-white/80 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isMe ? 'text-[#8a9ab0]/30' : 'text-white/20'}`}>{msg.timestamp}</span>
                    {msg.isSpark && (
                      <span className="text-[10px] text-[#D4B830] flex items-center gap-0.5">
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
          {/* 结束对白按钮 */}
          {/* 结束对白确认卡片 */}
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 p-3 rounded-xl bg-white/[0.03] border border-white/10"
            >
              {/* v8.1-fix: 人机模式和故事模式用不同的结束弹窗文案 */}
              {isAiRoom || !story ? (
                <>
                  <p className="text-xs text-white/60 mb-2 leading-relaxed">
                    是否要谢幕了？<br />
                    <span className="text-white/40">这段对白将成为你的故事资产。</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEndConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg text-xs text-white/40 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                    >
                      再演一会
                    </button>
                    <button
                      onClick={() => { setShowEndConfirm(false); handleFinish(); }}
                      disabled={finishing}
                      className="flex-1 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                    >
                      {finishing ? '保存中...' : '谢幕'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/60 mb-2 leading-relaxed">
                    准备好揭开真相了吗？<br />
                    <span className="text-white/40">一旦结束，这段旅程将被永久保存。</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEndConfirm(false)}
                      className="flex-1 py-1.5 rounded-lg text-xs text-white/40 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                    >
                      再演一会
                    </button>
                    <button
                      onClick={() => { setShowEndConfirm(false); handleFinish(); }}
                      disabled={finishing}
                      className="flex-1 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                    >
                      {finishing ? '保存中...' : '揭开真相'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-2 px-1">
            <button
              onClick={() => setShowEndConfirm(true)}
              disabled={finishing}
              className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                finishing
                  ? 'bg-white/[0.02] text-white/15 border border-white/5 cursor-not-allowed'
                  : 'bg-red-500/10 text-red-400/60 border border-red-500/20 hover:bg-red-500/15'
              }`}
            >
              {finishing ? '保存中...' : '🏁 谢幕'}
            </button>
            <span className="text-[10px] text-white/15">{messages.length} 条消息</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-white/[0.05] rounded-2xl border border-white/10 px-4 py-2.5 focus-within:border-[#3B82F6]/30 transition-colors">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="写下你的反应..."
                className="w-full bg-transparent text-sm text-white/90 placeholder-white/35 focus:outline-none caret-[#3B82F6]"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-3 rounded-full transition-all disabled:bg-white/[0.03] disabled:text-white/10 disabled:border-white/5 bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25 hover:bg-[#3B82F6]/25 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 揭晓谜底弹窗 */}
      {showTruth && story && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-4 p-6 rounded-2xl bg-[#1a1a2e] border border-[#8a9ab0]/20 max-w-[340px] w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#D4B830]">📜 真相浮现</h3>
              <button onClick={() => setShowTruth(false)} className="p-1 rounded hover:bg-white/5">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {[
                { label: '开场', text: story.act1Reveal },
                { label: '发展', text: story.act2Reveal },
                { label: '转折', text: story.act3Reveal },
                { label: '真相', text: story.act4Truth },
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-xs font-bold text-[#D4B830]/60">{item.label}</span>
                  <p className="text-xs text-white/50 leading-relaxed mt-1">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowTruth(false)}
                className="w-full py-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] text-sm font-medium border border-[#3B82F6]/25"
              >
                📜 我明白了
              </button>
              <button
                onClick={() => router.push('/story-hall')}
                className="w-full py-2 rounded-xl bg-white/[0.03] text-white/40 text-xs border border-white/5 hover:bg-white/[0.06] transition-colors"
              >
                🎭 再来一局
              </button>
              <button
                onClick={() => router.push('/story/create')}
                className="w-full py-2 rounded-xl bg-[#D4B830]/8 text-[#D4B830]/70 text-xs border border-[#D4B830]/20 hover:bg-[#D4B830]/12 transition-colors"
              >
                ✏️ 基于这个故事，写一个你的版本
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* v8.5: 邀请房间超时弹窗 */}
      {showInviteTimeoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-2xl bg-[#1a1a2e] border border-emerald-500/20 max-w-[320px] w-full"
          >
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white/90 mb-1">
                {inviteExtended ? '还是没人来' : '朋友还没来'}
              </h3>
              <p className="text-xs text-white/40">
                {inviteExtended ? '等了很久了，换个方式吧' : '等了两分钟了，换个方式吧'}
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => { setShowInviteTimeoutModal(false); router.push('/solo-match'); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3B82F6]/20 to-[#2563EB]/20 border border-[#3B82F6]/30 text-[#3B82F6] text-sm font-medium hover:from-[#3B82F6]/30 hover:to-xh-btn-dark/30 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" />
                与刘看山对话
              </button>
              <button
                onClick={() => { setShowInviteTimeoutModal(false); router.push('/duo-waiting'); }}
                className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                自动匹配
              </button>
              {!inviteExtended ? (
                <button
                  onClick={() => {
                    setShowInviteTimeoutModal(false);
                    setInviteCountdown(60);
                    setInviteExtended(true);
                  }}
                  className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  再等 1 分钟
                </button>
              ) : (
                <button
                  onClick={() => { setShowInviteTimeoutModal(false); router.push('/home'); }}
                  className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回发现页面
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 四格展示（只读模式） */}
      {isReadonly && story && (
        <div className="shrink-0 px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-[#8a9ab0]/40" />
            <span className="text-xs text-[#D4B830]/40">故事全貌</span>
            <button
              onClick={() => setShowTruth(true)}
              className="text-[10px] text-[#D4B830]/60 underline ml-auto"
            >
              📜 查看真相
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '开场', text: story.act1Reveal, color: 'text-[#D4B830]/50', delay: 0 },
              { label: '发展', text: story.act2Reveal, color: 'text-white/30', delay: 0.1 },
              { label: '转折', text: story.act3Reveal, color: 'text-white/30', delay: 0.2 },
              { label: '真相', text: story.act4Truth, color: 'text-white/30', delay: 0.3 },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay, duration: 0.4 }}
                className="p-1.5 rounded-md bg-white/[0.02] border border-white/5"
              >
                <span className={`text-[10px] font-bold ${item.color}`}>{item.label}</span>
                <p className="text-[9px] text-white/20 leading-relaxed mt-0.5 line-clamp-3">{item.text}</p>
              </motion.div>
            ))}
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
              <div className="flex-1 bg-white/[0.05] rounded-xl border border-white/10 px-3 py-2 focus-within:border-[#3B82F6]/30 transition-colors">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="写下你的看法..."
                  maxLength={500}
                  className="w-full bg-transparent text-sm text-white/90 placeholder-white/35 focus:outline-none caret-[#3B82F6]"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                />
              </div>
              <button
                onClick={submitComment}
                disabled={!commentInput.trim() || commentLoading}
                className="p-2.5 rounded-xl transition-all disabled:bg-white/[0.03] disabled:text-white/10 disabled:border-white/5 bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25 hover:bg-[#3B82F6]/25 active:scale-95"
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
                  <span className="w-4 h-4 border border-white/20 border-t-[#3B82F6] rounded-full animate-spin" />
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
