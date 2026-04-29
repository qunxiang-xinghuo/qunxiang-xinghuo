'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Mic, Star, Pause, Vote, Clapperboard } from 'lucide-react';

/* ================================================================
   群像·星火 路演网页版 v2 — 大图少字视觉风格
   访问: http://localhost:3000/roadshow
   操作: ← → 方向键 / 空格键 切换幻灯片
   ================================================================= */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

export default function RoadshowPage() {
  const [[idx, dir], setPage] = useState([0, 0]);

  const go = useCallback((d: number) => {
    setPage((p) => {
      const n = p[0] + d;
      if (n < 0 || n >= 10) return p;
      return [n, d];
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white overflow-hidden relative select-none">
      {/* 顶部进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-white/5 z-50">
        <motion.div className="h-full bg-orange-500 rounded-r-full"
          animate={{ width: `${((idx + 1) / 10) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>
      <div className="fixed top-3 right-5 text-white/30 text-xs font-mono z-50">
        {idx + 1} / 10
      </div>

      {/* 幻灯片容器 */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={idx} custom={dir} variants={slideVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="w-full max-w-5xl"
          >
            {idx === 0 && <SlideCover />}
            {idx === 1 && <SlidePain />}
            {idx === 2 && <SlideProduct />}
            {idx === 3 && <SlideSingle />}
            {idx === 4 && <SlideDuo />}
            {idx === 5 && <SlideMulti />}
            {idx === 6 && <SlideTech />}
            {idx === 7 && <SlideBiz />}
            {idx === 8 && <SlideMilestone />}
            {idx === 9 && <SlideEnd />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 导航 */}
      <NavButton dir={-1} disabled={idx === 0} onClick={() => go(-1)} />
      <NavButton dir={1} disabled={idx === 9} onClick={() => go(1)} />

      {/* 底部提示 */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-xs z-50">
        ← → 方向键切换 · 空格下一张
      </div>
    </div>
  );
}

/* ===================== 各页组件 ===================== */

function SlideCover() {
  return (
    <div className="text-center relative">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}
        className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-orange-500/20 blur-2xl" />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-0 right-0 w-52 h-52 rounded-full bg-orange-500/10 blur-3xl" />
      <motion.h1 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-8xl font-black text-orange-500 tracking-tight mb-4">
        群像·星火
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-2xl text-white/90 mb-2">
        基于真实职业经验的多人协同创作平台
      </motion.p>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
        className="text-lg text-amber-400 mb-8">
        让真实的人，在真实的情境中，碰撞出真实的火花
      </motion.p>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
        className="w-48 h-1 bg-orange-500 mx-auto rounded-full mb-8" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        className="flex items-center justify-center gap-6 text-white/40 text-sm">
        <span className="bg-white/5 px-3 py-1 rounded-full">Next.js 16</span>
        <span className="bg-white/5 px-3 py-1 rounded-full">216 Tests</span>
        <span className="bg-white/5 px-3 py-1 rounded-full">DeepSeek AI</span>
      </motion.div>
    </div>
  );
}

function SlidePain() {
  return (
    <div className="flex items-center gap-12">
      {/* 左侧大问号 */}
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}
        className="w-56 h-56 rounded-full bg-orange-500 flex items-center justify-center shrink-0 shadow-2xl shadow-orange-500/30">
        <span className="text-[140px] font-black text-[#1a1a2e] leading-none">?</span>
      </motion.div>
      {/* 右侧痛点 */}
      <div className="flex-1 space-y-5">
        <h2 className="text-4xl font-bold text-orange-500 mb-6">创作者的困境</h2>
        {[
          { title: '专业细节，写不对', desc: '急诊流程 / 律师质证 / 外卖跑单' },
          { title: '视角单一，写不深', desc: '编剧只采访了医生，没采访护士' },
          { title: '有经历的人，没渠道', desc: '退休阿姨 / 急诊护士 / 程序员' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.15 }}
            className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="text-xl font-bold text-orange-400 mb-1">{item.title}</div>
            <div className="text-white/50 text-sm">{item.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideProduct() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-2">群像·星火</h2>
      <p className="text-white/50 mb-10">基于真实职业经验的多人协同创作平台</p>

      {/* 碰撞概念图 */}
      <div className="relative h-64 flex items-center justify-center mb-10">
        {/* 左圆 */}
        <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="w-36 h-36 rounded-full bg-blue-500 flex items-center justify-center text-xl font-bold z-10">
          医生
        </motion.div>
        {/* 碰撞火花 */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
          className="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center text-lg font-bold z-20 -mx-6">
          碰撞
        </motion.div>
        {/* 右圆 */}
        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="w-36 h-36 rounded-full bg-pink-500 flex items-center justify-center text-xl font-bold z-10">
          导演
        </motion.div>
      </div>

      {/* 底部关键词 */}
      <div className="flex justify-center gap-3">
        {['真实身份', '同一情境', '即时对白', '火花标记', 'AI串联'].map((tag, i) => (
          <motion.span key={tag} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
            className="px-4 py-2 bg-white/[0.03] border border-orange-500/30 rounded-full text-orange-400 text-sm">
            {tag}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function SlideSingle() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-8">模式一：单人灵感积累</h2>
      <div className="flex items-center justify-center gap-10">
        {/* 步骤 */}
        <div className="space-y-5 text-left">
          {[
            { num: '1', label: '选身份', sub: '医生 / 导演 / 外卖员' },
            { num: '2', label: '刷脑洞', sub: '左滑跳过 · 右滑收藏' },
            { num: '3', label: 'AI催化', sub: 'DeepSeek生成引导问题' },
            { num: '4', label: '存素材', sub: '语音/文字反应入库' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-[#1a1a2e]">{s.num}</div>
              <div>
                <div className="text-lg font-bold">{s.label}</div>
                <div className="text-white/40 text-sm">{s.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* 手机模拟 */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="w-56 h-[340px] rounded-[32px] bg-[#111122] border-4 border-white/10 p-4 flex flex-col items-center">
          <div className="w-20 h-1 bg-white/20 rounded-full mb-4" />
          <div className="text-sm font-bold text-white/80 mb-3">深夜急诊室</div>
          <div className="w-full bg-white/[0.05] rounded-xl p-3 mb-3">
            <div className="text-xs text-white/60">外卖员因过度劳累晕倒，你会...</div>
          </div>
          <div className="w-full bg-orange-500 rounded-xl p-3 mb-3">
            <div className="text-xs text-[#1a1a2e] font-bold">你首先会关注哪些生命体征？</div>
          </div>
          <div className="mt-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-orange-400" />
          </div>
        </motion.div>
        {/* 数据 */}
        <div className="space-y-6 text-right">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }}>
            <div className="text-5xl font-black text-orange-500">5+</div>
            <div className="text-white/40 text-sm">职业标签</div>
          </motion.div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
            <div className="text-5xl font-black text-orange-500">60+</div>
            <div className="text-white/40 text-sm">引导问题</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SlideDuo() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-10">模式二：双人即兴碰撞</h2>
      <div className="flex items-center justify-center gap-6">
        {/* 医生 */}
        <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="w-40 h-40 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/20">
          医生
        </motion.div>
        {/* 中间 */}
        <div className="flex flex-col items-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
            className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-lg font-bold mb-2">
            碰撞
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            <div className="text-xs text-amber-400 mt-1">标记火花</div>
          </motion.div>
        </div>
        {/* 导演 */}
        <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="w-40 h-40 rounded-full bg-pink-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-pink-500/20">
          导演
        </motion.div>
      </div>
      {/* 底部数据 */}
      <div className="flex justify-center gap-12 mt-12">
        {[
          { num: '60s', label: '匹配等待' },
          { num: '<100ms', label: 'WebSocket同步' },
          { num: 'AI', label: '自动串联剧本' },
        ].map((d, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
            <div className="text-3xl font-black text-orange-500">{d.num}</div>
            <div className="text-white/40 text-sm">{d.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideMulti() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-8">模式三：多人剧本共创</h2>
      {/* 导演+参与者 */}
      <div className="relative h-56 flex items-center justify-center mb-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold z-20">
          导演
        </motion.div>
        {[
          { label: '医生', x: -180, y: -20, color: 'bg-blue-500', delay: 0.1 },
          { label: '护士', x: 180, y: -20, color: 'bg-green-500', delay: 0.2 },
          { label: '家属', x: -200, y: 80, color: 'bg-purple-500', delay: 0.3 },
          { label: '律师', x: 200, y: 80, color: 'bg-cyan-500', delay: 0.4 },
        ].map((r) => (
          <motion.div key={r.label} initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: r.x, y: r.y, opacity: 1, scale: 1 }} transition={{ delay: r.delay }}
            className={`absolute w-20 h-20 rounded-full ${r.color} flex items-center justify-center text-sm font-bold`}>
            {r.label}
          </motion.div>
        ))}
      </div>
      {/* 导演控场按钮 */}
      <div className="flex justify-center gap-4 mb-8">
        {[
          { icon: <Pause className="w-4 h-4" />, label: '暂停' },
          { icon: <Vote className="w-4 h-4" />, label: '投票' },
          { icon: <Clapperboard className="w-4 h-4" />, label: '杀青' },
        ].map((btn, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 px-5 py-2 bg-white/[0.03] border border-orange-500/30 rounded-full text-orange-400">
            {btn.icon}
            <span className="text-sm font-bold">{btn.label}</span>
          </motion.div>
        ))}
      </div>
      {/* 流程 */}
      <div className="flex justify-center gap-2">
        {['创建副本', '认领角色', '导演控场', '投票决策', 'AI串联', '署名墙'].map((step, i) => (
          <motion.div key={step} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.08 }}
            className="px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white/60">
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideTech() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-8">技术架构</h2>
      {/* 分层架构 */}
      <div className="space-y-3 mb-10 max-w-2xl mx-auto">
        {[
          { label: 'Next.js 16 + React 19 + Tailwind v4', color: 'bg-blue-500', delay: 0 },
          { label: 'API Routes + NextAuth + Zod', color: 'bg-violet-500', delay: 0.1 },
          { label: 'Socket.io + match-engine + room-manager', color: 'bg-pink-500', delay: 0.2 },
          { label: 'Prisma 7 + SQLite', color: 'bg-green-500', delay: 0.3 },
        ].map((layer, i) => (
          <motion.div key={i} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: layer.delay }}
            className={`${layer.color} rounded-xl py-3 px-6 text-white font-bold text-lg`}>
            {layer.label}
          </motion.div>
        ))}
      </div>
      {/* 大数字 */}
      <div className="flex justify-center gap-16">
        {[
          { num: '216', label: 'Tests Passed', color: 'text-green-400' },
          { num: '23', label: 'Test Files', color: 'text-orange-400' },
          { num: '0', label: 'Failed', color: 'text-green-400' },
        ].map((d, i) => (
          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}>
            <div className={`text-6xl font-black ${d.color}`}>{d.num}</div>
            <div className="text-white/40 text-sm mt-1">{d.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SlideBiz() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-10">商业模式</h2>
      <div className="flex flex-col items-center gap-3">
        {/* 金字塔 - 顶层 */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="w-64 bg-orange-500 rounded-xl py-4 px-6 text-center">
          <div className="text-xl font-bold text-[#1a1a2e]">IP 共创分润</div>
          <div className="text-sm text-[#1a1a2e]/70">剧本 / 短剧 / 有声书</div>
        </motion.div>
        {/* 中层 */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="w-96 bg-blue-500 rounded-xl py-4 px-6 text-center">
          <div className="text-xl font-bold text-white">B 端内容采购</div>
          <div className="text-sm text-white/70">微短剧公司 / 互动小说平台</div>
        </motion.div>
        {/* 底层 */}
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="w-[28rem] bg-green-500 rounded-xl py-4 px-6 text-center">
          <div className="text-xl font-bold text-[#1a1a2e]">C 端免费增值</div>
          <div className="text-sm text-[#1a1a2e]/70">基础免费 + AI高级功能付费</div>
        </motion.div>
      </div>
    </div>
  );
}

function SlideMilestone() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-orange-500 mb-10">里程碑</h2>
      {/* 时间轴 */}
      <div className="relative max-w-3xl mx-auto mb-10">
        <div className="absolute top-5 left-0 right-0 h-1 bg-white/10 rounded-full" />
        <div className="flex justify-between relative">
          {[
            { label: 'P1', title: '匹配引擎', tests: '9 tests', delay: 0 },
            { label: 'P2', title: '房间管理', tests: '16 tests', delay: 0.1 },
            { label: 'P3', title: 'WebSocket\n+ AI串联', tests: '21 tests', delay: 0.2 },
            { label: 'P4', title: 'TDD全覆盖\n+ AI催化', tests: '216 tests', delay: 0.3 },
          ].map((p, i) => (
            <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: p.delay }}
              className="flex flex-col items-center w-32">
              <div className="w-4 h-4 rounded-full bg-orange-500 mb-3 z-10" />
              <div className="text-orange-400 font-bold text-sm mb-1">{p.label}</div>
              <div className="text-white/80 text-sm whitespace-pre-line leading-tight">{p.title}</div>
              <div className="text-green-400 text-xs mt-1">{p.tests}</div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* 大数字 */}
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
        <div className="text-8xl font-black text-green-400">216 <span className="text-white/20">/</span> 216</div>
        <div className="text-white/40 text-sm mt-2">All Tests Passed · 23 Test Files · 22 API Routes Covered</div>
      </motion.div>
    </div>
  );
}

function SlideEnd() {
  return (
    <div className="text-center relative">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.8 }}
        className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-orange-500/20 blur-3xl" />
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute -bottom-8 -right-8 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />

      <motion.h1 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-7xl font-black text-orange-500 mb-4">
        最好的故事
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-2xl text-white/80 mb-2">
        不是一个人关在房间里写出来的
      </motion.p>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
        className="text-xl text-amber-400 mb-8">
        而是让真实的人在真实的情境中碰撞出来的
      </motion.p>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: 'spring' }}
        className="flex items-center justify-center gap-3 text-orange-500">
        <Heart className="w-8 h-8 fill-orange-500" />
        <span className="text-4xl font-bold">谢谢大家</span>
        <Heart className="w-8 h-8 fill-orange-500" />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        className="text-white/30 text-sm mt-6">
        github.com/qunxiang-xinghuo
      </motion.p>
    </div>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: number; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`fixed ${dir < 0 ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-3 rounded-full
        bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all z-50`}>
      {dir < 0 ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
    </button>
  );
}
