import Link from 'next/link';
import { scenes, stories, storySeeds } from '@/lib/data';
import { FeaturedStory } from '@/components/featured-story';

export default function HomePage() {
  const featuredStory = stories[0];
  const activeScenes = scenes.filter((s) => s.status === 'ready');

  return (
    <div className="site-bg">
      {/* Hero Section */}
      <section className="relative px-5 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="opacity-0 animate-fade-in">
            {/* Brand mark */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/10 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-gold-pulse" />
              <span className="text-[11px] tracking-[3px] text-brand-gold font-medium">
                创作工坊
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight leading-[1.15] mb-6">
              每个人都是
              <br />
              <span className="text-gold-shimmer">别人故事里的角色</span>
            </h1>
            <p className="text-base text-ink-secondary max-w-lg mx-auto leading-relaxed">
              给两个陌生人一个场景，让他们在对话中，
              <br className="hidden sm:block" />
              把不敢说出口的话，变成故事。
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 opacity-0 animate-fade-in-up delay-300">
            <Link
              href="/scenes"
              className="group px-8 py-3.5 bg-gradient-to-r from-brand-blue to-brand-blue-light text-white text-sm font-medium tracking-wide rounded-xl transition-all duration-300 shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-0.5 flex items-center gap-2"
            >
              进入场景库
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/stories"
              className="px-8 py-3.5 border border-border text-ink-secondary text-sm font-medium tracking-wide rounded-xl hover:border-brand-gold/40 hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300"
            >
              阅读故事
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="px-5 py-20 bg-white/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 opacity-0 animate-fade-in">
              <div className="section-label mb-3">
                精选故事
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink tracking-wide gold-accent">
                {featuredStory.title}
              </h2>
            </div>
            <FeaturedStory story={featuredStory} />
            <div className="text-center mt-8">
              <Link
                href={`/stories/${featuredStory.id}`}
                className="inline-flex items-center gap-2 text-sm text-brand-blue hover:text-brand-blue-light transition-colors duration-300 tracking-wide"
              >
                阅读完整故事
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Scene Preview */}
      <section className="px-5 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="section-label mb-2">场景库</div>
              <h2 className="font-serif text-2xl text-ink tracking-wide">
                选择一个舞台
              </h2>
            </div>
            <Link
              href="/scenes"
              className="text-sm text-ink-muted hover:text-brand-blue transition-colors duration-300 tracking-wide flex items-center gap-1.5"
            >
              查看全部
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeScenes.map((scene, i) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="scene-card group block p-6 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/20 card-shadow hover:card-shadow-hover transition-all duration-400 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] text-ink-muted tracking-wide">
                    {scene.location}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[11px] text-brand-blue/60">
                    {scene.roles.length} 角色
                  </span>
                </div>
                <h3 className="font-serif text-lg text-ink group-hover:text-brand-blue transition-colors duration-300 mb-2">
                  {scene.title}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2 mb-4">
                  {scene.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {scene.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted"
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
      <section className="px-5 py-20 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="section-label mb-2">故事种子</div>
              <h2 className="font-serif text-2xl text-ink tracking-wide">
                未开发的灵感
              </h2>
            </div>
            <Link
              href="/seeds"
              className="text-sm text-ink-muted hover:text-brand-blue transition-colors duration-300 tracking-wide flex items-center gap-1.5"
            >
              查看全部
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storySeeds.slice(0, 4).map((seed, i) => (
              <div
                key={seed.id}
                className="seed-card p-5 pl-6 rounded-xl bg-card-bg card-shadow opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      seed.type === '金句'
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : seed.type === '秘密'
                          ? 'bg-brand-blue/10 text-brand-blue'
                          : 'bg-gray-50 text-ink-muted'
                    }`}
                  >
                    {seed.type}
                  </span>
                  <span className="text-[10px] text-ink-muted/60">
                    {seed.createdAt}
                  </span>
                </div>
                <h3 className="font-serif text-sm text-ink mb-2">
                  {seed.title}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2">
                  {seed.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-5 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="section-label mb-6">创作理念</div>
          <blockquote className="font-serif text-xl sm:text-2xl text-ink-secondary leading-relaxed italic">
            &ldquo;两个人在机场相遇，说了再见。
            <br />
            但也许，这才是故事的开始。&rdquo;
          </blockquote>
          <div className="w-8 h-0.5 bg-brand-gold/40 mx-auto mt-8 mb-4 rounded-full" />
          <p className="text-sm text-ink-muted tracking-wide">
            不敢说出口的话，在角色扮演中被说出来
          </p>
        </div>
      </section>
    </div>
  );
}
