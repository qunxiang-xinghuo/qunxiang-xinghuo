'use client';

import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="shrink-0 px-4 pt-4 pb-2"
    >
      <h1 className="text-lg font-bold text-white/90">{title}</h1>
      {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}
