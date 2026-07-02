'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/scenes', label: '场景库' },
  { href: '/stories', label: '故事集' },
  { href: '/seeds', label: '故事种子' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-serif text-[13px] tracking-[2px] text-ink-faint group-hover:text-ink-light transition-colors duration-300">
              群像 ·{' '}
              <span className="text-blue-mid group-hover:text-brand-gold transition-colors duration-300">
                星火
              </span>
            </span>
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
                  className={`px-3 py-1.5 text-xs tracking-wider rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'text-blue-dark bg-card-inner font-medium'
                      : 'text-ink-faint hover:text-ink-light hover:bg-card-inner/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 text-ink-faint hover:text-ink-light transition-colors"
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
            >
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="sm:hidden pb-4 border-t border-line/50 mt-2 pt-3">
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
                  className={`block px-3 py-2 text-sm tracking-wider rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'text-blue-dark bg-card-inner'
                      : 'text-ink-faint hover:text-ink-light'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
