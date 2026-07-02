import Link from 'next/link';
import { scenes, stories, storySeeds } from '@/lib/data';
import { FeaturedStory } from '@/components/featured-story';

export default function HomePage() {
  const featuredStory = stories[0];
  const activeScenes = scenes.filter((s) => s.status === 'ready');

  return (
    <div className="theater-bg pt-14">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Ambient particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-1 h-1 rounded-full bg-brand-gold/20 animate-float"
            style={{ top: '20%', left: '15%', animationDelay: '0s' }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-brand-blue/20 animate-float"
            style={{ top: '40%', left: '75%', animationDelay: '1s' }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-brand-gold/15 animate-float"
            style={{ top: '65%', left: '25%', animationDelay: '2s' }}
          />
          <div
            className="absolute w-0.5 h-0.5 rounded-full bg-white/10 animate-float"
            style={{ top: '30%', left: '55%', animationDelay: '0.5s' }}
          />
          <div
            className="absolute w-1 h-1 rounded-full bg-brand-blue/15 animate-float"
            style={{ top: '75%', left: '80%', animationDelay: '1.5s' }}
          />
        </div>

        {/* Title */}
        <div className="text-center relative z-10 opacity-0 animate-fade-in">
          <div className="text-[10px] tracking-[0.4em] text-ink-faint/50 mb-6 uppercase">
            群 像 · 星 火 · 创 作 工 坊
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-[0.15em] leading-tight mb-4">
            每个人都是
            <br />
            <span className="text-gold-shimmer">别人故事里的角色</span>
          </h1>
          <p className="text-sm text-ink-faint/70 max-w-md mx-auto leading-relaxed mt-6">
            给两个陌生人一个场景，让他们在对话中，
            <br className="hidden sm:block" />
            把不敢说出口的话，变成故事。
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 opacity-0 animate-fade-in-up delay-300">
          <Link
            href="/scenes"
            className="group relative px-8 py-3.5 bg-gradient-to-r from-brand-blue/90 to-brand-blue text-white text-sm tracking-widest rounded-xl overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-brand-blue/20 hover:-translate-y-0.5"
          >
            <span className="relative z-10">进入场景库</span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Link>
          <Link
            href="/stories"
            className="px-8 py-3.5 border border-white/10 text-ink-faint text-sm tracking-widest rounded-xl hover:border-brand-gold/30 hover:text-brand-gold transition-all duration-500"
          >
            阅读故事
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in delay-700">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-ink-ghost/30 to-transparent mx-auto mb-2" />
          <div className="text-[9px] text-ink-ghost/30 tracking-widest">
            向下滚动
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 opacity-0 animate-fade-in">
              <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-3">
                精 选 故 事
              </div>
              <h2 className="font-serif text-2xl text-white/90 tracking-wider">
                好久不见
              </h2>
              <div className="w-10 h-px bg-line/20 mx-auto mt-4" />
            </div>
            <FeaturedStory story={featuredStory} />
          </div>
        </section>
      )}

      {/* Scene Preview */}
      <section className="px-4 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-2">
                场 景 库
              </div>
              <h2 className="font-serif text-xl text-white/90 tracking-wider">
                选择一个舞台
              </h2>
            </div>
            <Link
              href="/scenes"
              className="text-xs text-ink-faint/60 hover:text-brand-gold transition-colors duration-300 tracking-wider"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeScenes.map((scene, i) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="group block p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-gold/20 hover:bg-white/[0.05] transition-all duration-500 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-ink-ghost/50 tracking-wider">
                    {scene.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-brand-blue/40" />
                  <span className="text-[10px] text-brand-blue/60">
                    {scene.roles.length} 个角色
                  </span>
                </div>
                <h3 className="font-serif text-lg text-white/80 group-hover:text-brand-gold transition-colors duration-300 mb-2">
                  {scene.title}
                </h3>
                <p className="text-xs text-ink-faint/50 leading-relaxed line-clamp-2">
                  {scene.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-ink-ghost/50"
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
      <section className="px-4 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-2">
                故 事 种 子
              </div>
              <h2 className="font-serif text-xl text-white/90 tracking-wider">
                未开发的灵感
              </h2>
            </div>
            <Link
              href="/seeds"
              className="text-xs text-ink-faint/60 hover:text-brand-gold transition-colors duration-300 tracking-wider"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storySeeds.slice(0, 4).map((seed, i) => (
              <div
                key={seed.id}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full ${
                      seed.type === '金句'
                        ? 'bg-brand-gold/10 text-brand-gold/70'
                        : seed.type === '秘密'
                          ? 'bg-brand-blue/10 text-brand-blue/70'
                          : 'bg-white/5 text-ink-ghost/50'
                    }`}
                  >
                    {seed.type}
                  </span>
                  <span className="text-[9px] text-ink-ghost/30">
                    {seed.createdAt}
                  </span>
                </div>
                <h3 className="font-serif text-sm text-white/70 mb-2">
                  {seed.title}
                </h3>
                <p className="text-xs text-ink-faint/40 leading-relaxed line-clamp-3">
                  {seed.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-4 py-24 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-6">
            创 作 理 念
          </div>
          <blockquote className="font-serif text-lg sm:text-xl text-white/60 leading-relaxed italic">
            &ldquo;两个人在机场相遇，说了再见。
            <br />
            但也许，这才是故事的开始。&rdquo;
          </blockquote>
          <div className="w-10 h-px bg-brand-gold/20 mx-auto mt-8 mb-4" />
          <p className="text-xs text-ink-ghost/40 tracking-wider">
            不敢说出口的话，在角色扮演中被说出来
          </p>
        </div>
      </section>
    </div>
  );
}
