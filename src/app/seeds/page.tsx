'use client';

import { useState } from 'react';
import { storySeeds } from '@/lib/data';

const typeFilters = ['全部', '金句', '反转', '秘密', '余韵'];

export default function SeedsPage() {
  const [activeFilter, setActiveFilter] = useState('全部');

  const filteredSeeds =
    activeFilter === '全部'
      ? storySeeds
      : storySeeds.filter((s) => s.type === activeFilter);

  return (
    <div className="site-bg px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[4px] text-ink-ghost mb-3">
            故 事 种 子
          </div>
          <h1 className="font-serif text-3xl text-ink tracking-wider mb-4">
            未开发的灵感
          </h1>
          <p className="text-sm text-ink-faint max-w-md mx-auto leading-relaxed">
            从对话中提炼的灵感片段。
            <br />
            每一颗种子都可能长成一个完整的故事。
          </p>
          <div className="w-10 h-px bg-line mx-auto mt-6" />
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-8">
          {typeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs tracking-wider rounded-xl border transition-all duration-300 ${
                activeFilter === filter
                  ? 'border-brand-gold/40 bg-brand-gold/5 text-brand-gold'
                  : 'border-line text-ink-faint hover:border-blue-soft/40 hover:text-ink-light'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Seeds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredSeeds.map((seed, i) => (
            <div
              key={seed.id}
              className="p-5 rounded-2xl bg-card-bg border border-line-light card-shadow opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full ${
                    seed.type === '金句'
                      ? 'bg-brand-gold/10 text-brand-gold'
                      : seed.type === '秘密'
                        ? 'bg-brand-blue/10 text-brand-blue'
                        : 'bg-card-inner text-ink-ghost'
                  }`}
                >
                  {seed.type}
                </span>
                <span className="text-[9px] text-ink-ghost/50">
                  {seed.createdAt}
                </span>
              </div>
              <h3 className="font-serif text-sm text-ink-light mb-2">
                {seed.title}
              </h3>
              <p className="text-xs text-ink-faint leading-relaxed">
                {seed.content}
              </p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSeeds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-ink-ghost tracking-wider">
              暂无此类种子
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
