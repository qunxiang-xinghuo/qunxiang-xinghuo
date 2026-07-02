import Link from 'next/link';
import { stories } from '@/lib/data';

export default function StoriesPage() {
  const finishedStories = stories.filter((s) => s.status === 'finished');
  const draftStories = stories.filter((s) => s.status === 'draft');

  return (
    <div className="site-bg px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[4px] text-ink-ghost mb-3">
            故 事 集
          </div>
          <h1 className="font-serif text-3xl text-ink tracking-wider mb-4">
            心理剧记录
          </h1>
          <p className="text-sm text-ink-faint max-w-md mx-auto leading-relaxed">
            每一段对话都是一次真实的心理剧。
            <br />
            记录那些不敢说出口的话，在角色扮演中被说出来的瞬间。
          </p>
          <div className="w-10 h-px bg-line mx-auto mt-6" />
        </div>

        {/* Finished Stories */}
        {finishedStories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[10px] text-ink-ghost tracking-wider">
                精 选 故 事
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {finishedStories.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block p-6 rounded-2xl bg-card-bg border border-line-light hover:border-brand-gold/30 card-shadow hover:card-shadow-hover transition-all duration-500 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-center">
                    <div className="text-[10px] text-ink-ghost tracking-[3px] mb-3">
                      {story.subtitle}
                    </div>
                    <h2 className="font-serif text-xl text-ink group-hover:text-brand-blue transition-colors duration-300 mb-3">
                      {story.title}
                    </h2>
                    <p className="text-xs text-ink-faint leading-relaxed mb-4">
                      {story.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-center gap-4 py-3 border-t border-line-light">
                      {story.sparks.map((spark) => (
                        <div key={spark.label} className="text-center">
                          <div className="text-[9px] text-ink-ghost">
                            {spark.label}
                          </div>
                          <div className="text-xs text-ink-light font-semibold">
                            x{spark.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Draft Stories */}
        {draftStories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[10px] text-ink-ghost tracking-wider">
                心 理 剧 记 录
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <div className="space-y-4">
              {draftStories.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block p-5 rounded-2xl bg-card-bg border border-line-light hover:border-blue-soft/40 card-shadow hover:card-shadow-hover transition-all duration-500 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost">
                          草稿
                        </span>
                        <span className="text-[9px] text-ink-ghost/50">
                          {story.createdAt}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg text-ink group-hover:text-brand-blue transition-colors duration-300 mb-2">
                        {story.title}
                      </h3>
                      <p className="text-xs text-ink-faint leading-relaxed line-clamp-2">
                        {story.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-card-inner text-ink-ghost"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <div className="inline-block p-6 rounded-2xl border border-dashed border-line">
            <p className="text-xs text-ink-ghost tracking-wider">
              更多故事即将记录
            </p>
            <p className="text-[10px] text-ink-ghost/60 mt-2">
              每次角色扮演都是一段新的故事
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
