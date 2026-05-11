'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Sparkles, Edit3, Check, BrainCircuit, ArrowRight, DoorOpen, Share2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

interface IdentityOption {
  type: 'zhihu' | 'ai' | 'custom';
  label: string;
  desc: string;
}

const options: IdentityOption[] = [
  { type: 'zhihu', label: '知乎身份', desc: '使用已认证的职业身份' },
  { type: 'ai', label: 'AI随机生成', desc: '系统分配一个有趣的角色' },
  { type: 'custom', label: '自定义角色', desc: '输入你想要的身份和简介' },
];

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
  
  const [selectedType, setSelectedType] = useState<'zhihu' | 'ai' | 'custom'>('zhihu');
  const [zhihuIdentities, setZhihuIdentities] = useState<string[]>([]);
  const [selectedZhihuId, setSelectedZhihuId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [brainholeInfo, setBrainholeInfo] = useState<{id: string; title: string; scenario: string} | null>(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 获取知乎身份 + 预选的brainhole信息
  useEffect(() => {
    fetch('/api/users/identities')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        if (!mountedRef.current) return;
        if (res.success && res.data) {
          const labels = res.data.map((i: any) => i.label);
          setZhihuIdentities(labels);
          if (labels.length > 0) setSelectedZhihuId(labels[0]);
        }
      })
      .catch((err) => { console.error('[DuoMatch] identities fetch error:', err); });
    
    setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]);

    // v6.0: 如果从泡泡来，获取brainhole信息展示
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

  const getIdentity = () => {
    if (selectedType === 'zhihu') return selectedZhihuId || '匿名用户';
    if (selectedType === 'ai') return aiGenerated;
    return customLabel.trim() || '自定义角色';
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
      const identity = selectedType === 'zhihu' ? (selectedZhihuId || '匿名用户') :
        selectedType === 'ai' ? aiGenerated : (customLabel.trim() || '自定义角色');
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
        // v8.5-fix: 状态码映射
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
      <TopBar title="身份选择" showBack onBack={() => router.back()} />

      {/* v6.0: 如果从泡泡来，显示预选brainhole卡片 */}
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
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-lg font-bold text-slate-100 mb-1">
          {fromBubble ? '确认身份，即刻对撞' : '在这次对撞中，你是谁？'}
        </h2>
        <p className="text-xs text-slate-500">
          {fromBubble ? '话题已选好，选一个身份就开始' : '选择一个身份，系统将为你匹配对戏伙伴'}
        </p>
      </div>

      {/* 身份选项 - 卡片式布局 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-3 space-y-3">
        {options.map((option) => (
          <div
            key={option.type}
            onClick={() => setSelectedType(option.type)}
            className={`relative rounded-xl p-4 cursor-pointer transition-all border ${
              selectedType === option.type
                ? 'border-xh-gold/40 bg-xh-gold/10'
                : 'border-slate-700/15 bg-slate-700/30 hover:border-slate-600/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedType === option.type ? 'bg-xh-gold/20' : 'bg-slate-700/30'
                }`}
              >
                {option.type === 'zhihu' && <User className="w-5 h-5 text-xh-gold" />}
                {option.type === 'ai' && <Sparkles className="w-5 h-5 text-violet-400" />}
                {option.type === 'custom' && <Edit3 className="w-5 h-5 text-xh-gold" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80">{option.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === option.type ? 'border-xh-gold bg-xh-gold' : 'border-white/20'
                    }`}
                  >
                    {selectedType === option.type && <Check className="w-2.5 h-2.5 text-[#1a1a2e]" strokeWidth={4} />}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{option.desc}</p>
              </div>
            </div>

            {/* 选项详情 */}
            {selectedType === option.type && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-slate-700/15"
              >
                {option.type === 'zhihu' && (
                  <div className="space-y-1.5">
                    {zhihuIdentities.length === 0 ? (
                      <p className="text-xs text-slate-500">暂无认证身份，将使用默认身份</p>
                    ) : (
                      zhihuIdentities.map((id) => (
                        <button
                          key={id}
                          onClick={(e) => { e.stopPropagation(); setSelectedZhihuId(id); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            selectedZhihuId === id
                              ? 'bg-xh-gold/15 text-xh-gold border border-xh-gold/20'
                              : 'bg-slate-700/30 text-slate-500 hover:bg-slate-600/20'
                          }`}
                        >
                          {id}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {option.type === 'ai' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-violet-300">{aiGenerated}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]);
                      }}
                      className="ml-auto text-[10px] text-violet-400 hover:text-violet-300"
                    >
                      换一个
                    </button>
                  </div>
                )}

                {option.type === 'custom' && (
                  <div>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="例如：急诊科护士、北漂创业者..."
                      className="w-full bg-slate-700/30 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/50"
                      maxLength={20}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-[10px] text-slate-600 mt-1 text-right">{customLabel.length}/20</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* 入口按钮区域 */}
      <div className="shrink-0 px-6 py-5 border-t border-slate-700/15 space-y-3 mt-2">
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
                  // v8.5-fix: 自动去空格+转大写+仅保留字母数字
                  const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                  setJoinCode(val);
                  setJoinError('');
                }}
                placeholder="输入6位邀请码"
                className="flex-1 bg-slate-700/30 border border-slate-600/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/50 text-center tracking-widest"
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
