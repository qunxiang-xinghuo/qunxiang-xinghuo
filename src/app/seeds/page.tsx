import type { Metadata } from 'next';
import { storySeeds } from '@/lib/data';

export const metadata: Metadata = {
  title: '故事种子',
  description: '从对话中提炼的灵感片段，等待被开发成完整的故事。',
};

export default function SeedsPage() {
  const typeColors: Record<string, string> = {
    '金句': 'bg-brand-gold/10 text-brand-gold/70',
    '反转': 'bg-purple-500/10 text-purple-400/70',
    '秘密': 'bg-brand-blue/10 text-brand-blue/70',
    '余韵': 'bg-emerald-500/10 text-emerald-400/70',
    '灵感': 'bg-white/5 text-ink-ghost/50',
  };

  return (
    <div className="theater-bg pt-14 min-h-screen">
      {/* Page Header */}
      <section className="px-4 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center opacity-0 animate-fade-in">
            <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-3">
              故 事 种 子
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white/90 tracking-wider mb-4">
              未开发的灵感
            </h1>
            <p className="text-sm text-ink-faint/50 max-w-md mx-auto leading-relaxed">
              从对话中提炼的金句、反转、秘密，等待被开发成完整的故事。
            </p>
            <div className="w-10 h-px bg-line/20 mx-auto mt-6" />
          </div>
        </div>
      </section>

      {/* Seeds Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Filter tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 opacity-0 animate-fade-in delay-200">
            {['全部', '金句', '反转', '秘密', '余韵', '灵感'].map((tag) => (
              <button
                key={tag}
                className="text-[10px] px-3 py-1.5 rounded-full bg-white/5 text-ink-ghost/50 hover:text-brand-gold hover:border-brand-gold/20 border border-transparent transition-all duration-300 tracking-wider cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Seed cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storySeeds.map((seed, i) => (
              <div
                key={seed.id}
                className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-gold/10 hover:bg-white/[0.04] transition-all duration-500 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full ${typeColors[seed.type] || typeColors['灵感']}`}
                  >
                    {seed.type}
                  </span>
                  <span className="text-[9px] text-ink-ghost/30">
                    {seed.createdAt}
                  </span>
                </div>
                <h3 className="font-serif text-sm text-white/70 group-hover:text-brand-gold/80 transition-colors duration-300 mb-3">
                  {seed.title}
                </h3>
                <p className="text-xs text-ink-faint/40 leading-relaxed">
                  {seed.content}
                </p>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <span className="text-[9px] text-ink-ghost/20 tracking-wider">
                    来自场景: {seed.fromScene}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state hint */}
          {storySeeds.length === 0 && (
            <div className="text-center py-16">
              <div className="text-2xl mb-3 opacity-30">🌱</div>
              <p className="text-sm text-ink-faint/30">
                还没有故事种子
              </p>
              <p className="text-xs text-ink-ghost/20 mt-2">
                完成一次角色扮演对话，标记高光时刻，就能收获故事种子
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
