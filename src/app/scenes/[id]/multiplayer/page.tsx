'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSceneById } from '@/lib/data';
import { useSocket } from '@/hooks/use-socket';

export default function MultiplayerPlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const sceneId = params.id as string;
  const scene = getSceneById(sceneId);

  const [phase, setPhase] = useState<'select' | 'waiting' | 'playing'>('select');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number | null>(null);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [innerThought, setInnerThought] = useState('');
  const [showInnerThought, setShowInnerThought] = useState(false);
  const [catalyst, setCatalyst] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedRole = selectedRoleIndex !== null ? scene?.roles[selectedRoleIndex] : null;

  const {
    connected,
    users,
    messages,
    sessionStarted,
    joinRoom,
    userReady,
    sendMessage,
    sendInnerThought,
    requestCatalyst,
  } = useSocket({
    roomId: roomId || '',
    userInfo: {
      nickname,
      roleId: selectedRole?.name || '',
      roleName: selectedRole?.name || '',
    },
    onUserJoined: () => {
      setNotification(`对方已加入！`);
      setTimeout(() => setNotification(null), 3000);
    },
    onUserLeft: () => {
      setNotification('对方已离开');
    },
    onSessionStarted: () => {
      setPhase('playing');
      setNotification('对话开始！');
      setTimeout(() => setNotification(null), 3000);
    },
    onCatalystReceived: (data) => {
      setCatalyst(data.catalyst);
    },
    onError: (error) => {
      setNotification(error.message);
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 加入房间
  useEffect(() => {
    if (connected && roomId && selectedRole && nickname && phase === 'waiting') {
      joinRoom();
    }
  }, [connected, roomId, selectedRole, nickname, phase, joinRoom]);

  // 会话开始
  useEffect(() => {
    if (sessionStarted && phase !== 'playing') {
      setPhase('playing');
    }
  }, [sessionStarted, phase]);

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-main-text)] mb-4">场景不存在</h1>
          <Link href="/scenes" className="text-[var(--color-brand-blue)] hover:underline">
            返回场景库
          </Link>
        </div>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-main-text)] mb-4">缺少房间信息</h1>
          <p className="text-[var(--color-secondary-text)] mb-6">请通过邀请链接加入房间</p>
          <Link href={`/scenes/${sceneId}`} className="text-[var(--color-brand-blue)] hover:underline">
            返回场景详情
          </Link>
        </div>
      </div>
    );
  }

  const handleRoleSelect = (index: number) => {
    setSelectedRoleIndex(index);
  };

  const handleJoin = () => {
    if (selectedRoleIndex !== null && nickname) {
      setPhase('waiting');
    }
  };

  const handleReady = () => {
    userReady();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage('');
    }
  };

  const handleInnerThought = (e: React.FormEvent) => {
    e.preventDefault();
    if (innerThought.trim()) {
      sendInnerThought(innerThought.trim());
      setInnerThought('');
      setShowInnerThought(false);
    }
  };

  const handleCatalyst = () => {
    const lastMessage = messages[messages.length - 1]?.content || '';
    requestCatalyst(messages.length, lastMessage);
  };

  const otherUser = users.find(u => u.roleName !== selectedRole?.name);

  // 角色选择阶段
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-light)] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Link href={`/scenes/${sceneId}`} className="text-[var(--color-brand-blue)] hover:underline text-sm">
              ← 返回场景
            </Link>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-main-text)] mt-4 mb-2">
              {scene.title}
            </h1>
            <p className="text-[var(--color-secondary-text)]">双人模式 - 选择你的角色</p>
          </div>

          {/* 连接状态 */}
          <div className="text-center mb-6">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              {connected ? '已连接' : '连接中...'}
            </span>
          </div>

          {/* 昵称输入 */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <label className="block text-sm font-medium text-[var(--color-main-text)] mb-2">
              你的昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称"
              className="w-full px-4 py-3 border border-[var(--color-divider)] rounded-lg focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
          </div>

          {/* 角色选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {scene.roles.map((role, index) => {
              const isTaken = users.some(u => u.roleName === role.name);
              return (
                <button
                  key={role.name}
                  onClick={() => !isTaken && handleRoleSelect(index)}
                  disabled={isTaken}
                  className={`p-6 rounded-lg text-left transition-all ${
                    selectedRoleIndex === index
                      ? 'bg-[var(--color-brand-blue)] text-white shadow-lg scale-105'
                      : isTaken
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:shadow-md hover:scale-102'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: role.color }}
                    >
                      {role.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold">{role.name}</h3>
                      <p className={`text-xs ${selectedRoleIndex === index ? 'text-white/80' : 'text-[var(--color-secondary-text)]'}`}>
                        {role.identity}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm ${selectedRoleIndex === index ? 'text-white/90' : 'text-[var(--color-main-text)]'}`}>
                    {role.desc}
                  </p>
                  {isTaken && (
                    <p className="text-xs text-red-500 mt-2">已被选择</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* 加入按钮 */}
          <button
            onClick={handleJoin}
            disabled={selectedRoleIndex === null || !nickname || !connected}
            className="w-full py-4 bg-[var(--color-brand-blue)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            加入房间
          </button>
        </div>
      </div>
    );
  }

  // 等待阶段
  if (phase === 'waiting' && !sessionStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-light)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-brand-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-[var(--color-main-text)] mb-2">
            {users.length < 2 ? '等待对方加入...' : '等待对方准备就绪'}
          </h2>
          <p className="text-[var(--color-secondary-text)] mb-6">
            分享链接给对方：{typeof window !== 'undefined' ? window.location.href : ''}
          </p>
          
          {users.length === 2 && (
            <button
              onClick={handleReady}
              className="px-8 py-3 bg-[var(--color-brand-blue)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-blue)]/90"
            >
              我准备好了，开始对话
            </button>
          )}
        </div>
      </div>
    );
  }

  // 对话阶段
  return (
    <div className="min-h-screen bg-[var(--color-bg-light)] flex flex-col">
      {/* 通知 */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-[var(--color-brand-blue)] text-white rounded-lg shadow-lg animate-fade-in">
          {notification}
        </div>
      )}

      {/* 顶部信息栏 */}
      <div className="bg-white border-b border-[var(--color-divider)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-[var(--color-main-text)]">{scene.title}</h1>
            <p className="text-sm text-[var(--color-secondary-text)]">
              你：{selectedRole?.name} | 对方：{otherUser?.roleName || '等待中...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-[var(--color-secondary-text)]">在线</span>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.roleName === selectedRole?.name;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-xs text-[var(--color-secondary-text)]">{msg.roleName}</span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isMe
                        ? 'bg-[var(--color-brand-blue)] text-white rounded-br-sm'
                        : 'bg-white text-[var(--color-main-text)] rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* AI 催化 */}
      {catalyst && (
        <div className="px-4 py-3 bg-[var(--color-bg-blue)] border-t border-[var(--color-divider)]">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-[var(--color-brand-blue)] italic">
              💡 {catalyst}
            </p>
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="bg-white border-t border-[var(--color-divider)] px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* 内心独白 */}
          {showInnerThought && (
            <form onSubmit={handleInnerThought} className="mb-3 p-3 bg-[var(--color-bg-blue)] rounded-lg">
              <textarea
                value={innerThought}
                onChange={(e) => setInnerThought(e.target.value)}
                placeholder="写下你的内心独白（只有你自己能看到）..."
                className="w-full px-3 py-2 border border-[var(--color-divider)] rounded-lg text-sm resize-none focus:outline-none focus:border-[var(--color-brand-blue)]"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowInnerThought(false)}
                  className="px-3 py-1 text-sm text-[var(--color-secondary-text)]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-[var(--color-brand-blue)] text-white rounded"
                >
                  保存
                </button>
              </div>
            </form>
          )}

          {/* 主输入框 */}
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <button
              type="button"
              onClick={() => setShowInnerThought(!showInnerThought)}
              className="p-3 text-[var(--color-secondary-text)] hover:text-[var(--color-brand-blue)]"
              title="内心独白"
            >
              💭
            </button>
            <button
              type="button"
              onClick={handleCatalyst}
              className="p-3 text-[var(--color-secondary-text)] hover:text-[var(--color-brand-blue)]"
              title="AI 催化"
            >
              ✨
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="说些什么..."
              className="flex-1 px-4 py-3 border border-[var(--color-divider)] rounded-full focus:outline-none focus:border-[var(--color-brand-blue)]"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="p-3 bg-[var(--color-brand-blue)] text-white rounded-full hover:bg-[var(--color-brand-blue)]/90 disabled:opacity-50"
            >
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
