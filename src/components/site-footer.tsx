/**
 * @file site-footer.tsx
 * @description 网站底部组件 - 显示版权信息和链接
 * @module components/site-footer
 */

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-white/40">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-serif text-sm text-ink-secondary tracking-wide">
              群像·星火
            </span>
          </div>
          <p className="text-xs text-ink-muted text-center sm:text-right">
            给两个陌生人一个舞台，让不敢说出口的话被说出来
          </p>
        </div>
      </div>
    </footer>
  );
}
