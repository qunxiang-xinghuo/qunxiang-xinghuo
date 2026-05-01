'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileContainer({ children, className = '' }: MobileContainerProps) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={`h-full flex flex-col ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
