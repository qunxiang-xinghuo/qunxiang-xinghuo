'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';

interface BrainholeBubble {
  id: string;
  title: string;
  difficulty: string;
}

const modes = [
  {
    id: 'solo',
    title: '单人模式',
    description: '一个人，一个脑洞，一段真实反应',
    gradient: 'from-rose-500 to-orange-500',
    icon: (
      <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'duo',
    title: '双人模式',
    description: '匹配陌生人，碰撞思想火花',
    gradient: 'from-violet-500 to-purple-500',
    icon: (
      <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'multi',
    title: '多人组队',
    description: '三五好友，共创群像故事',
    gradient: 'from-emerald-500 to-teal-500',
    icon: (
      <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    badge: '即将上线',
    disabled: true,
  },
];

/* 浮动气泡背景 */
function FloatingBubbles() {
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.15 + 0.05,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: `radial-gradient(circle at 30% 30%, rgba(251,146,60,${b.opacity}), rgba(244,63,94,${b.opacity * 0.5}))`,
            boxShadow: `inset -3px -3px 8px rgba(0,0,0,0.1), inset 3px 3px 8px rgba(255,255,255,0.2)`,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            scale: [1, 1.05, 0.95, 1.02, 1],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* 脑洞泡泡池 */
function BrainholeBubblePool() {
  const router = useRouter();
  const [bubbles, setBubbles] = useState<BrainholeBubble[]>([]);

  useEffect(() => {
    fetch('/api/brainholes?page=1&limit=8')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data?.brainholes) {
          const list = result.data.brainholes.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            difficulty: String(b.difficulty || 'medium'),
          }));
          setBubbles(list);
        } else {
          // fallback
          setBubbles([
            { id: '1', title: '急诊室的抉择', difficulty: 'hard' },
            { id: '2', title: '法庭上的意外证据', difficulty: 'hard' },
            { id: '3', title: '课堂上的突发状况', difficulty: 'medium' },
            { id: '4', title: '餐厅的投诉处理', difficulty: 'medium' },
            { id: '5', title: '系统上线前的致命bug', difficulty: 'hard' },
            { id: '6', title: '家庭财产分配纠纷', difficulty: 'medium' },
            { id: '7', title: '医疗事故的隐瞒与坦白', difficulty: 'hard' },
            { id: '8', title: '客户信息的泄露危机', difficulty: 'hard' },
          ]);
        }
      })
      .catch(() => {
        setBubbles([
          { id: '1', title: '急诊室的抉择', difficulty: 'hard' },
          { id: '2', title: '法庭上的意外证据', difficulty: 'hard' },
          { id: '3', title: '课堂上的突发状况', difficulty: 'medium' },
          { id: '4', title: '餐厅的投诉处理', difficulty: 'medium' },
          { id: '5', title: '系统上线前的致命bug', difficulty: 'hard' },
        ]);
      });
  }, []);

  const diffColor = (d: string) => {
    if (d === 'hard') return 'from-red-500/30 to-orange-500/30 border-red-500/40';
    if (d === 'medium') return 'from-yellow-500/30 to-orange-500/30 border-yellow-500/40';
    return 'from-green-500/30 to-emerald-500/30 border-green-500/40';
  };

  const diffLabel = (d: string) => {
    if (d === 'hard') return '困难';
    if (d === 'medium') return '中等';
    return '简单';
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-xh-gold" />
        <h2 className="text-sm font-medium text-white">热门脑洞泡泡</h2>
        <span className="text-[10px] text-gray-500">点击任意泡泡进入</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {bubbles.map((b, i) => (
          <motion.button
            key={b.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/brainhole/${b.id}`)}
            className={`px-3 py-2 rounded-full text-xs text-white border bg-gradient-to-r ${diffColor(b.difficulty)} backdrop-blur-sm transition-all shadow-lg`}
            title={`难度: ${diffLabel(b.difficulty)}`}
          >
            {b.title}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeModeIndex, setActiveModeIndex] = useState(0);

  const startMode = (mode: string) => {
    if (mode === 'solo') router.push('/identity?mode=solo');
    else if (mode === 'duo') router.push('/identity?mode=duo');
  };

  const scrollMode = (direction: number) => {
    const newIndex = activeModeIndex + direction;
    if (newIndex >= 0 && newIndex < modes.length) setActiveModeIndex(newIndex);
  };

  return (
    <div className="flex flex-col h-full relative overflow-y-auto no-scrollbar">
      <TopBar />

      {/* 浮动气泡背景 */}
      <FloatingBubbles />

      {/* 装饰性大光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-xh-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-48 h-48 bg-xh-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="pt-8 pb-6 px-6 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles className="w-6 h-6 text-xh-gold" />
          <h1 className="text-3xl font-bold tracking-wider text-white">群像·星火</h1>
          <Sparkles className="w-6 h-6 text-xh-gold" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm text-gray-400 leading-relaxed"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 min-h-[120px]">
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => startMode(modes[activeModeIndex].id)}
          disabled={modes[activeModeIndex].disabled}
          className="group relative disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-xh-accent to-rose-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-gradient-to-r from-xh-accent to-rose-600 text-white px-10 py-5 rounded-full text-lg font-medium shadow-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            开始创作
          </div>
        </motion.button>
      </div>

      {/* 脑洞泡泡池 */}
      <div className="relative z-10">
        <BrainholeBubblePool />
      </div>

      <div className="pb-10 relative z-10">
        <div className="flex items-center justify-between px-6 mb-4">
          <span className="text-xs text-gray-500">选择创作模式</span>
          <div className="flex gap-1" id="mode-dots">
            {modes.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: i === activeModeIndex ? 1.2 : 1,
                  backgroundColor: i === activeModeIndex ? '#f59e0b' : '#374151',
                }}
                className="w-2 h-2 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => !mode.disabled && setActiveModeIndex(i)}
              whileHover={!mode.disabled ? { scale: 1.02, y: -2 } : {}}
              className={`flex-shrink-0 w-[75%] snap-center rounded-2xl p-5 bg-gradient-to-br ${mode.gradient} transition-shadow cursor-pointer shadow-lg ${
                i === activeModeIndex ? 'scale-100 opacity-100 ring-2 ring-white/30' : 'scale-95 opacity-60'
              } ${mode.disabled ? 'cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                {mode.icon}
                {mode.badge && (
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{mode.badge}</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{mode.title}</h3>
              <p className="text-xs text-white/80 leading-relaxed">{mode.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollMode(-1)}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => scrollMode(1)}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
