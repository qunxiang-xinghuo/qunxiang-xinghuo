'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import BrainholeCard, { Brainhole } from './BrainholeCard';

interface BrainholeStackProps {
  brainholes: Brainhole[];
  onSwipeRight: (brainhole: Brainhole) => void;
  onSwipeLeft: (brainhole: Brainhole) => void;
}

export default function BrainholeStack({
  brainholes,
  onSwipeRight,
  onSwipeLeft,
}: BrainholeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeRight = () => {
    const current = brainholes[currentIndex];
    onSwipeRight(current);
    setCurrentIndex(prev => prev + 1);
  };

  const handleSwipeLeft = () => {
    const current = brainholes[currentIndex];
    onSwipeLeft(current);
    setCurrentIndex(prev => prev + 1);
  };

  if (currentIndex >= brainholes.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-white mb-2">今天的脑洞已看完</h3>
          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-gradient-to-r from-xh-btn to-xh-btn-dark text-white px-6 py-3 rounded-xl font-medium shadow-lg"
          >
            重新浏览
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative px-4">
      <div className="mb-4">
        <div className="flex gap-1">
          {brainholes.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i < currentIndex ? 'bg-xh-accent' : i === currentIndex ? 'bg-xh-gold' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {currentIndex + 1} / {brainholes.length}
        </p>
      </div>

      <div className="relative h-[420px]">
        <AnimatePresence>
          <BrainholeCard
            key={brainholes[currentIndex].id}
            brainhole={brainholes[currentIndex]}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            isActive
          />
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-6 pb-8 mt-4">
        <button
          onClick={handleSwipeLeft}
          className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={handleSwipeRight}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-xh-btn to-xh-btn-dark flex items-center justify-center text-white shadow-lg"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center pb-4">左滑跳过 · 右滑收藏并记录反应</p>
    </div>
  );
}
