import Link from 'next/link';
import { stories } from '@/lib/data';

export default function StoriesPage() {
  const finishedStories = stories.filter((s) => s.status === 'finished');
  const draftStories = stories.filter((s) => s.status === 'draft');

  return (
    <div className="site-bg px-5 py-14">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-14">
          <div className="section-label mb-3">故事集</div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink tracking-wide mb-4">
            心理剧记录
          </h1>
          <p className="text-base text-ink-secondary max-w-md mx-auto leading-relaxed">
            每一段对话都是一次真实的心理剧。
            <br />
            记录那些不敢说出口的话，在角色扮演中被说出来的瞬间。
          </p>
          <div className="w-10 h-0.5 bg-brand-gold/40 mx-auto mt-8 rounded-full" />
        </div>

        {/* Finished Stories */}
        {finishedStories.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-ink-muted tracking-[4px]">
                精选故事
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {finishedStories.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="story-card group block p-7 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-gold/30 card-shadow hover:card-shadow-hover transition-all duration-400 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="text-center">
                    <div className="text-[11px] text-ink-muted tracking-[3px] mb-3">
                      {story.subtitle}
                    </div>
                    <h2 className="font-serif text-xl text-ink group-hover:text-brand-blue transition-colors duration-300 mb-4">
                      {story.title}
                    </h2>
                    <p className="text-sm text-ink-secondary leading-relaxed mb-5">
                      {story.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                      {story.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-center gap-6 py-4 border-t border-border/60">
                      {story.sparks.map((spark) => (
                        <div key={spark.label} className="text-center">
                          <div className="text-[10px] text-ink-muted mb-0.5">
                            {spark.label}
                          </div>
                          <div className="text-sm text-ink-secondary font-semibold">
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
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-ink-muted tracking-[4px]">
                心理剧记录
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-4">
              {draftStories.map((story, i) => (
                <Link
                  key={story.id}
                  href={`/stories/${story.id}`}
                  className="group block p-6 rounded-2xl bg-card-bg border border-border/60 hover:border-brand-blue/20 card-shadow hover:card-shadow-hover transition-all duration-400 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted">
                          草稿
                        </span>
                        <span className="text-[10px] text-ink-muted/60">
                          {story.createdAt}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg text-ink group-hover:text-brand-blue transition-colors duration-300 mb-2">
                        {story.title}
                      </h3>
                      <p className="text-sm text-ink-secondary leading-relaxed line-clamp-2">
                        {story.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 text-ink-muted"
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
        <div className="mt-16 text-center">
          <div className="inline-block p-8 rounded-2xl border border-dashed border-border">
            <p className="text-sm text-ink-muted tracking-wider">
              更多故事即将记录
            </p>
            <p className="text-xs text-ink-muted/60 mt-2">
              每次角色扮演都是一段新的故事
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
