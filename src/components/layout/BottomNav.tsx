'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, MessageCircle, User, Globe } from 'lucide-react';

const navItems = [
  { path: '/', label: '发现', icon: Home },
  { path: '/library', label: '素材库', icon: BookOpen },
  { path: '/zhihu-ring', label: '知乎', icon: Globe },
  { path: '/messages', label: '消息', icon: MessageCircle },
  { path: '/profile', label: '我的', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="border-t border-gray-800 bg-xh-primary px-4 py-3 z-10">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 transition-colors"
            >
              <Icon
                size={20}
                className={isActive ? 'text-xh-gold' : 'text-gray-500 hover:text-gray-300'}
              />
              <span
                className={`text-xs ${isActive ? 'text-xh-gold font-medium' : 'text-gray-500 hover:text-gray-300'}`}
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
