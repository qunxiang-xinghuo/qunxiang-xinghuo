'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, BookOpen, ScrollText, User } from 'lucide-react';

const navItems = [
  { path: '/home', label: '发现', icon: Compass },
  { path: '/library', label: '素材库', icon: BookOpen },
  { path: '/story-hall', label: '故事', icon: ScrollText },
  { path: '/profile', label: '我的', icon: User },
];

const HIDDEN_PATHS = ['/', '/register'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="border-t border-slate-700/30 bg-slate-900/95 backdrop-blur-xl px-2 z-50 shrink-0 safe-area-pb">
      <div className="flex items-center justify-around py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.88 }}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center gap-1 transition-colors min-h-12 min-w-14 py-1.5 px-3 relative"
            >
              <motion.div
                animate={isActive ? { y: [0, -3, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-xh-gold/15 text-xh-gold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </motion.div>
              <span
                className={`text-xs transition-colors duration-200 ${
                  isActive ? 'text-xh-gold font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-0.5 w-5 h-0.5 rounded-full bg-xh-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
