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
          <div className="flex flex-col items-center sm:items-end gap-1">
            <p className="text-xs text-ink-muted">
              给两个陌生人一个舞台，让不敢说出口的话被说出来
            </p>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition">
                沪ICP备2026023751号
              </a>
              <span>|</span>
              <a href="https://www.beian.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue transition">
                沪公网安备 31011502023456号
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
