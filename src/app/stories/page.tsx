import type { Metadata } from 'next';
import Link from 'next/link';
import { stories } from '@/lib/data';

export const metadata: Metadata = {
  title: '故事集',
  description: '从角色扮演中诞生的故事，每一段对话都是真实的。',
};

export default function StoriesPage() {
  const finishedStories = stories.filter((s) => s.status === 'finished');
  const draftStories = stories.filter((s) => s.status === 'draft');
  const seedStories = stories.filter((s) => s.status === 'seed');

  return (
    <div className="theater-bg pt-14 min-h-screen">
      {/* Page Header */}
      <section className="px-4 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center opacity-0 animate-fade-in">
            <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-3">
              故 事 集
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white/90 tracking-wider mb-4">
              心理剧记录
            </h1>
            <p className="text-sm text-ink-faint/50 max-w-md mx-auto leading-relaxed">
              从角色扮演中诞生的故事，每一段对话都来自真实的即兴演绎。
            </p>
            <div className="w-10 h-px bg-line/20 mx-auto mt-6" />
          </div>
        </div>
      </section>

      {/* Finished Stories */}
      {finishedStories.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] tracking-[0.3em] text-brand-gold/60">
                完 成 品
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-4">
              {finishedStories.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-gold/20 hover:bg-white/[0.05] transition-all duration-500 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Story info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold/60 tracking-wider">
                          成品
                        </span>
                        <span className="text-[9px] text-ink-ghost/30">
                          {story.createdAt}
                        </span>
                      </div>
                      <h2 className="font-serif text-xl text-white/80 group-hover:text-brand-gold transition-colors duration-300 mb-1">
                        {story.title}
                      </h2>
                      <p className="text-xs text-ink-faint/50">
                        {story.subtitle}
                      </p>
                    </div>

                    {/* Spark summary */}
                    <div className="flex items-center gap-4">
                      {story.sparks.slice(0, 3).map((spark) => (
                        <div key={spark.label} className="text-center">
                          <div className="text-xs mb-0.5">
                            {spark.icon === 'fire'
                              ? '🔥'
                              : spark.icon === 'sparkle'
                                ? '💫'
                                : '✨'}
                          </div>
                          <div className="text-[8px] text-ink-ghost/30">
                            {spark.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Arrow */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-ink-ghost/20 group-hover:text-brand-gold/50 transition-colors duration-300 hidden sm:block"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-ink-ghost/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Draft Stories */}
      {draftStories.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] tracking-[0.3em] text-brand-blue/50">
                草 稿
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="text-center py-10 text-sm text-ink-faint/30">
              暂无草稿
            </div>
          </div>
        </section>
      )}

      {/* Seed Stories */}
      {seedStories.length > 0 && (
        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] tracking-[0.3em] text-ink-ghost/30">
                种 子
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="text-center py-10 text-sm text-ink-faint/30">
              暂无故事种子
            </div>
          </div>
        </section>
      )}

      {/* Empty state for drafts/seeds */}
      {draftStories.length === 0 && seedStories.length === 0 && (
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl mb-3 opacity-30">📝</div>
              <p className="text-sm text-ink-faint/40 mb-2">
                更多故事正在酝酿中
              </p>
              <p className="text-xs text-ink-ghost/30">
                去场景库选一个舞台，开始你的第一段对话
              </p>
              <Link
                href="/scenes"
                className="inline-block mt-4 px-5 py-2 text-xs text-brand-blue/60 border border-brand-blue/20 rounded-xl hover:border-brand-gold/30 hover:text-brand-gold transition-all duration-300 tracking-wider"
              >
                进入场景库
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
