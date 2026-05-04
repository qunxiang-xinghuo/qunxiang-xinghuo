'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Compass, Flame, BookOpen, User } from 'lucide-react';

const navItems = [
  { key: 'home', label: '发现', icon: Compass, path: '/home' },
  { key: 'sparks', label: '火花', icon: Flame, path: '/library' },
  { key: 'story', label: '故事', icon: BookOpen, path: '/story-hall' },
  { key: 'profile', label: '我的', icon: User, path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  // 未登录状态下不显示底部导航栏
  if (status === 'unauthenticated') return null;

  // 隐藏底部导航的页面
  const hideNavPaths = ['/login', '/register', '/welcome', '/onboarding'];
  if (hideNavPaths.some((p) => pathname?.startsWith(p))) return null;
  // 房间、匹配等页面也隐藏
  if (pathname?.startsWith('/room/') || pathname?.startsWith('/duo') || pathname?.startsWith('/story/room/')) return null;

  const activeItem = navItems.find((item) => pathname === item.path || pathname?.startsWith(item.path + '/')) || navItems[0];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0c0c0e]/90 backdrop-blur-xl safe-area-pb">
      {/* v6.0-fix: 最外层容器添加 max-width + 居中，确保导航栏宽度适配移动端 */}
      <div className="max-w-[480px] mx-auto w-full flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = activeItem.key === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center w-16 h-full relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-[#e2b04a] rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 mb-0.5 transition-colors ${
                  isActive ? 'text-[#e2b04a]' : 'text-white/30'
                }`}
              />
              <span
                className={`text-[10px] transition-colors ${
                  isActive ? 'text-[#e2b04a] font-medium' : 'text-white/30'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
