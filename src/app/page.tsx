'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

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

export default function Home() {
  const router = useRouter();
  const [activeModeIndex, setActiveModeIndex] = useState(0);

  const startMode = (mode: string) => {
    if (mode === 'solo') {
      router.push('/identity?mode=solo');
    } else if (mode === 'duo') {
      router.push('/identity?mode=duo');
    }
  };

  const scrollMode = (direction: number) => {
    const newIndex = activeModeIndex + direction;
    if (newIndex >= 0 && newIndex < modes.length) {
      setActiveModeIndex(newIndex);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-xh-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-0 w-48 h-48 bg-xh-gold/10 rounded-full blur-3xl"></div>
      </div>

      <div className="pt-8 pb-6 px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-xh-gold" />
          <h1 className="text-3xl font-bold tracking-wider text-white">群像·星火</h1>
          <Sparkles className="w-6 h-6 text-xh-gold" />
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">每一个认真生活的人，都能成为故事的一部分</p>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        <button
          onClick={() => startMode(modes[activeModeIndex].id)}
          disabled={modes[activeModeIndex].disabled}
          className="group relative animate-float disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-xh-accent to-rose-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-xh-accent to-rose-600 text-white px-10 py-5 rounded-full text-lg font-medium shadow-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            开始创作
          </div>
        </button>
      </div>

      <div className="pb-10 relative z-10">
        <div className="flex items-center justify-between px-6 mb-4">
          <span className="text-xs text-gray-500">选择创作模式</span>
          <div className="flex gap-1" id="mode-dots">
            {modes.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === activeModeIndex ? 'bg-xh-gold' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
          {modes.map((mode, i) => (
            <div
              key={mode.id}
              onClick={() => !mode.disabled && setActiveModeIndex(i)}
              className={`flex-shrink-0 w-[75%] snap-center rounded-2xl p-5 bg-gradient-to-br ${mode.gradient} transition-all cursor-pointer ${
                i === activeModeIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
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
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => scrollMode(-1)}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scrollMode(1)}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
