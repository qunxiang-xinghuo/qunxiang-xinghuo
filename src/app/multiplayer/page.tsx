'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Theater, Users, Zap, ArrowRight, Sparkles, Crown, Vote, MessageSquare } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

const features = [
  { icon: Users, label: '3-8人群像', desc: '多人同时在线对戏' },
  { icon: Crown, label: '导演控场', desc: '导演掌控节奏与方向' },
  { icon: Vote, label: '剧情投票', desc: '集体决定故事走向' },
  { icon: MessageSquare, label: '实时对白', desc: 'WebSocket即时同步' },
];

const entryPoints = [
  {
    id: 'hall',
    title: '故事大厅',
    subtitle: '浏览招募中的群像剧场',
    icon: Theater,
    path: '/story-hall',
    color: 'from-xh-gold to-orange-500',
    bgColor: 'from-xh-gold/20 to-orange-500/10',
    borderColor: 'border-xh-gold/25',
  },
  {
    id: 'quick',
    title: '快速组队',
    subtitle: '选脑洞 · 定身份 · 秒匹配',
    icon: Zap,
    path: '/multi-match',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'from-violet-500/20 to-purple-500/10',
    borderColor: 'border-violet-500/25',
  },
];

export default function MultiplayerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="多人组队" showBack onBack={() => router.back()} />

      {/* 剧场头部 */}
      <div className="shrink-0 px-5 pt-6 pb-4">
        <motion.div
          initial={mounted ? { opacity: 0, y: -12 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-xh-gold/20 to-orange-500/10 border border-xh-gold/25 flex items-center justify-center">
            <Theater className="w-6 h-6 text-xh-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">群像共创剧场</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">多人角色扮演，共同书写故事</p>
          </div>
        </motion.div>

        {/* 功能特性 */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={mounted ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/30 border border-slate-700/15"
              >
                <div className="w-8 h-8 rounded-lg bg-xh-gold/10 flex items-center justify-center shrink-0 border border-xh-gold/15">
                  <Icon className="w-4 h-4 text-xh-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-300">{f.label}</p>
                  <p className="text-[10px] text-slate-600">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 入口区 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-3">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1 h-4 rounded-full bg-xh-gold" />
          <span className="text-sm font-semibold text-slate-300">选择入口</span>
        </div>

        {entryPoints.map((entry, index) => {
          const Icon = entry.icon;
          return (
            <motion.button
              key={entry.id}
              initial={mounted ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(entry.path)}
              className={`group w-full relative overflow-hidden rounded-2xl p-5 text-left card-elevated border ${entry.borderColor}`}
            >
              {/* 背景渐变 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${entry.bgColor} opacity-30 pointer-events-none`} />
              <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${entry.bgColor} border ${entry.borderColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-7 h-7 bg-gradient-to-br ${entry.color} bg-clip-text`} style={{ color: entry.id === 'hall' ? '#e2b04a' : '#a78bfa' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-100">{entry.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.subtitle}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-xh-gold group-hover:translate-x-1 transition-all duration-300 shrink-0" />
              </div>
            </motion.button>
          );
        })}

        {/* 流程说明 */}
        <motion.div
          initial={mounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 rounded-2xl bg-slate-800/20 border border-slate-700/15"
        >
          <h4 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-xh-gold" />
            群像共创流程
          </h4>
          <div className="space-y-2.5">
            {[
              { step: '1', text: '导演创建故事，设定世界观与角色' },
              { step: '2', text: '演员认领角色，提交身份与演绎方向' },
              { step: '3', text: '导演审核通过所有角色' },
              { step: '4', text: '启动故事，进入对白实验室' },
              { step: '5', text: '实时对戏，导演可随时暂停/分支投票' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-xh-gold/15 text-xh-gold text-[10px] font-bold flex items-center justify-center shrink-0 border border-xh-gold/20 mt-0.5">
                  {item.step}
                </span>
                <span className="text-xs text-slate-500 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
