'use client';

import { Bell, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    <div className="flex items-center px-4 py-4 border-b border-gray-800 bg-xh-dark/80 backdrop-blur-md z-10">
      {showBack ? (
        <button
          onClick={handleBack}
          className="p-3 -ml-1 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors mr-2"
          aria-label="返回"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      ) : null}

      {title ? (
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">{title}</h2>
      ) : (
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-xh-gold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
          </svg>
          <h1 className="text-xl font-bold tracking-wider text-white">群像·星火</h1>
        </div>
      )}

      {!title && (
        <div className="flex items-center gap-3 ml-auto">
          <button className="p-3 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors" aria-label="通知">
            <Bell size={18} />
          </button>
          <a href="/profile" className="p-3 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors" aria-label="个人中心">
            <User size={18} />
          </a>
        </div>
      )}
    </div>
  );
}
