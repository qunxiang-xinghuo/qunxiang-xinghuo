'use client';

import type { Story } from '@/lib/data';

interface StoryReaderProps {
  story: Story;
}

export function StoryReader({ story }: StoryReaderProps) {
  return (
    <article className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="text-center mb-12 opacity-0 animate-fade-in">
        <div className="text-[10px] tracking-[4px] text-ink-ghost mb-3">
          {story.status === 'finished'
            ? '精 选 故 事'
            : story.status === 'draft'
              ? '心 理 剧 记 录'
              : '故 事 种 子'}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wider mb-4">
          {story.title}
        </h1>
        <div className="text-[11px] text-ink-faint tracking-wider">
          {story.subtitle}
        </div>
        <div className="flex justify-center gap-3 mt-4">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="w-10 h-px bg-line mx-auto mt-6" />
      </header>

      {/* Spark Bar */}
      <div className="flex justify-center gap-6 mb-8 py-4 border-y border-line opacity-0 animate-fade-in-up delay-100">
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

      {/* Story Content */}
      <div className="space-y-4">
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
                className={`flex items-start gap-3 opacity-0 animate-msg-in ${isLeft ? '' : 'flex-row-reverse'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
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
                  {hasSpark && (
                    <div className="mt-1 text-[9px] text-brand-gold flex items-center gap-1">
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
      <div className="text-center mt-16 py-8 border-t border-line">
        <div className="text-[10px] text-ink-ghost tracking-wider mb-2">
          - 终 -
        </div>
        <div className="text-xs text-ink-faint italic font-serif">
          &ldquo;也许，这才是故事的开始。&rdquo;
        </div>
      </div>
    </article>
  );
}
