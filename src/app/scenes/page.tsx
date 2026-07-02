import type { Metadata } from 'next';
import Link from 'next/link';
import { scenes } from '@/lib/data';

export const metadata: Metadata = {
  title: '场景库',
  description: '选择一个舞台，开始你的角色扮演对话。',
};

export default function ScenesPage() {
  return (
    <div className="theater-bg pt-14 min-h-screen">
      {/* Page Header */}
      <section className="px-4 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center opacity-0 animate-fade-in">
            <div className="text-[10px] tracking-[0.4em] text-ink-faint/40 mb-3">
              场 景 库
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white/90 tracking-wider mb-4">
              选择一个舞台
            </h1>
            <p className="text-sm text-ink-faint/50 max-w-md mx-auto leading-relaxed">
              每个场景都是一段关系的起点。挑选一个，抽取角色卡，然后开始对话。
            </p>
            <div className="w-10 h-px bg-line/20 mx-auto mt-6" />
          </div>
        </div>
      </section>

      {/* Scene Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenes.map((scene, i) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="group block rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-gold/20 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Scene visual header */}
                <div className="h-32 relative overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${scene.roles[0]?.color || '#3a6a9e'}22 0%, ${scene.roles[1]?.color || '#b8885a'}22 100%)`,
                    }}
                  />
                  {/* Location badge */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-black/20 text-white/50 backdrop-blur-sm tracking-wider">
                      {scene.location}
                    </span>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm tracking-wider ${
                        scene.status === 'completed'
                          ? 'bg-brand-gold/20 text-brand-gold/70'
                          : scene.status === 'in_progress'
                            ? 'bg-brand-blue/20 text-brand-blue/70'
                            : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {scene.status === 'completed'
                        ? '已完成'
                        : scene.status === 'in_progress'
                          ? '进行中'
                          : '等待开始'}
                    </span>
                  </div>
                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-4">
                    <h2 className="font-serif text-xl text-white/80 group-hover:text-brand-gold transition-colors duration-300">
                      {scene.title}
                    </h2>
                  </div>
                </div>

                {/* Scene content */}
                <div className="p-5">
                  <p className="text-xs text-ink-faint/50 leading-relaxed mb-4 line-clamp-2">
                    {scene.description}
                  </p>

                  {/* Roles */}
                  <div className="flex items-center gap-3 mb-4">
                    {scene.roles.map((role) => (
                      <div
                        key={role.name}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{
                            background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)`,
                          }}
                        >
                          {role.shortName}
                        </div>
                        <div>
                          <div className="text-[11px] text-white/60">
                            {role.name}
                          </div>
                          <div className="text-[9px] text-ink-ghost/30">
                            {role.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {scene.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-ink-ghost/40"
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
    </div>
  );
}
