'use client';

import { Bell, User } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title, showBack = false, onBack }: TopBarProps) {
  return (
    <div className="flex items-center px-4 py-4 border-b border-gray-800 bg-xh-dark/80 backdrop-blur-md z-10">
      {showBack ? (
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors mr-3"
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
          <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <Bell size={18} />
          </button>
          <Link href="/profile">
            <button className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <User size={18} />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
