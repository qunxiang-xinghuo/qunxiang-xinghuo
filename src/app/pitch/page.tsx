'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Users, MessageCircle, BookOpen, Zap, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';

const TOTAL = 6;

/* ====== Slide 1: 封面（5秒） ====== */
function S1() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Flame className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-slate-800 mb-3">群像·<span className="text-blue-600">星火</span></h1>
        <p className="text-2xl text-slate-500">用一个对话，开启一个故事</p>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 text-slate-400 text-lg">
        双人对白创作平台 · AI 智能催化 · 沉浸式故事系统
      </motion.p>
    </div>
  );
}

/* ====== Slide 2: 痛点（20秒） ====== */
function S2() {
  return (
    <div className="flex flex-col h-full px-20 py-16">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">痛点</p>
      <h2 className="text-4xl font-bold text-slate-800 mb-10">刷完2小时短视频，你留下了什么？</h2>
      <div className="grid grid-cols-3 gap-8 flex-1 items-center">
        {[
          { num: '3亿+', label: '剧本杀用户', sub: '渴望角色扮演，但时间成本高、组人难' },
          { num: '2亿+', label: 'AIGC创作者', sub: '有表达欲，但缺乏低门槛创作工具' },
          { num: '100%', label: '社交疲惫', sub: '被动消费内容，没有真正的思想碰撞' },
        ].map((item, idx) => (
          <motion.div key={idx} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.12 }} className="text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">{item.num}</div>
            <div className="text-lg font-semibold text-slate-700 mb-1">{item.label}</div>
            <div className="text-sm text-slate-400">{item.sub}</div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-6">
        <p className="text-xl text-slate-600"><span className="font-bold text-blue-600">核心矛盾</span>：人们渴望创作，但缺乏<span className="font-bold">低门槛、有反馈、能沉淀</span>的场景</p>
      </motion.div>
    </div>
  );
}

/* ====== Slide 3: 解决方案（30秒） ====== */
function S3() {
  return (
    <div className="flex flex-col h-full px-20 py-16">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">解决方案</p>
      <h2 className="text-4xl font-bold text-slate-800 mb-8">选择身份 · 实时碰撞 · AI 催化</h2>
      <div className="grid grid-cols-3 gap-6 flex-1">
        {[
          { icon: Users, title: '双人对白', desc: '8大职业身份，31个冲突情境，10秒匹配陌生人实时对白', color: 'from-blue-400 to-blue-600' },
          { icon: BookOpen, title: '故事系统', desc: '5个太仓解密故事，起承转合四幕结构，你只知道自己的身份', color: 'from-emerald-400 to-emerald-600' },
          { icon: Zap, title: 'AI 催化', desc: 'DeepSeek + 知乎直答双引擎，对话每6-10条自动推动剧情', color: 'from-amber-400 to-amber-600' },
        ].map((c, idx) => (
          <motion.div key={idx} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: idx * 0.15 }} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-4 shadow-lg`}>
              <c.icon className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{c.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed flex-1">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ====== Slide 4: 产品演示（70秒） ====== */
function S4() {
  return (
    <div className="flex flex-col h-full px-20 py-14">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">产品演示</p>
      <h2 className="text-4xl font-bold text-slate-800 mb-6">从玩故事，到写故事</h2>
      <div className="flex gap-6 flex-1">
        <div className="flex-1 space-y-3">
          {[
            { step: '1', title: '选身份', desc: '医生、律师、教师... 进入一个冲突情境' },
            { step: '2', title: '匹配', desc: '10秒匹配真人，或选择与AI"刘看山"对戏' },
            { step: '3', title: '对白', desc: '实时聊天，信息不对等，碰撞出火花' },
            { step: '4', title: '催化', desc: 'AI根据进度抛出环境事件，推动剧情' },
            { step: '5', title: '沉淀', desc: '结束自动生成"火花"，可分享或保存' },
          ].map((s, idx) => (
            <motion.div key={idx} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-100">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">{s.step}</span>
              <div>
                <span className="font-semibold text-slate-800">{s.title}</span>
                <span className="text-slate-400 text-sm ml-2">{s.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="w-72 flex-shrink-0 p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex flex-col justify-center">
          <h4 className="font-bold mb-3">创作者闭环</h4>
          <div className="space-y-2 text-sm">
            <p>✓ 玩故事：参与已有故事</p>
            <p>✓ 写故事：提交原创设定</p>
            <p>✓ 得回报：热度排行+粉丝</p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 text-xs text-blue-100">
            故事审核流程：审核中 → 招募中 → 进行中 → 火花沉淀
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ====== Slide 5: 市场与愿景（30秒） ====== */
function S5() {
  return (
    <div className="flex flex-col h-full px-20 py-16">
      <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">市场与愿景</p>
      <h2 className="text-4xl font-bold text-slate-800 mb-8">互动叙事蓝海，星火燎原</h2>
      <div className="flex gap-8 flex-1">
        <div className="flex-1 space-y-4">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="text-3xl font-bold">120亿+</div>
            <div className="text-blue-100 text-sm">中国互动叙事市场规模（剧本杀/密室/互动小说）</div>
          </motion.div>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="p-5 rounded-2xl bg-white border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">竞品差异</div>
            <p className="text-sm text-slate-500">剧本杀APP组人难 · 互动小说无真实互动 · AI聊天缺叙事结构 · 写作社区反馈慢</p>
            <p className="text-sm text-blue-600 font-semibold mt-1">我们 = 真人实时对白 + 结构化故事 + AI催化 + 社交沉淀</p>
          </motion.div>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-white border border-slate-100">
            <div className="font-bold text-slate-800 mb-1">未来规划</div>
            <p className="text-sm text-slate-500">近期：50+故事 + UGC审核 · 中期：长期连载 + 创作者激励 · 远期：IP孵化 + 星火宇宙</p>
          </motion.div>
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="w-64 flex-shrink-0 p-6 rounded-2xl bg-gradient-to-b from-amber-50 to-white border border-amber-100 flex flex-col justify-center">
          <h4 className="font-bold text-slate-800 mb-4 text-center">核心理念</h4>
          <div className="space-y-3 text-sm text-slate-600">
            <p>「让真实发光，让思想变现」</p>
            <p>「你不再是别人故事的看客，而是创造自己故事的主角」</p>
            <p>「从玩故事到写故事，人人都是创作者」</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ====== Slide 6: 结尾（5秒） ====== */
function S6() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Flame className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-bold text-slate-800 mb-3">群像·<span className="text-blue-600">星火</span></h2>
        <p className="text-xl text-slate-500 mb-8">让每个人都拥有属于自己的故事</p>
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-6">
        <a href="/home" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform">
          立即体验 <ArrowRight className="w-4 h-4" />
        </a>
        <span className="text-sm text-slate-400">Next.js 16 + React 19 + DeepSeek API</span>
      </motion.div>
    </div>
  );
}

const SLIDES = [S1, S2, S3, S4, S5, S6];

export default function PitchPage() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(0);

  const next = useCallback(() => {
    if (current < TOTAL - 1) { setDir(1); setCurrent(c => c + 1); }
  }, [current]);
  const prev = useCallback(() => {
    if (current > 0) { setDir(-1); setCurrent(c => c - 1); }
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const Slide = SLIDES[current];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl aspect-video bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current} custom={dir}
            initial={{ x: dir > 0 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir > 0 ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <Slide />
          </motion.div>
        </AnimatePresence>

        <button onClick={prev} disabled={current === 0} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-0 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={next} disabled={current === TOTAL - 1} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-0 transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'}`} />
          ))}
          <span className="ml-3 text-xs text-slate-400 font-medium">{current + 1} / {TOTAL}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">← → 方向键或空格键切换</p>
    </div>
  );
}
