'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { Brainhole } from './BrainholeCard';

interface CollectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collectedBrainholes: Brainhole[];
  onBrainholeSelect?: (brainhole: Brainhole) => void;
}

export default function CollectionDrawer({
  isOpen,
  onClose,
  collectedBrainholes,
  onBrainholeSelect,
}: CollectionDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-xh-dark rounded-t-3xl border-t border-gray-700 z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-xh-gold" />
                <h3 className="text-lg font-medium text-white">我的收藏</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar p-4 space-y-3">
              {collectedBrainholes.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-gray-400 text-sm">还没有收藏任何脑洞</p>
                </div>
              ) : (
                collectedBrainholes.map(brainhole => (
                  <div
                    key={brainhole.id}
                    onClick={() => {
                      onBrainholeSelect?.(brainhole);
                      onClose();
                    }}
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    <h4 className="text-white font-medium mb-1">{brainhole.title}</h4>
                    <p className="text-xs text-gray-400 line-clamp-2">{brainhole.content}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {brainhole.source}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
