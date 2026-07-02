import Link from 'next/link';
import { scenes, stories, storySeeds } from '@/lib/data';
import { FeaturedStory } from '@/components/featured-story';

export default function HomePage() {
  const featuredStory = stories[0];
  const activeScenes = scenes.filter((s) => s.status === 'ready');

  return (
    <div className="site-bg">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="opacity-0 animate-fade-in">
            <div className="text-[11px] tracking-[4px] text-ink-faint mb-6">
              群 像 · 星 火 · 创 作 工 坊
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-black text-ink tracking-[0.08em] leading-tight mb-4">
              每个人都是
              <br />
              <span className="text-gold-shimmer">别人故事里的角色</span>
            </h1>
            <p className="text-sm text-ink-light max-w-sm mx-auto leading-relaxed mt-6">
              给两个陌生人一个场景，让他们在对话中，把不敢说出口的话，变成故事。
            </p>
            <div className="w-10 h-px bg-line mx-auto mt-8" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 opacity-0 animate-fade-in-up delay-300">
            <Link
              href="/scenes"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-mid to-blue-deep text-white text-sm tracking-widest rounded-2xl transition-all duration-500 shadow-[0_4px_20px_rgba(46,100,160,0.22)] hover:shadow-[0_8px_32px_rgba(46,100,160,0.35)] hover:-translate-y-0.5"
            >
              进入场景库
            </Link>
            <Link
              href="/stories"
              className="px-8 py-3.5 border border-line text-ink-light text-sm tracking-widest rounded-2xl hover:border-brand-gold/40 hover:text-brand-gold transition-all duration-500"
            >
              阅读故事
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 opacity-0 animate-fade-in">
              <div className="text-[10px] tracking-[4px] text-ink-ghost mb-3">
                精 选 故 事
              </div>
              <h2 className="font-serif text-2xl text-ink tracking-wider">
                好久不见
              </h2>
              <div className="w-10 h-px bg-line mx-auto mt-4" />
            </div>
            <FeaturedStory story={featuredStory} />
          </div>
        </section>
      )}

      {/* Scene Preview */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] tracking-[4px] text-ink-ghost mb-2">
                场 景 库
              </div>
              <h2 className="font-serif text-xl text-ink tracking-wider">
                选择一个舞台
              </h2>
            </div>
            <Link
              href="/scenes"
              className="text-xs text-ink-faint hover:text-brand-blue transition-colors duration-300 tracking-wider"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeScenes.map((scene, i) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="group block p-5 rounded-2xl bg-card-bg border border-line-light hover:border-blue-soft/40 card-shadow hover:card-shadow-hover transition-all duration-500 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-ink-ghost tracking-wider">
                    {scene.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-blue-soft/50" />
                  <span className="text-[10px] text-blue-mid/60">
                    {scene.roles.length} 个角色
                  </span>
                </div>
                <h3 className="font-serif text-lg text-ink group-hover:text-brand-blue transition-colors duration-300 mb-2">
                  {scene.title}
                </h3>
                <p className="text-xs text-ink-faint leading-relaxed line-clamp-2">
                  {scene.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost"
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

      {/* Story Seeds Preview */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] tracking-[4px] text-ink-ghost mb-2">
                故 事 种 子
              </div>
              <h2 className="font-serif text-xl text-ink tracking-wider">
                未开发的灵感
              </h2>
            </div>
            <Link
              href="/seeds"
              className="text-xs text-ink-faint hover:text-brand-blue transition-colors duration-300 tracking-wider"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storySeeds.slice(0, 4).map((seed, i) => (
              <div
                key={seed.id}
                className="p-5 rounded-2xl bg-card-bg border border-line-light card-shadow opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
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
                <p className="text-xs text-ink-faint leading-relaxed line-clamp-3">
                  {seed.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-[10px] tracking-[4px] text-ink-ghost mb-6">
            创 作 理 念
          </div>
          <blockquote className="font-serif text-lg sm:text-xl text-ink-light leading-relaxed italic">
            &ldquo;两个人在机场相遇，说了再见。
            <br />
            但也许，这才是故事的开始。&rdquo;
          </blockquote>
          <div className="w-10 h-px bg-brand-gold/30 mx-auto mt-8 mb-4" />
          <p className="text-xs text-ink-ghost tracking-wider">
            不敢说出口的话，在角色扮演中被说出来
          </p>
        </div>
      </section>
    </div>
  );
}
