'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Users, Theater, Mountain, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const modes = [
  {
    id: 'solo',
    title: '单人模式',
    desc: '真实反应记录',
    icon: User,
    color: '#ff9f43',
    bgColor: 'from-orange-500/20 to-rose-500/20',
    borderColor: 'border-orange-500/30',
    available: true,
  },
  {
    id: 'duo',
    title: '双人模式',
    desc: '即时对戏碰撞',
    icon: Users,
    color: '#a29bfe',
    bgColor: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30',
    available: true,
  },
  {
    id: 'multi',
    title: '多人组队',
    desc: '群像共创·连载',
    icon: Theater,
    color: '#55efc4',
    bgColor: 'from-emerald-500/20 to-teal-500/20',
    borderColor: 'border-emerald-500/30',
    available: false,
  },
  {
    id: 'healing',
    title: '疗愈空间',
    desc: '刘看山AI陪伴',
    icon: Mountain,
    color: '#74b9ff',
    bgColor: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    available: false,
  },
  {
    id: 'couple',
    title: '密友空间',
    desc: '双人小世界',
    icon: Heart,
    color: '#fd79a8',
    bgColor: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
    available: false,
  },
];

export default function ModeDock() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleModeClick = (mode: typeof modes[0]) => {
    if (!mode.available) {
      return;
    }
    if (mode.id === 'solo') {
      router.push('/identity?mode=solo');
    } else if (mode.id === 'duo') {
      router.push('/identity?mode=duo');
    } else if (mode.id === 'multi') {
      router.push('/multiplayer');
    } else if (mode.id === 'healing') {
      router.push('/healing');
    } else if (mode.id === 'couple') {
      router.push('/couple');
    }
  };

  return (
    <div className="w-full">
      {/* 标题 */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-orange-400 to-rose-400" />
        <span className="text-xs text-white/50">选择创作模式</span>
      </div>

      {/* 可滑动Dock */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide"
      >
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={mode.available ? { scale: 1.05, y: -2 } : {}}
              whileTap={mode.available ? { scale: 0.95 } : {}}
              onClick={() => handleModeClick(mode)}
              className={`flex-shrink-0 w-[110px] p-3 rounded-2xl border backdrop-blur-sm transition-all ${
                mode.available
                  ? `${mode.borderColor} bg-gradient-to-br ${mode.bgColor} cursor-pointer hover:shadow-lg`
                  : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
              style={{
                boxShadow: mode.available ? `0 0 20px ${mode.color}15` : 'none',
              }}
            >
              {/* 图标 */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{
                  background: `linear-gradient(135deg, ${mode.color}30, ${mode.color}10)`,
                  border: `1px solid ${mode.color}25`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: mode.color }} />
              </div>

              {/* 文字 */}
              <h3 className="text-xs font-bold text-white mb-0.5">{mode.title}</h3>
              <p className="text-[9px] text-white/40 leading-tight">{mode.desc}</p>

              {/* 状态标记 */}
              {!mode.available && (
                <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[8px] bg-white/10 text-white/30">
                  即将上线
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
