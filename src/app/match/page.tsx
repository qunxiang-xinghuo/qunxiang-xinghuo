'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * 陌生人匹配页面
 * 用户选择场景后进入排队，系统自动匹配两个等待中的用户
 */
function MatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const sceneId = searchParams.get('sceneId') || '';
  const sceneName = searchParams.get('sceneName') || '未知场景';
  const roleA = searchParams.get('roleA') || '角色A';
  const roleB = searchParams.get('roleB') || '角色B';
  
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'queuing' | 'matched' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [queuePosition, setQueuePosition] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // 获取用户ID（从localStorage或生成）
  useEffect(() => {
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);
    
    const savedName = localStorage.getItem('username');
    if (savedName) {
      setUsername(savedName);
    }
  }, []);

  // 开始匹配
  const handleStartMatch = async () => {
    if (!userId) {
      setMessage('请先登录');
      return;
    }

    if (!username.trim()) {
      setMessage('请输入你的名字');
      return;
    }

    localStorage.setItem('username', username);
    setStatus('queuing');
    setMessage('正在匹配中...');

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          sceneId,
          sceneName,
          roleA,
          roleB
        })
      });

      const data = await response.json();

      if (data.matched) {
        setStatus('matched');
        setMessage('匹配成功！');
        setRoomId(data.room.id);
        setRoomCode(data.room.code);
        
        // 3秒后跳转到房间
        setTimeout(() => {
          router.push(`/room/${data.room.id}`);
        }, 3000);
      } else {
        setQueuePosition(data.queuePosition || 1);
        setMessage(data.message || '排队中...');
        
        // 继续轮询匹配状态
        pollMatchStatus();
      }
    } catch (error) {
      setStatus('error');
      setMessage('匹配失败，请重试');
    }
  };

  // 轮询匹配状态
  const pollMatchStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/match?userId=${userId}&sceneId=${sceneId}`);
        const data = await response.json();

        if (!data.inQueue) {
          clearInterval(interval);
          // 可能被匹配了，检查是否有新房间
          return;
        }

        setQueuePosition(data.queuePosition);
        setMessage(data.message);
      } catch (error) {
        // 忽略错误
      }
    }, 3000);

    // 5分钟后停止轮询
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  // 退出排队
  const handleCancel = async () => {
    try {
      await fetch('/api/match', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sceneId })
      });
    } catch (error) {
      // 忽略
    }
    
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif text-[#1a2e4a] mb-8 text-center">
          陌生人匹配
        </h1>

        <div className="bg-white rounded-lg shadow-sm border border-[#e0e8f0] p-8">
          {/* 场景信息 */}
          <div className="mb-6 p-4 bg-[#f0f8ff] rounded-lg">
            <h2 className="font-serif text-[#1a2e4a] mb-2">{sceneName}</h2>
            <p className="text-sm text-[#4a6888]">
              角色A：{roleA} × 角色B：{roleB}
            </p>
          </div>

          {/* 名字输入 */}
          {status === 'idle' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#1a2e4a] mb-2">
                  你的名字
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入你的名字"
                  className="w-full px-4 py-2 border border-[#e0e8f0] rounded-lg focus:outline-none focus:border-[#4a9fd8]"
                />
              </div>

              <button
                onClick={handleStartMatch}
                className="w-full py-3 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition"
              >
                开始匹配
              </button>
            </>
          )}

          {/* 排队中 */}
          {status === 'queuing' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4a9fd8] border-t-transparent mb-4"></div>
              <p className="text-[#4a6888] mb-2">{message}</p>
              {queuePosition > 1 && (
                <p className="text-sm text-[#8a9db0]">
                  前方还有 {queuePosition - 1} 人
                </p>
              )}
              <button
                onClick={handleCancel}
                className="mt-6 px-6 py-2 border border-[#e0e8f0] rounded-lg text-[#4a6888] hover:bg-[#f0f8ff] transition"
              >
                退出排队
              </button>
            </div>
          )}

          {/* 匹配成功 */}
          {status === 'matched' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-serif text-[#1a2e4a] mb-2">
                匹配成功！
              </h2>
              <p className="text-[#4a6888] mb-4">
                房间号：<span className="font-mono text-[#4a9fd8]">{roomCode}</span>
              </p>
              <p className="text-sm text-[#8a9db0]">
                3秒后自动跳转到房间...
              </p>
            </div>
          )}

          {/* 错误 */}
          {status === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{message}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2 bg-[#4a9fd8] text-white rounded-lg hover:bg-[#3a8fc8] transition"
              >
                重试
              </button>
            </div>
          )}

          <Link href="/scenes" className="block text-center mt-6 text-[#4a6888] hover:text-[#4a9fd8]">
            ← 返回场景库
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 匹配页面主组件（带 Suspense 边界）
 */
export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#4a6888]">加载中...</div>
      </div>
    }>
      <MatchContent />
    </Suspense>
  );
}
