'use client';

import Link from 'next/link';
import type { Story } from '@/lib/data';

interface StoryReaderProps {
  story: Story;
}

export function StoryReader({ story }: StoryReaderProps) {
  return (
    <div className="theater-bg pt-14 min-h-screen">
      {/* Back link */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/stories"
            className="inline-flex items-center gap-1.5 text-xs text-ink-faint/50 hover:text-brand-gold transition-colors duration-300 tracking-wider"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回故事集
          </Link>
        </div>
      </div>

      {/* Story content */}
      <div className="px-4 pb-20">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-10 opacity-0 animate-fade-in">
            <div className="text-[10px] text-ink-faint/40 tracking-[0.3em] mb-4">
              群 像 · 星 火 · 故 事
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-black text-white/90 tracking-[0.2em] leading-tight mb-3">
              {story.title}
            </h1>
            <div className="text-xs text-ink-faint/40 tracking-wider">
              {story.subtitle}
            </div>
            <div className="w-10 h-px bg-line/15 mx-auto mt-6" />
          </div>

          {/* Spark bar */}
          <div className="flex justify-center gap-6 mb-10 py-4 border-y border-white/5 opacity-0 animate-fade-in delay-200">
            {story.sparks.map((spark) => (
              <div key={spark.label} className="text-center">
                <div className="text-sm mb-1">
                  {spark.icon === 'fire'
                    ? Array(spark.count)
                        .fill('🔥')
                        .join('')
                    : spark.icon === 'sparkle'
                      ? '💫'
                      : '✨'}
                </div>
                <div className="text-[9px] text-ink-ghost/40 tracking-wider">
                  {spark.label} x{spark.count}
                </div>
              </div>
            ))}
          </div>

          {/* Dialogue blocks */}
          <div className="space-y-1">
            {story.blocks.map((block, i) => {
              const delay = Math.min(i * 0.05, 1);

              if (block.type === 'chapter') {
                return (
                  <div
                    key={i}
                    className="chapter-divider text-ink-ghost/30 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    {block.chapterTitle}
                  </div>
                );
              }

              if (block.type === 'thought') {
                return (
                  <div
                    key={i}
                    className="thought-block text-ink-faint/40 !border-white/10 !bg-gradient-to-r !from-white/[0.02] !to-transparent opacity-0 animate-fade-in"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    {(block.text ?? '').split('\n').map((line, j) => (
                      <span key={j}>
                        {j > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </div>
                );
              }

              if (block.type === 'dialogue') {
                const isLeft = block.character === story.blocks.find(
                  (b) => b.type === 'dialogue'
                )?.character;
                const firstChar = story.blocks.find(
                  (b) => b.type === 'dialogue'
                )?.character;
                const isLeftSide = block.character === firstChar;

                // Get character colors from data
                const charColors: Record<string, { bg: string; gradient: string }> = {
                  '林屿': {
                    bg: 'bg-gradient-to-br from-[#7ab0d4] to-[#4a88b8]',
                    gradient: 'bg-white/[0.04] rounded-[4px_16px_16px_16px]',
                  },
                  '苏远': {
                    bg: 'bg-gradient-to-br from-[#d4a574] to-[#b8885a]',
                    gradient:
                      'bg-gradient-to-br from-[#3a5a7e]/40 to-[#2a4a6e]/40 rounded-[16px_4px_16px_16px]',
                  },
                };

                const colors = charColors[block.character || ''] || {
                  bg: 'bg-brand-blue/50',
                  gradient: 'bg-white/[0.04] rounded-2xl',
                };

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 my-4 opacity-0 animate-fade-in ${
                      block.isSpark ? 'spark-mark' : ''
                    } ${isLeftSide ? '' : 'flex-row-reverse'}`}
                    style={{ animationDelay: `${delay}s` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${colors.bg}`}
                    >
                      {block.character?.[0]}
                    </div>
                    <div className={`max-w-[85%] ${colors.gradient} p-3.5`}>
                      <div
                        className={`text-[10px] font-medium mb-1.5 tracking-wider ${
                          isLeftSide
                            ? 'text-brand-blue/60'
                            : 'text-white/30 text-right'
                        }`}
                      >
                        {block.character}
                      </div>
                      <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
                        {block.text ?? ''}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Ending */}
          <div className="mt-12 p-6 bg-gradient-to-br from-brand-gold/[0.04] to-brand-blue/[0.03] rounded-2xl text-center opacity-0 animate-fade-in delay-500">
            <p className="font-serif text-sm text-ink-light/60 leading-relaxed italic whitespace-pre-line">
              {story.endingText}
            </p>
            <div className="text-[9px] text-ink-ghost/30 mt-4 tracking-wider">
              {story.endingTag}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-ink-ghost/30">
              这个故事来自{' '}
              <span className="text-brand-blue/50">群像·星火</span>{' '}
              的真实对话
            </p>
            <p className="text-[10px] text-ink-ghost/20 mt-2">
              给两个陌生人一个场景，让他们在对话中，把彼此变成故事里的角色。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
