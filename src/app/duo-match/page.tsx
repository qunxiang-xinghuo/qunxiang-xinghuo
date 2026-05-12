'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, DoorOpen, Share2, BrainCircuit } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const aiIdentities = [
  '急诊科医生', '辩护律师', '初中班主任', '产品经理', '外卖骑手',
  '幼儿园园长', '心理咨询师', '记者', '消防员', '护士',
  '创业者', '退休教师', '北漂程序员', '全职妈妈', '酒吧老板',
  '急诊护士', '拆迁办主任', '民宿老板', '法医', '社工',
];

function DuoMatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBrainholeId = searchParams.get('brainholeId');
  const fromBubble = searchParams.get('from') === 'bubble';

  const [brainholeInfo, setBrainholeInfo] = useState<{ id: string; title: string; scenario: string } | null>(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 获取预选的 brainhole 信息
  useEffect(() => {
    if (preselectedBrainholeId) {
      fetch(`/api/brainholes/${preselectedBrainholeId}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(res => {
          if (!mountedRef.current) return;
          if (res.success && res.data) {
            setBrainholeInfo({
              id: res.data.id,
              title: res.data.title,
              scenario: res.data.scenario,
            });
          }
        })
        .catch((err) => { console.error('[DuoMatch] brainhole fetch error:', err); });
    }
  }, [preselectedBrainholeId]);

  // v9.5a-fix: 身份由系统随机分配，无需用户选择
  const getIdentity = () => {
    return aiIdentities[Math.floor(Math.random() * aiIdentities.length)];
  };

  const saveIdentityAndGo = (mode: 'auto' | 'invite') => {
    const identity = getIdentity();
    const stableUserId = localStorage.getItem('xh_user_id') || `guest-${Date.now()}`;
    localStorage.setItem('xh_user_id', stableUserId);
    localStorage.setItem('xh_duo_identity', identity);
    if (preselectedBrainholeId) {
      localStorage.setItem('xh_duo_brainhole', preselectedBrainholeId);
    }
    localStorage.removeItem('xh_duo_match_id');

    const params = new URLSearchParams();
    if (preselectedBrainholeId) params.set('brainholeId', preselectedBrainholeId);
    params.set('mode', mode);
    router.push(`/duo-waiting?${params.toString()}`);
  };

  const handleConfirm = () => saveIdentityAndGo('auto');
  const handleInvite = () => saveIdentityAndGo('invite');

  const handleJoinRoom = async () => {
    const normalizedCode = joinCode.trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length !== 6) {
      setJoinError('请输入6位邀请码');
      return;
    }
    setJoining(true);
    setJoinError('');
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const identity = getIdentity();
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
        body: JSON.stringify({ inviteCode: normalizedCode, identity }),
      });
      const result = await res.json();
      if (result.success && result.data?.roomId) {
        const stableUserId = localStorage.getItem('xh_user_id') || `guest-${Date.now()}`;
        localStorage.setItem('xh_user_id', stableUserId);
        localStorage.setItem('xh_duo_identity', identity);
        router.push(`/room/${result.data.roomId}`);
      } else {
        const statusMap: Record<number, string> = {
          400: '邀请码格式不正确',
          401: '请先登录',
          403: '房间已满',
          404: '邀请码无效或房间已过期',
          409: result.message || '你已在房间中',
          410: '对白已结束',
          500: '服务器错误，请稍后重试',
        };
        setJoinError(statusMap[res.status] || result.message || '加入房间失败');
      }
    } catch {
      setJoinError('网络异常，请重试');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="双人对白" showBack onBack={() => router.back()} />

      {/* 预选话题卡片 */}
      {brainholeInfo && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-3 mb-1"
        >
          <div className="card-elevated p-3 border-l-2 border-xh-gold">
            <div className="flex items-center gap-2 mb-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-xh-gold" />
              <span className="text-[10px] text-xh-gold/70 font-medium">已选话题</span>
            </div>
            <p className="text-sm font-semibold text-slate-100 line-clamp-1">{brainholeInfo.title}</p>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{brainholeInfo.scenario}</p>
          </div>
        </motion.div>
      )}

      {/* 页面标题 */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-lg font-bold text-slate-100 mb-1">
          {fromBubble ? '确认话题，即刻对撞' : '寻找你的对戏伙伴'}
        </h2>
        <p className="text-xs text-slate-500">
          {fromBubble ? '话题已选好，系统将为你随机分配身份' : '系统将为你随机分配身份，匹配对戏伙伴'}
        </p>
      </div>

      {/* 入口按钮区域 */}
      <div className="flex-1 flex flex-col justify-end px-6 py-5 space-y-3">
        {!showJoinInput ? (
          <>
            {/* 1. 进入邀请房间 */}
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <DoorOpen className="w-4 h-4" />
              进入邀请房间
            </button>
            {/* 2. 跟好友对戏 */}
            <button
              onClick={handleInvite}
              className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:bg-white/[0.06] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              跟好友匹配
            </button>
            {/* 3. 快速匹配 */}
            <button
              onClick={handleConfirm}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              快速匹配
            </button>
          </>
        ) : (
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                  setJoinCode(val);
                  setJoinError('');
                }}
                placeholder="输入6位邀请码"
                className="flex-1 bg-slate-700/30 border border-slate-600/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-btn/50 text-center tracking-widest"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={joining || joinCode.length !== 6}
                className="px-4 py-2.5 rounded-xl bg-xh-btn/15 border border-xh-btn/30 text-xh-btn text-sm font-medium hover:bg-xh-btn/25 disabled:opacity-40 transition-all"
              >
                {joining ? <div className="w-4 h-4 border-2 border-xh-btn/30 border-t-xh-btn rounded-full animate-spin" /> : '进入'}
              </button>
            </div>
            {joinError && <p className="text-[11px] text-red-400/70 text-center">{joinError}</p>}
            <button
              onClick={() => { setShowJoinInput(false); setJoinCode(''); setJoinError(''); }}
              className="w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 text-sm hover:bg-white/[0.06] transition-all"
            >
              取消，返回
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function DuoMatchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <p className="text-slate-600 text-sm">加载中...</p>
      </div>
    }>
      <DuoMatchContent />
    </Suspense>
  );
}
