'use client';

import Link from 'next/link';
import type { Story } from '@/lib/data';

interface FeaturedStoryProps {
  story: Story;
}

export function FeaturedStory({ story }: FeaturedStoryProps) {
  return (
    <div className="relative">
      {/* Spark Bar */}
      <div className="flex justify-center gap-6 mb-8 py-4 border-y border-white/5">
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

      {/* Opening scene */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6 mb-6">
        <div className="text-center mb-4">
          <span className="text-[10px] text-ink-ghost/40 tracking-[0.3em]">
            {story.subtitle}
          </span>
        </div>

        {/* First few dialogue blocks */}
        <div className="space-y-4">
          {story.blocks.slice(0, 6).map((block, i) => {
            if (block.type === 'chapter') {
              return (
                <div key={i} className="chapter-divider text-ink-ghost/30">
                  {block.chapterTitle}
                </div>
              );
            }
            if (block.type === 'thought') {
              return (
                <div
                  key={i}
                  className="thought-block text-ink-faint/40 !border-white/10 !bg-gradient-to-r !from-white/[0.02] !to-transparent"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {block.text ?? ''}
                </div>
              );
            }
            if (block.type === 'dialogue') {
              const isLeft = block.character === '林屿';
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      isLeft
                        ? 'bg-gradient-to-br from-[#7ab0d4] to-[#4a88b8]'
                        : 'bg-gradient-to-br from-[#d4a574] to-[#b8885a]'
                    }`}
                  >
                    {block.character?.[0]}
                  </div>
                  <div
                    className={`max-w-[85%] ${
                      isLeft
                        ? 'bg-white/[0.04] rounded-[4px_16px_16px_16px]'
                        : 'bg-gradient-to-br from-[#3a5a7e]/40 to-[#2a4a6e]/40 rounded-[16px_4px_16px_16px]'
                    } p-3.5`}
                  >
                    <div
                      className={`text-[10px] font-medium mb-1 tracking-wider ${
                        isLeft
                          ? 'text-brand-blue/60'
                          : 'text-white/30 text-right'
                      }`}
                    >
                      {block.character}
                    </div>
                    <div
                      className={`text-sm leading-relaxed whitespace-pre-line ${
                        isLeft ? 'text-white/70' : 'text-white/70'
                      }`}
                    >
                      {block.text ?? ''}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Read more */}
      <div className="text-center">
        <Link
          href={`/stories/${story.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs text-ink-faint/60 border border-white/10 rounded-xl hover:border-brand-gold/30 hover:text-brand-gold transition-all duration-500 tracking-wider"
        >
          阅读完整故事
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
