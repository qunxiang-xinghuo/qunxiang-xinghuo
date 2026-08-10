/**
 * @file 故事种子页面
 * @description 展示创作灵感和故事种子
 * 提供金句、反转、秘密、余韵等类型的创作素材
 * 支持"浇水"（点赞）功能，满100赞显示"即将被培育成完整故事"
 */

'use client';

import { useState } from 'react';
import { storySeeds } from '@/lib/data';

export default function SeedsPage() {
  const types = ['全部', '金句', '反转', '秘密', '余韵', '灵感'];
  const [activeType, setActiveType] = useState('全部');
  const [likes, setLikes] = useState<Record<string, number>>({});

  const filteredSeeds =
    activeType === '全部'
      ? storySeeds
      : storySeeds.filter((seed) => seed.type === activeType);

  const handleLike = (seedId: string) => {
    setLikes((prev) => ({
      ...prev,
      [seedId]: (prev[seedId] || 0) + 1,
    }));
  };

  return (
    <div className="site-bg px-5 py-14">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-14">
          <div className="section-label mb-3">故事种子</div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wide mb-4">
            未开发的灵感
          </h1>
          <p className="text-base text-ink-secondary max-w-md mx-auto leading-relaxed">
            从对话中提炼的灵感片段，等待被培育成完整的故事。
          </p>
          <div className="w-10 h-0.5 bg-brand-gold/40 mx-auto mt-8 rounded-full" />
        </div>

        {/* Type Filter Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {types.map((type) => (
            <span
              key={type}
              onClick={() => setActiveType(type)}
              className={`text-[11px] px-3 py-1.5 rounded-md font-medium cursor-pointer transition-colors duration-200 ${
                activeType === type
                  ? 'bg-brand-blue/10 text-brand-blue'
                  : 'bg-gray-50 text-ink-muted hover:bg-brand-gold/10 hover:text-brand-gold'
              }`}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Seeds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeeds.map((seed, i) => {
            const likeCount = likes[seed.id] || 0;
            const isCultivating = likeCount >= 100;
            return (
              <div
                key={seed.id}
                className="seed-card p-6 pl-7 rounded-xl bg-card-bg card-shadow opacity-0 animate-fade-in-up relative"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-md font-medium ${
                      seed.type === '金句'
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : seed.type === '秘密'
                          ? 'bg-brand-blue/10 text-brand-blue'
                          : seed.type === '反转'
                            ? 'bg-purple-50 text-purple-600'
                            : seed.type === '余韵'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-50 text-ink-muted'
                    }`}
                  >
                    {seed.type}
                  </span>
                  <span className="text-[10px] text-ink-muted/60">
                    {seed.createdAt}
                  </span>
                </div>
                <h3 className="font-serif text-base text-ink mb-3">
                  {seed.title}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3 mb-4">
                  {seed.content}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <button
                    onClick={() => handleLike(seed.id)}
                    className="text-xs text-ink-muted hover:text-brand-gold transition-colors flex items-center gap-1"
                  >
                    🌱 浇水 {likeCount > 0 && `(${likeCount})`}
                  </button>
                  {isCultivating && (
                    <span className="text-[10px] text-brand-gold font-medium">
                       即将被培育成完整故事
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-ink-muted tracking-wider">
              更多灵感即将记录
            </p>
            <p className="text-xs text-ink-muted/60 mt-2">
              每次对话都可能诞生新的故事种子
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
