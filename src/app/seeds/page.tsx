import { storySeeds } from '@/lib/data';

export default function SeedsPage() {
  const types = ['金句', '反转', '秘密', '余韵'];

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
        <div className="flex justify-center gap-2 mb-10">
          <span className="text-[11px] px-3 py-1.5 rounded-md bg-brand-blue/10 text-brand-blue font-medium cursor-pointer">
            全部
          </span>
          {types.map((type) => (
            <span
              key={type}
              className="text-[11px] px-3 py-1.5 rounded-md bg-gray-50 text-ink-muted hover:bg-brand-gold/10 hover:text-brand-gold transition-colors duration-200 cursor-pointer"
            >
              {type}
            </span>
          ))}
        </div>

        {/* Seeds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {storySeeds.map((seed, i) => (
            <div
              key={seed.id}
              className="seed-card p-6 pl-7 rounded-xl bg-card-bg card-shadow opacity-0 animate-fade-in-up"
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
              <p className="text-sm text-ink-secondary leading-relaxed line-clamp-3">
                {seed.content}
              </p>
            </div>
          ))}
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
