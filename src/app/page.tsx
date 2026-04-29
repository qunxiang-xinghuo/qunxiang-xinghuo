'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame, Zap, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import BubbleCloud from '@/components/bubble-cloud/BubbleCloud';
import LiuKanshanFloat from '@/components/layout/LiuKanshanFloat';
import ZhihuHotBubbles from '@/components/zhihu/ZhihuHotBubbles';

const modes = [
  {
    id: 'solo',
    title: '单人模式',
    description: '一个人，一个脑洞，一段真实反应',
    gradient: 'from-rose-500 to-orange-500',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'duo',
    title: '双人模式',
    description: '匹配陌生人，碰撞思想火花',
    gradient: 'from-violet-500 to-purple-500',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'multi',
    title: '多人组队',
    description: '三五好友，共创群像故事',
    gradient: 'from-emerald-500 to-teal-500',
    icon: <Sparkles className="w-5 h-5" />,
    badge: '即将上线',
    disabled: true,
  },
];

const categories = [
  { id: 'all', label: '全部', color: '#95a5a6' },
  { id: 'medical', label: '医疗', color: '#e74c3c' },
  { id: 'legal', label: '法律', color: '#3498db' },
  { id: 'workplace', label: '职场', color: '#f39c12' },
  { id: 'life', label: '生活', color: '#2ecc71' },
  { id: 'education', label: '教育', color: '#9b59b6' },
  { id: 'tech', label: '技术', color: '#1abc9c' },
  { id: 'emergency', label: '紧急', color: '#e67e22' },
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

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(450);

  // 动态计算泡泡云容器高度
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.innerHeight;
      // 减去顶部栏、标题、模式选择器的高度
      const reservedHeight = 180 + 140;
      setContainerHeight(Math.max(350, vh - reservedHeight));
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const startMode = (mode: string) => {
    if (mode === 'solo') router.push('/identity?mode=solo');
    else if (mode === 'duo') router.push('/identity?mode=duo');
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <TopBar />

      {/* 浮动气泡背景 */}
      <FloatingBubbles />

      {/* 装饰性大光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-xh-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-48 h-48 bg-xh-gold/10 rounded-full blur-3xl" />
      </div>

      {/* 顶部标题区 */}
      <div className="pt-4 pb-2 px-4 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-1"
        >
          <Sparkles className="w-5 h-5 text-xh-gold" />
          <h1 className="text-2xl font-bold tracking-wider text-white">群像·星火</h1>
          <Sparkles className="w-5 h-5 text-xh-gold" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs text-gray-400"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      {/* 分类筛选栏 */}
      <div className="px-3 py-2 relative z-10">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? 'text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
              style={
                activeCategory === cat.id
                  ? {
                      background: `${cat.color}30`,
                      border: `1px solid ${cat.color}60`,
                      color: cat.color,
                      boxShadow: `0 0 12px ${cat.color}30`,
                    }
                  : {}
              }
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 泡泡云区域 */}
      <div className="flex-1 relative z-10 overflow-hidden" style={{ minHeight: containerHeight }}>
        <BubbleCloud
          category={activeCategory === 'all' ? undefined : activeCategory}
        />
      </div>

      {/* 知乎热榜 */}
      <div className="relative z-10">
        <ZhihuHotBubbles />
      </div>

      {/* 底部模式选择 */}
      <div className="pb-4 pt-2 relative z-10 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent">
        <div className="flex items-center justify-between px-4 mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-xh-gold" />
            <span className="text-xs text-gray-400">选择创作模式</span>
          </div>
          <div className="flex gap-1">
            {modes.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: i === activeModeIndex ? 1.2 : 1,
                  backgroundColor: i === activeModeIndex ? '#f59e0b' : '#374151',
                }}
                className="w-1.5 h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-4">
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => {
                if (!mode.disabled) {
                  setActiveModeIndex(i);
                  startMode(mode.id);
                }
              }}
              whileHover={!mode.disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!mode.disabled ? { scale: 0.98 } : {}}
              className={`flex-1 rounded-xl p-3 bg-gradient-to-br ${mode.gradient} transition-all cursor-pointer shadow-lg ${
                i === activeModeIndex && !mode.disabled
                  ? 'ring-2 ring-white/30'
                  : 'opacity-80'
              } ${mode.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-white/90">{mode.icon}</div>
                {mode.badge && (
                  <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                    {mode.badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white">{mode.title}</h3>
              <p className="text-[10px] text-white/70 leading-tight mt-0.5">{mode.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 刘看山泡泡向导 */}
      <LiuKanshanFloat mode="default" />
    </div>
  );
}
