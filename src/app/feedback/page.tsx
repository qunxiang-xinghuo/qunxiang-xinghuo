'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Home } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [reactionCount, setReactionCount] = React.useState(0);

  React.useEffect(() => {
    try {
      const reactions = JSON.parse(localStorage.getItem('xh_reactions') || '[]');
      setReactionCount(Array.isArray(reactions) ? reactions.length : 0);
    } catch {
      setReactionCount(0);
    }
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Sparkles
              className={`text-xh-gold`}
              style={{
                width: `${8 + Math.random() * 12}px`,
                height: `${8 + Math.random() * 12}px`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center w-full">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-xh-gold/30 absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}></div>
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-xh-gold/20 to-xh-gold-dark/20 flex items-center justify-center border border-xh-gold/30 animate-pulse-glow">
              <Sparkles className="w-12 h-12 text-xh-gold" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">你的真实反应已被收录</h2>
        <p className="text-gray-400 mb-2">成为故事燃料</p>

        <div className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 mb-8">
          <BookOpen className="w-4 h-4 text-xh-accent" />
          <span className="text-sm text-gray-300">
            你已累计记录 <span className="text-xh-gold font-bold">{reactionCount}</span> 个真实反应
          </span>
        </div>

        <div className="space-y-3 max-w-sm mx-auto">
          <button
            onClick={() => router.push('/match')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white py-4 rounded-xl font-medium shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            继续探索下一个脑洞
          </button>

          <button
            onClick={() => router.push('/home')}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-400 py-4 rounded-xl font-medium hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
