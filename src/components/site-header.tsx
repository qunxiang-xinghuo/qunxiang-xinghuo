/**
 * @file site-header.tsx
 * @description 网站头部组件 - 导航栏和用户菜单
 * @module components/site-header
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/scenes', label: '场景库' },
  { href: '/stories', label: '故事集' },
  { href: '/workshop', label: 'AI 创作' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/60">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-base font-semibold text-ink tracking-wide">
                群像·星火
              </span>
              <span className="text-[10px] text-ink-muted tracking-wider hidden sm:inline">
                创作工坊
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link px-4 py-2 text-[13px] tracking-wide rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'text-brand-blue font-medium'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden sm:flex items-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-secondary hover:text-ink hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center">
                    <span className="text-xs font-medium text-brand-blue">
                      {session.user.email?.[0].toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-xs">{session.user.email}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-3 py-1.5 text-sm text-ink-muted hover:text-ink-secondary transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2.5 rounded-lg text-ink-secondary hover:bg-gray-50 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="sm:hidden pb-4 border-t border-border/40 mt-1 pt-3">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 text-sm tracking-wide rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-brand-blue bg-brand-blue/5 font-medium'
                      : 'text-ink-secondary hover:text-ink hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-3 pt-3 border-t border-border/40">
              {session?.user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ink-secondary hover:text-ink hover:bg-gray-50 rounded-lg"
                  >
                    用户中心
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-ink-muted hover:text-ink-secondary"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-brand-blue hover:bg-brand-blue/5 rounded-lg"
                >
                  登录
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
