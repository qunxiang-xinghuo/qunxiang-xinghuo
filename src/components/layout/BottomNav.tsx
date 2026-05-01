'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Compass, BookOpen, ScrollText, User } from 'lucide-react';

const navItems = [
  { path: '/home', label: '发现', icon: Compass },
  { path: '/library', label: '素材库', icon: BookOpen },
  { path: '/story', label: '故事', icon: ScrollText },
  { path: '/profile', label: '我的', icon: User },
];

const HIDDEN_PATHS = ['/', '/register'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // 登录页和注册页不显示底部导航
  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="border-t border-white/5 bg-[#1a1a2e]/95 backdrop-blur-md px-4 py-2 z-50 shrink-0">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-0.5 transition-colors py-1 px-3"
            >
              <Icon
                size={20}
                className={isActive ? 'text-xh-gold' : 'text-white/30 hover:text-white/50'}
              />
              <span
                className={`text-[10px] ${isActive ? 'text-xh-gold font-medium' : 'text-white/30 hover:text-white/50'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
