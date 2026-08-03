/**
 * @file 首页 - 群像·星火
 * @description 展示平台介绍、精选故事、场景库入口
 * 这是用户访问平台的第一个页面，需要营造剧场感和创作氛围
 * 首屏以水彩风格IP视觉为主视觉，配合渐进式揭示
 */

import Link from 'next/link';
import Image from 'next/image';
import { scenes, stories, storySeeds } from '@/lib/data';
import { FeaturedStory } from '@/components/featured-story';


export default function HomePage() {
  const featuredStory = stories[0];
  const activeScenes = scenes.filter((s) => s.status === 'ready');
  /* 取前4篇故事用于首页展示 */
  const previewStories = stories.slice(0, 4);

  return (
    <div className="site-bg relative">
      {/* ===== Hero Section — 水彩视觉主屏 ===== */}
      <section className="relative overflow-hidden">
        {/* 背景水彩图 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-airport.jpeg"
            alt=""
            fill
            priority
            className="object-cover opacity-30 blur-[1px]"
            sizes="100vw"
          />
          {/* 渐变遮罩：上浅下深，保证文字可读性 */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0f8ff]/80 via-[#f0f8ff]/60 to-[#f0f8ff]/95" />
        </div>

        <div className="relative z-10 px-5 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* 左侧文案 */}
              <div className="opacity-0 animate-fade-in">
                {/* Brand mark */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/5 border border-brand-gold/10 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-gold-pulse" />
                  <span className="text-[11px] tracking-[3px] text-brand-gold font-medium">
                    创作工坊
                  </span>
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight leading-[1.2] mb-5">
                  每个人都是
                  <br />
                  <span className="text-gold-shimmer">别人故事里的角色</span>
                </h1>
                <p className="text-base text-ink-secondary max-w-md leading-relaxed mb-8">
                  给两个陌生人一个场景，让他们在对话中，
                  <br className="hidden sm:block" />
                  把不敢说出口的话，变成故事。
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 opacity-0 animate-fade-in-up delay-300">
                  <Link
                    href="/room/create"
                    className="group px-7 py-3 bg-gradient-to-r from-[#4A9FD8] to-[#7EC8E8] text-white text-sm font-medium tracking-wide rounded-xl transition-all duration-300 shadow-lg shadow-[#4A9FD8]/25 hover:shadow-xl hover:shadow-[#4A9FD8]/35 hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    开始双人创作
                  </Link>
                  <Link
                    href="/scenes"
                    className="px-6 py-3 border border-border text-ink-secondary text-sm font-medium tracking-wide rounded-xl hover:border-brand-blue/40 hover:text-brand-blue hover:bg-brand-blue/5 transition-all duration-300"
                  >
                    场景库
                  </Link>
                  <Link
                    href="/stories"
                    className="px-6 py-3 border border-border text-ink-secondary text-sm font-medium tracking-wide rounded-xl hover:border-brand-gold/40 hover:text-brand-gold hover:bg-brand-gold/5 transition-all duration-300"
                  >
                    阅读故事
                  </Link>
                </div>
              </div>

              {/* 右侧主视觉 — 水彩场景图 */}
              <div className="relative opacity-0 animate-fade-in delay-200 hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden card-shadow aspect-[4/3]">
                  <Image
                    src="/hero-airport.jpeg"
                    alt="机场重逢 — 水彩风格主视觉"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 0px, 50vw"
                  />
                  {/* 底部渐变 + 标题 */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent p-6 pt-16">
                    <p className="text-white/90 font-serif text-lg tracking-wide">
                      &ldquo;好久不见。你还记得我吗？&rdquo;
                    </p>
                    <p className="text-white/60 text-xs mt-1.5 tracking-wider">
                      机场 · 十年 · 重逢
                    </p>
                  </div>
                </div>
                {/* 浮动装饰 */}
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-brand-gold/10 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-brand-blue/10 blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 参与创作 — 互动入口 ===== */}
      <section className="px-5 py-16 bg-white/40">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* 卡片1：单人扮演 */}
            <Link
              href="/scenes"
              className="group p-6 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/30 card-shadow hover:card-shadow-hover transition-all duration-400 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-blue/8 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a9fd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-ink mb-1.5 group-hover:text-brand-blue transition-colors">
                选一个场景
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                机场重逢、书店避雨、深夜天台……每个场景都是一段未完的故事
              </p>
            </Link>

            {/* 卡片2：双人创作 */}
            <Link
              href="/room/create"
              className="group p-6 rounded-2xl bg-card-bg border border-brand-blue/20 hover:border-brand-blue/40 card-shadow hover:card-shadow-hover transition-all duration-400 text-center relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue text-[10px] font-medium">
                推荐
              </div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-blue/8 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a9fd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-ink mb-1.5 group-hover:text-brand-blue transition-colors">
                双人即兴创作
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                邀请朋友或陌生人，各扮演一个角色，在对话中即兴创作故事
              </p>
            </Link>

            {/* 卡片3：阅读故事 */}
            <Link
              href="/stories"
              className="group p-6 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-gold/30 card-shadow hover:card-shadow-hover transition-all duration-400 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-gold/8 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3 className="font-serif text-base text-ink mb-1.5 group-hover:text-brand-gold transition-colors">
                阅读别人的故事
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                每篇故事都是两个陌生人即兴创作的，有金句、有反转、有余韵
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 故事集 — 多故事展示 ===== */}
      <section className="px-5 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="section-label mb-2">故事集</div>
              <h2 className="font-serif text-2xl text-ink tracking-wide">
                他们即兴创作的故事
              </h2>
            </div>
            <Link
              href="/stories"
              className="text-sm text-ink-muted hover:text-brand-blue transition-colors duration-300 tracking-wide flex items-center gap-1.5"
            >
              查看全部
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {previewStories.map((story, i) => {
              /* 故事对应的水彩场景图映射 */
              const sceneImages: Record<string, string> = {
                'haojiubujian': '/hero-airport.jpeg',
                'bookstore-rain-story': '/scene-bookstore.jpeg',
                'elevator-stuck-story': '/scene-elevator.jpeg',
                'midnight-taxi-story': '/scene-taxi.jpeg',
                'rooftop-story': '/scene-rooftop.jpeg',
              };
              const img = sceneImages[story.id] || '/hero-airport.jpeg';

              return (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/20 card-shadow hover:card-shadow-hover transition-all duration-400 overflow-hidden opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* 水彩场景图 */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={img}
                      alt={story.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-serif text-lg text-white tracking-wide">
                        {story.title}
                      </h3>
                      <p className="text-white/70 text-xs mt-0.5">
                        {story.subtitle}
                      </p>
                    </div>
                  </div>
                  {/* 故事摘要 */}
                  <div className="p-5">
                    <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2 mb-3">
                      {story.excerpt || story.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {story.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-gray-50 text-ink-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-ink-muted/60">
                        {story.createdAt}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 精选故事详情 ===== */}
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

      {/* ===== 场景库预览 ===== */}
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
            {activeScenes.slice(0, 6).map((scene, i) => {
              /* 场景对应的水彩图映射 */
              const sceneImgMap: Record<string, string> = {
                'airport-reunion': '/hero-airport.jpeg',
                'cafe-strangers': '/scene-bookstore.jpeg',
                'train-goodbye': '/scene-rooftop.jpeg',
                'rooftop-midnight': '/scene-rooftop.jpeg',
                'hospital-waiting': '/scene-hospital.jpeg',
                'bookstore-rain': '/scene-bookstore.jpeg',
                'elevator-stuck': '/scene-elevator.jpeg',
              };
              const sceneImg = sceneImgMap[scene.id];

              return (
                <Link
                  key={scene.id}
                  href={`/scenes/${scene.id}`}
                  className="scene-card group block rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/20 card-shadow hover:card-shadow-hover transition-all duration-400 overflow-hidden opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* 场景缩略图 */}
                  {sceneImg && (
                    <div className="relative h-28 overflow-hidden">
                      <Image
                        src={sceneImg}
                        alt={scene.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
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
                    <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2 mb-3">
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
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 故事种子预览 ===== */}
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

      {/* ===== 创作理念 ===== */}
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
