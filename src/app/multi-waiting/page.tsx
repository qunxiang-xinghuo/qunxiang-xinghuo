'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import { Users, User, Sparkles } from 'lucide-react';

const TOTAL_TIMEOUT = 60;
const POLL_INTERVAL = 2000;
const MULTI_PHASE_END = 20;   // 20秒后降级双人
const DUO_PHASE_END = 40;     // 40秒后降级AI

type Phase = 'multi' | 'duo' | 'ai' | 'matched' | 'timeout';

function MultiWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMatchId = searchParams.get('matchId');

  const [brainhole, setBrainhole] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phase, setPhase] = useState<Phase>('multi');
  const [matchId, setMatchId] = useState<string | null>(initialMatchId);
  const [matchData, setMatchData] = useState<any>(null);
  const [error, setError] = useState('');

  // 获取脑洞信息
  useEffect(() => {
    const saved = localStorage.getItem('xh_multi_brainhole');
    if (saved) {
      setBrainhole(JSON.parse(saved));
    } else {
      router.push('/multi-match');
    }
  }, [router]);

  // 轮询匹配状态
  const pollMatchStatus = useCallback(async () => {
    if (!matchId || phase === 'matched' || phase === 'timeout' || phase === 'ai') return;

    try {
      const res = await fetch(`/api/match/${matchId}`);
      const result = await res.json();
      console.log('[MultiWaiting] Poll result:', result);

      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);

        if (data.status === 'matched' && data.roomId) {
          setPhase('matched');
          setTimeout(() => {
            router.push(`/room/${data.roomId}`);
          }, 1000);
          return true;
        }

        if (data.status === 'timeout') {
          return false; // 继续降级逻辑，不停止
        }
      }
      return false;
    } catch (err) {
      console.error('[MultiWaiting] Poll error:', err);
      return false;
    }
  }, [matchId, phase, router]);

  // 降级为双人匹配
  const downgradeToDuo = useCallback(async () => {
    console.log('[MultiWaiting] Downgrading to duo...');
    setPhase('duo');
    try {
      const identity = localStorage.getItem('xh_multi_identity') || '我';
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: brainhole?.id,
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'duo',
        }),
      });

      const result = await res.json();
      console.log('[MultiWaiting] Duo match response:', result);

      if (result.success && result.data?.matchId) {
        setMatchId(result.data.matchId);
      } else {
        // 如果双人请求也失败，直接进入AI降级
        console.log('[MultiWaiting] Duo request failed, will fallback to AI');
      }
    } catch (err) {
      console.error('[MultiWaiting] Duo downgrade error:', err);
    }
  }, [brainhole]);

  // 降级为AI房间
  const downgradeToAI = useCallback(async () => {
    console.log('[MultiWaiting] Downgrading to AI...');
    setPhase('ai');
    try {
      const identity = localStorage.getItem('xh_multi_identity') || '我';
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: brainhole?.id,
          identity,
        }),
      });

      const result = await res.json();
      console.log('[MultiWaiting] AI room result:', result);

      if (result.success && result.data?.roomId) {
        setTimeout(() => {
          router.push(`/room/${result.data.roomId}`);
        }, 1500);
      } else {
        router.push('/room/1');
      }
    } catch (err) {
      console.error('[MultiWaiting] AI downgrade error:', err);
      router.push('/room/1');
    }
  }, [brainhole, router]);

  // 计时器 + 阶段降级
  useEffect(() => {
    if (!matchId) {
      router.push('/multi-match');
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;

        // 阶段降级触发点
        if (next === MULTI_PHASE_END && phase === 'multi') {
          downgradeToDuo();
        }
        if (next === DUO_PHASE_END && (phase === 'multi' || phase === 'duo')) {
          downgradeToAI();
        }

        // 总超时
        if (next >= TOTAL_TIMEOUT && phase !== 'matched' && phase !== 'ai') {
          downgradeToAI();
        }

        return next;
      });
    }, 1000);

    // 轮询
    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus();
      if (shouldStop) {
        clearInterval(pollTimer);
      }
    }, POLL_INTERVAL);

    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, [matchId, router, phase, pollMatchStatus, downgradeToDuo, downgradeToAI]);

  const progress = Math.min((elapsedTime / TOTAL_TIMEOUT) * 100, 100);
  const remaining = Math.max(TOTAL_TIMEOUT - elapsedTime, 0);

  // 阶段文案
  const phaseConfig = {
    multi: {
      title: '正在寻找群像伙伴...',
      subtitle: `已等待 ${elapsedTime} 秒，还剩 ${remaining} 秒`,
      icon: Users,
      iconColor: '#4ade80',
      progressColor: 'bg-emerald-400',
      detail: '优先匹配3-5人群像队伍',
    },
    duo: {
      title: '组队人数不足，切换双人模式...',
      subtitle: `已等待 ${elapsedTime} 秒，还剩 ${remaining} 秒`,
      icon: User,
      iconColor: '#e2b04a',
      progressColor: 'bg-xh-gold',
      detail: '正在为你寻找对撞人',
    },
    ai: {
      title: '正在召唤AI搭档...',
      subtitle: '刘看山准备中',
      icon: Sparkles,
      iconColor: '#c084fc',
      progressColor: 'bg-violet-400',
      detail: '为你开启AI对话模式',
    },
    matched: {
      title: '匹配成功！',
      subtitle: '正在进入对白实验室...',
      icon: Users,
      iconColor: '#4ade80',
      progressColor: 'bg-emerald-400',
      detail: '',
    },
    timeout: {
      title: '匹配超时',
      subtitle: '正在为你召唤AI搭档...',
      icon: Sparkles,
      iconColor: '#c084fc',
      progressColor: 'bg-violet-400',
      detail: '',
    },
  };

  const current = phaseConfig[phase];
  const PhaseIcon = current.icon;

  if (!brainhole) return null;

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="群像组队" showBack onBack={() => router.back()} />

      {/* 脑洞信息 */}
      <div className="px-4 mb-4">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] text-white/50 mb-1">当前脑洞</p>
          <p className="text-sm text-white/80 leading-relaxed">{brainhole.title}</p>
        </div>
      </div>

      {/* 阶段指示器 */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2">
          {(['multi', 'duo', 'ai'] as Phase[]).map((p, i) => (
            <React.Fragment key={p}>
              <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                phase === p || (p === 'multi' && phase !== 'multi') || (p === 'duo' && phase === 'ai')
                  ? p === 'multi' ? 'bg-emerald-400/60' : p === 'duo' ? 'bg-xh-gold/60' : 'bg-violet-400/60'
                  : 'bg-white/10'
              }`} />
              {i < 2 && (
                <div className={`w-1.5 h-1.5 rounded-full ${
                  phase === 'ai' || (phase === 'duo' && p === 'multi')
                    ? 'bg-white/30'
                    : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-[9px] ${phase === 'multi' ? 'text-emerald-400' : 'text-white/20'}`}>多人组队</span>
          <span className={`text-[9px] ${phase === 'duo' ? 'text-xh-gold' : 'text-white/20'}`}>双人匹配</span>
          <span className={`text-[9px] ${phase === 'ai' ? 'text-violet-400' : 'text-white/20'}`}>AI搭档</span>
        </div>
      </div>

      {/* 中央区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 图标动画 */}
        <motion.div
          className="w-20 h-20 rounded-full relative mb-6 flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${current.iconColor}20, ${current.iconColor}08)`,
            border: `2px solid ${current.iconColor}40`,
            boxShadow: `0 0 24px ${current.iconColor}30`,
          }}
          animate={phase === 'matched' || phase === 'ai' ? {} : { y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PhaseIcon className="w-9 h-9" style={{ color: current.iconColor }} />
        </motion.div>

        {/* 状态文案 */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-base font-medium text-white/90 mb-2">
            {current.title}
          </p>
          <p className="text-xs text-white/50 mb-2">
            {current.subtitle}
          </p>
          {current.detail && (
            <p className="text-[10px] text-white/20 mb-6">{current.detail}</p>
          )}

          {/* 进度条 */}
          <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
            <motion.div
              className={`h-full ${current.progressColor} rounded-full`}
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {matchId && (
            <p className="text-[10px] text-white/15 mt-3">匹配ID: {matchId.slice(0, 8)}...</p>
          )}
        </motion.div>
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-4 text-center">
        <p className="text-[10px] text-white/20">
          优先群像组队 · 不足降级双人 · 再不足召唤AI
        </p>
      </div>
    </div>
  );
}

export default function MultiWaitingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <MultiWaitingContent />
    </Suspense>
  );
}
