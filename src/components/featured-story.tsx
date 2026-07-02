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
      <div className="flex justify-center gap-6 mb-8 py-4 border-y border-line">
        {story.sparks.map((spark) => (
          <div key={spark.label} className="text-center">
            <div className="text-sm mb-1">
              {spark.icon === 'fire'
                ? Array(spark.count).fill('🔥').join('')
                : spark.icon === 'sparkle'
                  ? '💫'
                  : '✨'}
            </div>
            <div className="text-[9px] text-ink-ghost tracking-wider">
              {spark.label} x{spark.count}
            </div>
          </div>
        ))}
      </div>

      {/* Opening scene preview */}
      <div className="bg-card-bg rounded-2xl card-shadow p-6 mb-6">
        <div className="text-center mb-4">
          <span className="text-[10px] text-ink-ghost tracking-[3px]">
            {story.subtitle}
          </span>
        </div>

        {/* First few dialogue blocks */}
        <div className="space-y-4">
          {story.blocks.slice(0, 6).map((block, i) => {
            if (block.type === 'chapter') {
              return (
                <div key={i} className="chapter-divider">
                  {block.chapterTitle}
                </div>
              );
            }
            if (block.type === 'thought') {
              return (
                <div key={i} className="thought-block">
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-sans ${
                      isLeft
                        ? 'bg-gradient-to-br from-[#7ab0d4] to-[#4a88b8]'
                        : 'bg-gradient-to-br from-[#d4a574] to-[#b8885a]'
                    }`}
                  >
                    {block.character?.[0]}
                  </div>
                  <div className="max-w-[420px]">
                    <div
                      className={`text-[11px] font-semibold tracking-wider mb-1 font-sans ${
                        isLeft
                          ? 'text-brand-blue'
                          : 'text-ink-ghost text-right'
                      }`}
                    >
                      {block.character}
                    </div>
                    <div
                      className={`text-[14.5px] leading-[1.9] whitespace-pre-line ${
                        isLeft
                          ? 'bg-card-bg p-3.5 rounded-[4px_16px_16px_16px] text-ink card-shadow'
                          : 'bg-gradient-to-br from-[#3a5a7e] to-[#2a4a6e] p-3.5 rounded-[16px_4px_16px_16px] text-white/90'
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
          className="inline-flex items-center gap-2 px-6 py-3 text-xs text-ink-faint border border-line rounded-2xl hover:border-brand-gold/40 hover:text-brand-gold transition-all duration-500 tracking-wider"
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
