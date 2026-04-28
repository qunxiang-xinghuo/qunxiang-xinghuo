'use client';

import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

export interface Brainhole {
  id: string;
  title: string;
  content: string;
  source: string;
  tags?: string[];
}

interface BrainholeCardProps {
  brainhole: Brainhole;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isActive?: boolean;
}

export default function BrainholeCard({
  brainhole,
  onSwipeLeft,
  onSwipeRight,
  isActive = true,
}: BrainholeCardProps) {
  const handlers = useSwipeable({
    onSwipedLeft: () => isActive && onSwipeLeft?.(),
    onSwipedRight: () => isActive && onSwipeRight?.(),
    trackTouch: true,
    trackMouse: true,
    delta: 80,
  });

  return (
    <motion.div
      {...handlers}
      className="absolute inset-x-4 top-1/2 -translate-y-1/2 swipe-card cursor-grab active:cursor-grabbing"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        x: 1000,
        rotate: 15,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 h-[420px] border border-gray-700 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {brainhole.source}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-xh-gold/20 text-xh-gold">精选脑洞</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white leading-relaxed mb-4">{brainhole.title}</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{brainhole.content}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 text-center">右滑收藏，记录你的第一反应</p>
        </div>
      </div>
    </motion.div>
  );
}
