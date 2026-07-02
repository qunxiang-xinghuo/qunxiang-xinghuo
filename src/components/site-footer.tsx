import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-line/50 bg-bg-end/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <div className="font-serif text-sm tracking-wider text-ink-faint mb-2">
              群像 · <span className="text-blue-mid">星火</span>
            </div>
            <p className="text-xs text-ink-ghost leading-relaxed max-w-xs">
              给两个陌生人一个场景，让他们在对话中，把彼此变成故事里的角色。
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/scenes"
              className="text-xs text-ink-ghost hover:text-brand-blue transition-colors duration-300"
            >
              场景库
            </Link>
            <Link
              href="/stories"
              className="text-xs text-ink-ghost hover:text-brand-blue transition-colors duration-300"
            >
              故事集
            </Link>
            <Link
              href="/seeds"
              className="text-xs text-ink-ghost hover:text-brand-blue transition-colors duration-300"
            >
              故事种子
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-line/50 text-center">
          <p className="text-[10px] text-ink-ghost/60 tracking-wider">
            &copy; {new Date().getFullYear()} 群像·星火 — 创作工坊
          </p>
        </div>
      </div>
    </footer>
  );
}
