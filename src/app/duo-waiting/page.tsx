'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Zap, Clock, Sparkles, User, Radio, BrainCircuit, Target, Globe, Search } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';

const MATCH_TIMEOUT = 15;
const POLL_INTERVAL = 2000;
const MATCH_DELAY = 800;

interface BrainholeInfo {
  id: string;
  title: string;
  scenario: string;
}

type MatchStatus = 'matching' | 'matched' | 'ai' | 'exiting';

// v6.0: 四级匹配策略
const MATCH_STRATEGIES = [
  { key: 'same_brainhole', label: '同话题匹配', icon: Target, desc: '寻找同样对这个话题感兴趣的人', time: '0-3秒' },
  { key: 'same_category', label: '同类兴趣', icon: BrainCircuit, desc: '寻找喜欢同类话题的人', time: '3-6秒' },
  { key: 'random_engaged', label: '热门话题', icon: Globe, desc: '从热门参与话题中匹配', time: '6-10秒' },
  { key: 'waiting_for_any', label: '扩大搜索', icon: Search, desc: '正在扩大搜索范围', time: '10-15秒' },
];

function DuoWaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBrainholeId = searchParams.get('brainholeId');
  const urlRound = parseInt(searchParams.get('round') || '1', 10);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('matching');
  const [matchData, setMatchData] = useState<any>(null);
  const [brainholeInfo, setBrainholeInfo] = useState<BrainholeInfo | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string>('');
  const [pulseActive, setPulseActive] = useState(true);
  
  // v6.0: 匹配策略状态
  const [currentStrategy, setCurrentStrategy] = useState(0);
  const [strategyMessage, setStrategyMessage] = useState('正在搜索同话题的对撞人...');

  const identityRef = useRef<string>('');
  const brainholeIdRef = useRef<string | undefined>(undefined);

  const pollMatchStatus = useCallback(async (currentMatchId: string) => {
    if (!currentMatchId || status !== 'matching') return false;
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch(`/api/match/${currentMatchId}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        setMatchData(data);
        if (data.room?.brainhole) setBrainholeInfo(data.room.brainhole);
        if (data.status === 'matched' && data.roomId) {
          setStatus('matched');
          setPulseActive(false);
          // v6.0: 根据策略显示不同文案
          const strategyLabel = data.strategy === 'same_brainhole' ? '同话题匹配成功' 
            : data.strategy === 'same_category' ? '同类兴趣匹配成功'
            : '新朋友匹配成功';
          setStrategyMessage(strategyLabel);
          setTimeout(() => router.push(`/room/${data.roomId}`), 1500);
          return true;
        }
      }
      return false;
    } catch { return false; }
  }, [status, router]);

  useEffect(() => {
    const savedIdentity = localStorage.getItem('xh_duo_identity');
    if (!savedIdentity) { router.push('/duo-match'); return; }
    identityRef.current = savedIdentity;
    const savedBrainhole = localStorage.getItem('xh_duo_brainhole');
    brainholeIdRef.current = urlBrainholeId || savedBrainhole || undefined;

    // 如果有brainholeId，获取信息
    if (brainholeIdRef.current) {
      fetch(`/api/brainholes/${brainholeIdRef.current}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            setBrainholeInfo({ id: res.data.id, title: res.data.title, scenario: res.data.scenario });
          }
        })
        .catch(() => {});
    }

    const matchTimer = setTimeout(async () => {
      try {
        const guestId = localStorage.getItem('xh_user_id');
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(guestId ? { 'x-guest-id': guestId } : {}) },
          body: JSON.stringify({
            identity: savedIdentity, preferDifferent: true, timeoutMinutes: 1, mode: 'quick',
            brainholeId: brainholeIdRef.current || undefined,
          }),
        });
        const result = await res.json();
        if (result.success && result.data?.matchId) {
          const mid = result.data.matchId;
          setMatchId(mid);
          localStorage.setItem('xh_duo_match_id', mid);
          // v6.0: 如果已经匹配成功（阶段1/2/3直接命中）
          if (result.data.status === 'matched' && result.data.roomId) {
            setStatus('matched');
            setPulseActive(false);
            setMatchData(result.data);
            const strategyLabel = result.data.strategy === 'same_brainhole' ? '同话题匹配成功' 
              : result.data.strategy === 'same_category' ? '同类兴趣匹配成功'
              : '新朋友匹配成功';
            setStrategyMessage(strategyLabel);
            if (result.data.brainholeTitle && !brainholeInfo) {
              setBrainholeInfo({ id: result.data.brainholeId || '', title: result.data.brainholeTitle, scenario: '' });
            }
            setTimeout(() => router.push(`/room/${result.data.roomId}`), 1500);
          }
        } else {
          setMatchError(result.message || '匹配请求未成功');
        }
      } catch (err: any) {
        setMatchError(err?.message || '网络异常');
      }
    }, MATCH_DELAY);
    return () => clearTimeout(matchTimer);
  }, [router, urlBrainholeId]);

  // v6.0: 倒计时 + 策略阶段更新
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => {
        const next = prev + 1;
        // 更新策略阶段
        if (next <= 3) {
          setCurrentStrategy(0);
          setStrategyMessage('正在搜索同话题的对撞人...');
        } else if (next <= 6) {
          setCurrentStrategy(1);
          setStrategyMessage('同话题暂无匹配，正在寻找同类兴趣...');
        } else if (next <= 10) {
          setCurrentStrategy(2);
          setStrategyMessage('正在从热门参与话题中为你匹配...');
        } else {
          setCurrentStrategy(3);
          setStrategyMessage('正在扩大搜索范围...');
        }
        
        if (next >= MATCH_TIMEOUT) {
          clearInterval(timer);
          const params = new URLSearchParams();
          if (matchId) params.set('matchId', matchId);
          params.set('round', String(urlRound));
          router.push(`/duo-timeout?${params.toString()}`);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [matchId, router, urlRound]);

  useEffect(() => {
    if (!matchId || status !== 'matching') return;
    const pollTimer = setInterval(async () => {
      const shouldStop = await pollMatchStatus(matchId);
      if (shouldStop) clearInterval(pollTimer);
    }, POLL_INTERVAL);
    return () => clearInterval(pollTimer);
  }, [matchId, status, pollMatchStatus]);

  const progress = Math.min((elapsedTime / MATCH_TIMEOUT) * 100, 100);
  const remaining = Math.max(MATCH_TIMEOUT - elapsedTime, 0);
  const dots = '.'.repeat((elapsedTime % 4) + 1);

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="寻找对撞人" showBack onBack={() => router.back()} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 relative">
        {/* 雷达扫描背景 */}
        {pulseActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-40 h-40 rounded-full border border-xh-gold/20"
            />
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              className="absolute w-40 h-40 rounded-full border border-xh-gold/15"
            />
          </div>
        )}

        {/* 刘看山 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative z-10 mb-6"
        >
          <div className="relative">
            <LiuKanshanAvatar size="lg" animate emotion={status === 'matched' ? 'happy' : 'thinking'} />
            {status === 'matching' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3 rounded-full border border-dashed border-xh-gold/20"
              />
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center w-full relative z-10"
            >
              {/* 脑洞话题卡片 */}
              {brainholeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 mx-auto max-w-xs card-elevated p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-xh-gold" />
                    <span className="text-[10px] text-xh-gold/70 font-medium">对撞话题</span>
                  </div>
                  <p className="text-sm text-slate-100 font-medium truncate">{brainholeInfo.title}</p>
                </motion.div>
              )}

              {/* v6.0: 四级匹配策略进度 */}
              <div className="mb-4 mx-auto max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  {MATCH_STRATEGIES.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = idx === currentStrategy;
                    const isCompleted = idx < currentStrategy;
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isActive ? 'bg-xh-gold/20 border border-xh-gold/40 shadow-lg shadow-xh-gold/10' 
                            : isCompleted ? 'bg-emerald-500/15 border border-emerald-500/30' 
                            : 'bg-slate-800/40 border border-slate-700/20'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 transition-colors ${
                            isActive ? 'text-xh-gold' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                          }`} />
                        </div>
                        <span className={`text-[9px] transition-colors ${
                          isActive ? 'text-xh-gold font-medium' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
                        }`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                {/* 策略进度条 */}
                <div className="w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-xh-gold to-orange-400"
                    style={{ width: `${((currentStrategy + 1) / MATCH_STRATEGIES.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* 主文案 */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Radar className="w-4 h-4 text-xh-gold animate-pulse" />
                  <p className="text-base font-medium text-slate-100">
                    {strategyMessage}{dots}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  刘看山已派出 {elapsedTime * 3 + 12} 个信号波
                </p>
              </div>

              {/* 倒计时 */}
              <div className="mb-4">
                <p className="text-4xl font-bold text-xh-gold mb-2">{remaining}</p>
                <div className="w-64 h-2 bg-slate-700/30 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-xh-gold to-orange-400"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5">
                  四级匹配策略 · 超时可选AI对话
                </p>
              </div>

              {/* 状态标签 */}
              <div className="flex items-center justify-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700/20">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  信号正常
                </span>
                {matchId && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700/20">
                    <Zap className="w-3 h-3 text-xh-gold" />
                    已发起匹配
                  </span>
                )}
              </div>

              {matchError && (
                <p className="text-[10px] text-slate-600 mt-3">匹配请求处理中，请稍候...</p>
              )}
            </motion.div>
          )}

          {status === 'matched' && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center relative z-10"
            >
              {brainholeInfo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 mx-auto max-w-xs card-elevated p-3 border-emerald-500/20"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400/70 font-medium">对撞话题</span>
                  </div>
                  <p className="text-sm text-emerald-400 font-medium truncate">{brainholeInfo.title}</p>
                </motion.div>
              )}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4"
              >
                <User className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <p className="text-lg font-bold text-emerald-400 mb-2">{strategyMessage}！</p>
              <p className="text-xs text-slate-500">正在进入对白室...</p>
              <div className="w-48 h-1 bg-slate-700/30 rounded-full overflow-hidden mt-4 mx-auto">
                <motion.div
                  className="h-full bg-emerald-400 rounded-full"
                  initial={{ width: 0 }} animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-4 text-center shrink-0">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            已等待 {elapsedTime} 秒
          </span>
          <span>|</span>
          <span>第 {urlRound} 次匹配</span>
          <span>|</span>
          <span className="text-xh-gold/60">v6.0 四级匹配</span>
        </div>
      </div>
    </div>
  );
}

export default function DuoWaitingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
      </div>
    }>
      <DuoWaitingContent />
    </Suspense>
  );
}
