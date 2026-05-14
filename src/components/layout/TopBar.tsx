'use client';

import { Bell, ChevronLeft } from 'lucide-react';
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
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="flex items-center px-4 py-3.5 border-b border-slate-700/30 bg-slate-900/80 backdrop-blur-xl z-10 shrink-0">
      {/* 左侧：返回按钮或占位 */}
      <div className="w-10 flex-shrink-0">
        {showBack ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="p-2 -ml-1 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-200"
            aria-label="返回"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        ) : null}
      </div>

      {/* 中间：标题（绝对居中）*/}
      {title ? (
        <h2 className="flex-1 text-center text-lg font-semibold text-slate-100 tracking-wide">
          {title}
        </h2>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-xh-gold to-xh-gold-dark flex items-center justify-center shadow-lg shadow-xh-gold/20">
            <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-wider text-slate-100">群像·星火</h1>
        </div>
      )}

      {/* 右侧：与左侧等宽的占位或按钮 */}
      {!title ? (
        <div className="w-10 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all duration-200"
            aria-label="通知"
          >
            <Bell size={18} />
          </button>
        </div>
      ) : (
        <div className="w-10 flex-shrink-0" />
      )}
    </div>
  );
}
