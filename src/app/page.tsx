/**
 * @file 首页 - 群像·星火
 * @description 展示平台介绍、精选故事、场景库入口
 * 采用极简布局，文案优先，留白多
 */

import Link from 'next/link';
import { scenes, stories, storySeeds } from '@/lib/data';

export default function HomePage() {
  const featuredStory = stories[0];
  const activeScenes = scenes.filter((s) => s.status === 'ready');
  const previewStories = stories.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f0f8ff]">
      {/* ===== Hero Section — 水彩主视觉 ===== */}
      <section className="relative px-5 pt-20 pb-16 sm:pt-28 sm:pb-24">
        {/* 背景水彩插画 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/hero-airport.jpeg"
            alt=""
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-auto opacity-15 blur-[2px]"
            fetchPriority="high"
          />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* 品牌标识 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4a9fd8]/5 border border-[#4a9fd8]/10 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4a9fd8] animate-pulse" />
            <span className="text-[11px] tracking-[3px] text-[#4a9fd8] font-medium">
              创作工坊
            </span>
          </div>

          {/* 主标语 */}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a2e4a] tracking-tight leading-[1.2] mb-6">
            每个人都是别人故事里的角色
            <br />
            <span className="text-[#4a9fd8]">把不敢说出口的话，交给一个角色</span>
          </h1>

          {/* 副标 */}
          <p className="text-base sm:text-lg text-[#4a6888] max-w-xl mx-auto leading-relaxed mb-10">
            选一个场景，领一个秘密，和另一个陌生人对戏 15 分钟。
            <br className="hidden sm:block" />
            你们说的话，会变成一篇故事。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/match"
              className="px-7 py-3 bg-gradient-to-r from-[#4A9FD8] to-[#7EC8E8] text-white text-sm font-medium tracking-wide rounded-xl shadow-lg shadow-[#4A9FD8]/25 hover:shadow-xl hover:shadow-[#4A9FD8]/35 hover:-translate-y-0.5 transition-all duration-300"
            >
              今晚，演一场久别重逢 →
            </Link>
            <Link
              href="/stories"
              className="px-6 py-3 border border-[#e0e8f0] text-[#4a6888] text-sm font-medium tracking-wide rounded-xl hover:border-[#4a9fd8]/40 hover:text-[#4a9fd8] hover:bg-[#4a9fd8]/5 transition-all duration-300"
            >
              先读一篇故事
            </Link>
          </div>

          {/* 精选故事引用 */}
          {featuredStory && (
            <div className="mt-16 p-6 rounded-2xl bg-white/60 border border-[#e0e8f0]/60">
              <p className="font-serif text-lg text-[#1a2e4a] italic mb-2">
                &ldquo;好久不见。你还记得我吗？&rdquo;
              </p>
              <p className="text-sm text-[#8a9db0]">
                — {featuredStory.title}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== 三步玩法说明 ===== */}
      <section className="px-5 py-12 bg-white/60">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1a2e4a] text-center mb-10">
            十五分钟，一篇故事
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#4a9fd8]/10 text-[#4a9fd8] text-lg font-medium flex items-center justify-center">
                01
              </div>
              <h3 className="font-serif text-base text-[#1a2e4a] mb-2">选一个场景</h3>
              <p className="text-sm text-[#4a6888] leading-relaxed">
                机场重逢、书店避雨、深夜天台……每个场景都是一段未完的故事。
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#4a9fd8]/10 text-[#4a9fd8] text-lg font-medium flex items-center justify-center">
                02
              </div>
              <h3 className="font-serif text-base text-[#1a2e4a] mb-2">领一个秘密</h3>
              <p className="text-sm text-[#4a6888] leading-relaxed">
                每个角色都有一条只有你知道的秘密提示——不对称信息，让对话天然有张力。
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#4a9fd8]/10 text-[#4a9fd8] text-lg font-medium flex items-center justify-center">
                03
              </div>
              <h3 className="font-serif text-base text-[#1a2e4a] mb-2">对戏成稿</h3>
              <p className="text-sm text-[#4a6888] leading-relaxed">
                和另一个陌生人对戏 15 分钟，对话自动整理成故事，金句沉淀为种子。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 故事集预览 ===== */}
      <section className="px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-[11px] tracking-[3px] text-[#4a9fd8] font-medium mb-2">故事集</div>
              <h2 className="font-serif text-2xl text-[#1a2e4a]">他们即兴创作的故事</h2>
            </div>
            <Link
              href="/stories"
              className="text-sm text-[#8a9db0] hover:text-[#4a9fd8] transition-colors flex items-center gap-1.5"
            >
              查看全部 →
            </Link>
          </div>

          <div className="space-y-4">
            {previewStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="block p-5 rounded-xl bg-white border border-[#e0e8f0]/60 hover:border-[#4a9fd8]/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-[#1a2e4a] mb-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[#4a6888] leading-relaxed line-clamp-2">
                      {story.excerpt || story.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {story.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#f0f8ff] text-[#4a9fd8]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 场景库预览 ===== */}
      <section className="px-5 py-16 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-[11px] tracking-[3px] text-[#4a9fd8] font-medium mb-2">场景库</div>
              <h2 className="font-serif text-2xl text-[#1a2e4a]">选择一个舞台</h2>
            </div>
            <Link
              href="/scenes"
              className="text-sm text-[#8a9db0] hover:text-[#4a9fd8] transition-colors flex items-center gap-1.5"
            >
              查看全部 →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeScenes.slice(0, 6).map((scene, index) => {
              // 场景插画映射
              const sceneImages: Record<string, string> = {
                'airport': '/scene-airport.jpeg',
                'bookstore': '/scene-bookstore.jpeg',
                'elevator': '/scene-elevator.jpeg',
                'rooftop': '/scene-rooftop.jpeg',
                'train': '/scene-train.jpeg',
                'hospital': '/scene-hospital.jpeg',
              };
              const imageSrc = sceneImages[scene.id] || `/scene-${index + 1}.jpeg`;

              return (
                <Link
                  key={scene.id}
                  href={`/scenes/${scene.id}`}
                  className="group relative overflow-hidden rounded-xl bg-white border border-[#e0e8f0]/60 hover:border-[#4a9fd8]/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* 水彩插画 */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={scene.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
                  </div>

                  {/* 内容 */}
                  <div className="relative p-5 -mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] text-[#8a9db0]">{scene.location}</span>
                    </div>
                    <h3 className="font-serif text-base text-[#1a2e4a] group-hover:text-[#4a9fd8] transition-colors mb-2">
                      {scene.title}
                    </h3>
                    <p className="text-sm text-[#4a6888] leading-relaxed line-clamp-2">
                      {scene.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 故事种子墙 ===== */}
      <section className="px-5 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-[11px] tracking-[3px] text-[#4a9fd8] font-medium mb-2">故事种子</div>
              <h2 className="font-serif text-2xl text-[#1a2e4a]">未开发的灵感</h2>
            </div>
            <Link
              href="/seeds"
              className="text-sm text-[#8a9db0] hover:text-[#4a9fd8] transition-colors flex items-center gap-1.5"
            >
              种子墙 →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storySeeds.slice(0, 4).map((seed) => (
              <div
                key={seed.id}
                className="p-5 rounded-xl bg-white border border-[#e0e8f0]/60"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      seed.type === '金句'
                        ? 'bg-[#c8a96e]/10 text-[#c8a96e]'
                        : seed.type === '秘密'
                          ? 'bg-[#4a9fd8]/10 text-[#4a9fd8]'
                          : 'bg-[#f0f8ff] text-[#4a6888]'
                    }`}
                  >
                    {seed.type}
                  </span>
                </div>
                <h3 className="font-serif text-sm text-[#1a2e4a] mb-2">
                  {seed.title}
                </h3>
                <p className="text-sm text-[#4a6888] leading-relaxed">
                  {seed.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 底部理念 ===== */}
      <section className="px-5 py-20 bg-white/60">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="font-serif text-xl sm:text-2xl text-[#4a6888] leading-relaxed italic">
            &ldquo;两个人在机场相遇，说了再见。
            <br />
            但也许，这才是故事的开始。&rdquo;
          </blockquote>
          <div className="w-8 h-0.5 bg-[#4a9fd8]/40 mx-auto mt-8 mb-4 rounded-full" />
          <p className="text-sm text-[#8a9db0] tracking-wide">
            给两个陌生人一个舞台，让不敢说出口的话被说出来
          </p>
        </div>
      </section>
    </div>
  );
}
