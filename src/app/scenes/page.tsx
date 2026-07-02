import Link from 'next/link';
import { scenes } from '@/lib/data';

export default function ScenesPage() {
  const activeScenes = scenes.filter((s) => s.status === 'ready');

  return (
    <div className="site-bg px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[4px] text-ink-ghost mb-3">
            场 景 库
          </div>
          <h1 className="font-serif text-3xl text-ink tracking-wider mb-4">
            选择一个舞台
          </h1>
          <p className="text-sm text-ink-faint max-w-md mx-auto leading-relaxed">
            每个场景都是一个预设的&ldquo;舞台&rdquo;，降低每次创作的起手难度。
          </p>
          <div className="w-10 h-px bg-line mx-auto mt-6" />
        </div>

        {/* Scene Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {activeScenes.map((scene, i) => (
            <Link
              key={scene.id}
              href={`/scenes/${scene.id}`}
              className="group block p-6 rounded-2xl bg-card-bg border border-line-light hover:border-blue-soft/40 card-shadow hover:card-shadow-hover transition-all duration-500 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Scene Meta */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-ink-ghost tracking-wider">
                  {scene.location}
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-soft/50" />
                <span className="text-[10px] text-blue-mid/60">
                  {scene.roles.length} 个角色
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-xl text-ink group-hover:text-brand-blue transition-colors duration-300 mb-3">
                {scene.title}
              </h2>

              {/* Description */}
              <p className="text-xs text-ink-faint leading-relaxed mb-4">
                {scene.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {scene.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Roles Preview */}
              <div className="flex items-center gap-2 pt-3 border-t border-line-light">
                <span className="text-[9px] text-ink-ghost">角色：</span>
                {scene.roles.map((role) => (
                  <span
                    key={role.name}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-card-inner text-ink-light"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <div className="inline-block p-6 rounded-2xl border border-dashed border-line">
            <p className="text-xs text-ink-ghost tracking-wider">
              更多场景即将开放
            </p>
            <p className="text-[10px] text-ink-ghost/60 mt-2">
              你也可以在创作中自定义场景
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
