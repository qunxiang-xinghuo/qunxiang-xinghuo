'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import { Users, User, Sparkles, Radar, Signal, Check, Clock } from 'lucide-react';

const TOTAL_TIMEOUT = 60;
const POLL_INTERVAL = 2000;
const MULTI_PHASE_END = 20;
const DUO_PHASE_END = 40;

type Phase = 'multi' | 'duo' | 'ai' | 'matched' | 'timeout';

function MultiWaitingContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const searchParams = useSearchParams();
  const initialMatchId = searchParams.get('matchId');

  const [brainhole, setBrainhole] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phase, setPhase] = useState<Phase>('multi');
  const [matchId, setMatchId] = useState<string | null>(initialMatchId);
  const [matchData, setMatchData] = useState<any>(null);
  const [signalWaves, setSignalWaves] = useState(0);
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取脑洞信息
  useEffect(() => {
    const saved = localStorage.getItem('xh_multi_brainhole');
    if (saved) {
      try { setBrainhole(JSON.parse(saved)); } catch {}
    }
  }, []);

  // 轮询匹配状态
  const pollMatchStatus = useCallback(async () => {
    if (!matchId || phase === 'matched' || phase === 'timeout' || phase === 'ai') return;
    try {
      const res = await fetch(`/api/match/${matchId}`);
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);
        if (data.status === 'matched' && data.roomId) {
          setPhase('matched');
          navTimeoutRef.current = setTimeout(() => router.push(`/room/${data.roomId}`), 1200);
          return true;
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
    setPhase('duo');
    try {
      const identity = localStorage.getItem('xh_multi_identity') || '我';
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainholeId: brainhole?.id, identity, preferDifferent: true, timeoutMinutes: 1, mode: 'duo' }),
      });
      const result = await res.json();
      if (result.success && result.data?.matchId) setMatchId(result.data.matchId);
    } catch (err) {
      console.error('[MultiWaiting] Duo downgrade error:', err);
    }
  }, [brainhole]);

  // 降级为AI房间
  const downgradeToAI = useCallback(async () => {
    setPhase('ai');
    try {
      const identity = localStorage.getItem('xh_multi_identity') || '我';
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brainholeId: brainhole?.id, identity }),
      });
      const result = await res.json();
      if (result.success && result.data?.roomId) {
        navTimeoutRef.current = setTimeout(() => router.push(`/room/${result.data.roomId}`), 1500);
      } else {
        router.push('/room/1');
      }
    } catch {
      router.push('/room/1');
    }
  }, [brainhole, router]);

  // 清理导航timeout
  useEffect(() => {
    return () => { if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current); };
  }, []);

  // 计时器 + 阶段降级 + 信号波
  useEffect(() => {
    if (!matchId) { router.push('/multi-match'); return; }

    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        if (next === MULTI_PHASE_END && phase === 'multi') downgradeToDuo();
        if (next === DUO_PHASE_END && (phase === 'multi' || phase === 'duo')) downgradeToAI();
        if (next >= TOTAL_TIMEOUT && phase !== 'matched' && phase !== 'ai') downgradeToAI();
        return next;
      });
      setSignalWaves((prev) => prev + 1);
    }, 1000);

    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus();
      if (shouldStop) clearInterval(pollTimer);
    }, POLL_INTERVAL);

    return () => { clearInterval(timer); clearInterval(pollTimer); };
  }, [matchId, router, phase, pollMatchStatus, downgradeToDuo, downgradeToAI]);

  const progress = Math.min((elapsedTime / TOTAL_TIMEOUT) * 100, 100);
  const remaining = Math.max(TOTAL_TIMEOUT - elapsedTime, 0);

  const phaseConfig = {
    multi: { title: '正在寻找群像伙伴...', subtitle: `已等待 ${elapsedTime} 秒`, icon: Users, iconColor: '#4ade80', progressColor: 'bg-emerald-400', detail: '优先匹配3-5人群像队伍', glowColor: 'shadow-emerald-400/20' },
    duo: { title: '组队人数不足，切换双人模式...', subtitle: `已等待 ${elapsedTime} 秒`, icon: User, iconColor: '#8a9ab0', progressColor: 'bg-xh-gold', detail: '正在为你寻找对撞人', glowColor: 'shadow-xh-gold/20' },
    ai: { title: '正在召唤AI搭档...', subtitle: '刘看山准备中', icon: Sparkles, iconColor: '#c084fc', progressColor: 'bg-violet-400', detail: '为你开启AI对话模式', glowColor: 'shadow-violet-400/20' },
    matched: { title: '匹配成功！', subtitle: '正在进入对白实验室...', icon: Check, iconColor: '#4ade80', progressColor: 'bg-emerald-400', detail: '', glowColor: 'shadow-emerald-400/30' },
    timeout: { title: '匹配超时', subtitle: '正在为你召唤AI搭档...', icon: Sparkles, iconColor: '#c084fc', progressColor: 'bg-violet-400', detail: '', glowColor: 'shadow-violet-400/20' },
  };

  const current = phaseConfig[phase];
  const PhaseIcon = current.icon;

  return (
    <div className="flex flex-col h-full page-gradient relative overflow-hidden">
      <TopBar title="群像组队" showBack onBack={() => router.back()} />

      {/* 雷达扫描背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-emerald-500/10"
              style={{ width: i * 140, height: i * 140, left: -i * 70, top: -i * 70 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.8 }}
            />
          ))}
        </div>
      </div>

      {/* 脑洞信息 */}
      {brainhole && (
        <div className="shrink-0 px-5 pt-4 z-10">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/15">
            <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              <Radar className="w-3 h-3" />当前脑洞
            </p>
            <p className="text-sm font-semibold text-slate-100">{brainhole.title}</p>
          </div>
        </div>
      )}

      {/* 阶段指示器 */}
      <div className="shrink-0 px-5 py-4 z-10">
        <div className="flex items-center gap-2">
          {(['multi', 'duo', 'ai'] as Phase[]).map((p, i) => (
            <React.Fragment key={p}>
              <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                phase === p || (p === 'multi' && phase !== 'multi') || (p === 'duo' && phase === 'ai')
                  ? p === 'multi' ? 'bg-emerald-400/60' : p === 'duo' ? 'bg-xh-gold/60' : 'bg-violet-400/60'
                  : 'bg-slate-700/30'
              }`} />
              {i < 2 && <div className={`w-1.5 h-1.5 rounded-full ${phase === 'ai' || (phase === 'duo' && p === 'multi') ? 'bg-slate-500/30' : 'bg-slate-700/30'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className={`text-[10px] ${phase === 'multi' ? 'text-emerald-400' : 'text-slate-600'}`}>多人组队</span>
          <span className={`text-[10px] ${phase === 'duo' ? 'text-xh-gold' : 'text-slate-600'}`}>双人匹配</span>
          <span className={`text-[10px] ${phase === 'ai' ? 'text-violet-400' : 'text-slate-600'}`}>AI搭档</span>
        </div>
      </div>

      {/* 中央视觉区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        {/* 刘看山旋转环 + 图标 */}
        <div className="relative mb-8">
          {/* 外环 */}
          <motion.div
            className="w-32 h-32 rounded-full border-2 border-dashed border-slate-600/20 absolute -inset-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          {/* 内环 */}
          <motion.div
            className="w-24 h-24 rounded-full border border-dashed border-xh-gold/15 absolute"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          {/* 中心图标 */}
          <motion.div
            className={`w-20 h-20 rounded-full relative flex items-center justify-center ${current.glowColor}`}
            style={{
              background: `radial-gradient(circle at 35% 30%, ${current.iconColor}20, ${current.iconColor}08)`,
              border: `2px solid ${current.iconColor}40`,
              boxShadow: `0 0 32px ${current.iconColor}25`,
            }}
            animate={phase === 'matched' || phase === 'ai' ? {} : { y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={phase} initial={mounted ? { scale: 0.5, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                <PhaseIcon className="w-9 h-9" style={{ color: current.iconColor }} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          {/* 信号点 */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: current.iconColor,
                top: '50%', left: '50%',
              }}
              animate={{
                x: [0, Math.cos((i * 120 + signalWaves * 30) * Math.PI / 180) * 60],
                y: [0, Math.sin((i * 120 + signalWaves * 30) * Math.PI / 180) * 60],
                opacity: [0.8, 0, 0.8],
                scale: [1, 0.5, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>

        {/* 状态文案 */}
        <motion.div key={phase} initial={mounted ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-base font-semibold text-slate-100 mb-1.5">{current.title}</p>
          <p className="text-xs text-slate-500 mb-1">{current.subtitle}</p>
          {current.detail && <p className="text-[10px] text-slate-600 mb-5">{current.detail}</p>}

          {/* 进度条 */}
          <div className="w-56 h-1.5 bg-slate-700/30 rounded-full overflow-hidden mx-auto">
            <motion.div className={`h-full ${current.progressColor} rounded-full`} style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>

          {/* 倒计时 */}
          <p className="text-[11px] text-slate-600 mt-2.5 font-medium">
            <Clock className="w-3 h-3 inline mr-1" />
            剩余 {remaining} 秒
          </p>

          {/* 信号波计数 */}
          <p className="text-[10px] text-slate-700 mt-1.5 flex items-center justify-center gap-1">
            <Signal className="w-3 h-3" />
            已发出 {signalWaves} 道信号波
          </p>
        </motion.div>
      </div>

      {/* 底部提示 */}
      <div className="shrink-0 px-6 py-4 text-center z-10">
        <p className="text-[10px] text-slate-700">优先群像组队 · 不足降级双人 · 再不足召唤AI</p>
      </div>
    </div>
  );
}

export default function MultiWaitingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-btn rounded-full animate-spin" />
      </div>
    }>
      <MultiWaitingContent />
    </Suspense>
  );
}
