/**
 * @file 场景库页面
 * @description 展示所有可用的创作场景
 * 用户可以浏览场景列表，选择感兴趣的场景进行创作
 */

import Link from 'next/link';
import { scenes } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '场景库',
  description: '浏览所有可用的创作场景，选择一个舞台开始你的故事',
};

export default function ScenesPage() {
  const activeScenes = scenes.filter((s) => s.status === 'ready');

  return (
    <div className="site-bg px-5 py-14">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-14">
          <div className="section-label mb-3">场景库</div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wide mb-4">
            选择一个舞台
          </h1>
          <p className="text-base text-ink-secondary max-w-md mx-auto leading-relaxed">
            每个场景都是一个预设的&ldquo;舞台&rdquo;，降低每次创作的起手难度。
          </p>
          <div className="w-10 h-0.5 bg-brand-gold/40 mx-auto mt-8 rounded-full" />
        </div>

        {/* Scene Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {activeScenes.map((scene, i) => (
            <Link
              key={scene.id}
              href={`/scenes/${scene.id}`}
              className="scene-card group block p-7 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/20 card-shadow hover:card-shadow-hover transition-all duration-400 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Scene Meta */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] text-ink-muted tracking-wide">
                  {scene.location}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[11px] text-brand-blue/60">
                  {scene.roles.length} 个角色
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-xl text-ink group-hover:text-brand-blue transition-colors duration-300 mb-3">
                {scene.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-ink-secondary leading-relaxed mb-5">
                {scene.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {scene.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Roles Preview */}
              <div className="flex items-center gap-2 pt-4 border-t border-border/60">
                <span className="text-[10px] text-ink-muted">角色：</span>
                {scene.roles.map((role) => (
                  <span
                    key={role.name}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-brand-blue/5 text-brand-blue"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-ink-muted tracking-wider">
              更多场景即将开放
            </p>
            <p className="text-xs text-ink-muted/60 mt-2">
              你也可以在创作中自定义场景
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
