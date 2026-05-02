'use client';

import { Bell, User, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title, showBack = false, onBack }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center px-4 py-3.5 border-b border-slate-700/30 bg-slate-900/80 backdrop-blur-xl z-10 shrink-0">
      {showBack ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleBack}
          className="p-2.5 -ml-1 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-200 mr-2"
          aria-label="返回"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      ) : null}

      {title ? (
        <h2 className="flex-1 text-center text-lg font-semibold text-slate-100 tracking-wide pr-10">
          {title}
        </h2>
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center shadow-lg shadow-xh-gold/20">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-wider text-slate-100">群像·星火</h1>
        </div>
      )}

      {!title && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-200"
            aria-label="通知"
          >
            <Bell size={18} />
          </button>
          <a
            href="/profile"
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-200"
            aria-label="个人中心"
          >
            <User size={18} />
          </a>
        </div>
      )}
    </div>
  );
}
