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
      <div className="flex justify-center gap-8 mb-10 py-5 border-y border-border/60">
        {story.sparks.map((spark) => (
          <div key={spark.label} className="text-center">
            <div className="text-base mb-1.5">
              {spark.icon === 'fire'
                ? Array(spark.count).fill('🔥').join('')
                : spark.icon === 'sparkle'
                  ? '💫'
                  : '✨'}
            </div>
            <div className="text-[10px] text-ink-muted tracking-wider">
              {spark.label} <span className="text-ink-secondary font-medium">x{spark.count}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Opening scene preview */}
      <div className="bg-card-bg rounded-2xl card-shadow p-6 sm:p-8 mb-6">
        <div className="text-center mb-6">
          <span className="text-[11px] text-ink-muted tracking-[3px]">
            {story.subtitle}
          </span>
        </div>

        {/* First few dialogue blocks */}
        <div className="space-y-5">
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
                  className={`flex items-start gap-3.5 ${isLeft ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      isLeft
                        ? 'bg-gradient-to-br from-[#5a9ed8] to-[#2d5f8a]'
                        : 'bg-gradient-to-br from-[#d4a574] to-[#a07040]'
                    }`}
                  >
                    {block.character?.[0]}
                  </div>
                  <div className="max-w-[440px]">
                    <div
                      className={`text-[11px] font-semibold tracking-wider mb-1.5 ${
                        isLeft
                          ? 'text-brand-blue'
                          : 'text-ink-muted text-right'
                      }`}
                    >
                      {block.character}
                    </div>
                    <div
                      className={`text-[15px] leading-[1.9] whitespace-pre-line ${
                        isLeft
                          ? 'bg-card-bg p-4 rounded-[4px_16px_16px_16px] text-ink card-shadow border border-border/40'
                          : 'bg-gradient-to-br from-[#2d5f8a] to-[#1a3a5c] p-4 rounded-[16px_4px_16px_16px] text-white/90'
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
          className="inline-flex items-center gap-2 text-sm text-brand-blue hover:text-brand-blue-light transition-colors duration-300 tracking-wide"
        >
          继续阅读
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
