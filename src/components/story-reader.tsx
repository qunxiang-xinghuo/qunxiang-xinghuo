'use client';

import type { Story } from '@/lib/data';

interface StoryReaderProps {
  story: Story;
}

export function StoryReader({ story }: StoryReaderProps) {
  return (
    <article className="max-w-2xl mx-auto px-5 py-12 sm:py-16">
      {/* Header */}
      <header className="text-center mb-14 opacity-0 animate-fade-in">
        <div className="section-label mb-4">
          {story.status === 'finished'
            ? '精选故事'
            : story.status === 'draft'
              ? '心理剧记录'
              : '故事种子'}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wide mb-4">
          {story.title}
        </h1>
        <div className="text-sm text-ink-secondary tracking-wider">
          {story.subtitle}
        </div>
        <div className="flex justify-center gap-2 mt-5">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="w-10 h-0.5 bg-brand-gold/40 mx-auto mt-8 rounded-full" />
      </header>

      {/* Spark Bar */}
      <div className="flex justify-center gap-8 mb-10 py-5 border-y border-border/60 opacity-0 animate-fade-in-up delay-100">
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

      {/* Story Content */}
      <div className="space-y-5">
        {story.blocks.map((block, i) => {
          if (block.type === 'chapter') {
            return (
              <div
                key={i}
                className="chapter-divider opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {block.chapterTitle}
              </div>
            );
          }

          if (block.type === 'thought') {
            return (
              <div
                key={i}
                className="thought-block opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {block.text ?? ''}
              </div>
            );
          }

          if (block.type === 'dialogue') {
            const isLeft = block.character === '林屿';
            const hasSpark = block.isSpark;
            return (
              <div
                key={i}
                className={`flex items-start gap-3.5 opacity-0 animate-msg-in ${isLeft ? '' : 'flex-row-reverse'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
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
                  {hasSpark && (
                    <div className="mt-1.5 text-[10px] text-brand-gold flex items-center gap-1">
                      ✨ 高光时刻
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Ending */}
      <div className="text-center mt-20 py-10 border-t border-border/60">
        <div className="text-[11px] text-ink-muted tracking-[4px] mb-3">
          - 终 -
        </div>
        <div className="text-sm text-ink-secondary italic font-serif">
          &ldquo;也许，这才是故事的开始。&rdquo;
        </div>
      </div>
    </article>
  );
}
