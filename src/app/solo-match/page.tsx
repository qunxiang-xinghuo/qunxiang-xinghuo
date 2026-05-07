'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Sparkles, Shuffle, User } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import Image from 'next/image';

const IDENTITIES = [
  { label: '便利店常客', desc: '每晚都来买关东煮' },
  { label: '末班乘客', desc: '总在最后一班上车' },
  { label: '外卖骑手', desc: '送餐时看到太多故事' },
  { label: '深夜加班族', desc: '办公室最后一个走的人' },
];

export default function SoloMatchPage() {
  const router = useRouter();
  const [selectedIdentity, setSelectedIdentity] = useState('');
  const [customIdentity, setCustomIdentity] = useState('');
  const [mode, setMode] = useState<'preset' | 'random' | 'custom'>('preset');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const saved = localStorage.getItem('xh_duo_identity');
    if (saved) setSelectedIdentity(saved);
  }, []);

  const handleStart = async () => {
    let identity = '';
    if (mode === 'preset') identity = selectedIdentity;
    else if (mode === 'random') identity = IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)].label;
    else identity = customIdentity.trim();

    if (!identity) {
      identity = '我';
    }

    localStorage.setItem('xh_duo_identity', identity);
    setCreating(true);

    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/rooms/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ identity }),
      });
      const result = await res.json();
      if (result.success && result.data?.roomId) {
        // 保存返回的 userId 用于后续 guest 身份验证
        if (result.data?.userId && !localStorage.getItem('xh_user_id')) {
          localStorage.setItem('xh_user_id', result.data.userId);
        }
        router.push(`/room/${result.data.roomId}`);
      } else {
        setError('创建房间失败，请重试');
        setCreating(false);
      }
    } catch (err) {
      setError('网络异常，请重试');
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="和刘看山对话" showBack onBack={() => router.push('/home')} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-6 pb-24">
        {/* 刘看山介绍 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden border-2 border-[#74b9ff]/30 bg-gradient-to-br from-[#74b9ff]/10 to-blue-500/10">
            <Image src="/liukanshan.jpg" alt="刘看山" fill className="object-cover" sizes="80px" />
          </div>
          <h2 className="text-lg font-bold text-white/90 mb-1">与刘看山对话</h2>
          <p className="text-xs text-white/40 leading-relaxed max-w-[260px] mx-auto">
            一只好奇心重的北极狐，<br />
            喜欢问"为什么"，偶尔也会调皮
          </p>
        </motion.div>

        {/* 身份选择 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-sm font-medium text-white/70 mb-3">选择你的身份</p>

          {/* 模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('preset')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === 'preset' ? 'bg-[#e2b04a]/20 text-[#e2b04a] border border-[#e2b04a]/30' : 'bg-white/[0.03] text-white/30 border border-white/5'
              }`}
            >
              预设身份
            </button>
            <button
              onClick={() => setMode('random')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === 'random' ? 'bg-[#e2b04a]/20 text-[#e2b04a] border border-[#e2b04a]/30' : 'bg-white/[0.03] text-white/30 border border-white/5'
              }`}
            >
              <Shuffle className="w-3 h-3 inline mr-1" />
              AI随机
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === 'custom' ? 'bg-[#e2b04a]/20 text-[#e2b04a] border border-[#e2b04a]/30' : 'bg-white/[0.03] text-white/30 border border-white/5'
              }`}
            >
              <User className="w-3 h-3 inline mr-1" />
              自定义
            </button>
          </div>

          {/* 预设身份 */}
          {mode === 'preset' && (
            <div className="grid grid-cols-2 gap-2">
              {IDENTITIES.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setSelectedIdentity(item.label)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedIdentity === item.label
                      ? 'bg-[#e2b04a]/10 border-[#e2b04a]/30'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedIdentity === item.label ? 'text-[#e2b04a]' : 'text-white/80'}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* 自定义 */}
          {mode === 'custom' && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <input
                type="text"
                value={customIdentity}
                onChange={(e) => setCustomIdentity(e.target.value)}
                placeholder="输入你的身份，比如：夜班护士"
                className="w-full bg-transparent text-sm text-white placeholder-white/20 focus:outline-none"
                maxLength={20}
              />
            </div>
          )}

          {mode === 'random' && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
              <Sparkles className="w-5 h-5 text-[#e2b04a]/60 mx-auto mb-2" />
              <p className="text-sm text-white/60">刘看山会为你随机分配一个身份</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="shrink-0 px-5 pt-2">
          <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg py-2">{error}</p>
        </div>
      )}

      {/* 底部开始按钮 —— pb 已增大防止被固定导航栏遮挡 */}
      <div className="shrink-0 px-5 pb-20 pt-2 bg-gradient-to-t from-[#0a0e1a] to-transparent">
        <button
          onClick={handleStart}
          disabled={creating || (mode === 'preset' && !selectedIdentity) || (mode === 'custom' && !customIdentity.trim())}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e2b04a] to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Bot className="w-4 h-4" />
              开始对话
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
