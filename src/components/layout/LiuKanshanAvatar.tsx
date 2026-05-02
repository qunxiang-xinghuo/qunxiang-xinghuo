'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface LiuKanshanAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'sleepy';
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 64,
  lg: 120,
  xl: 144,
};

/**
 * v5.3-avatar: 刘看山官方卡通形象（使用本地图片）
 * 图片路径: public/liukanshan.jpg
 * 默认宽度120px左右，高度自适应
 */
export default function LiuKanshanAvatar({
  size = 'md',
  animate = true,
  className = '',
}: LiuKanshanAvatarProps) {
  const s = sizeMap[size];

  return (
    <motion.div
      className={`relative rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: s,
        height: s,
        background: 'linear-gradient(135deg, #e8f4fc 0%, #d6e8f5 100%)',
        border: '2px solid rgba(116, 185, 255, 0.3)',
        boxShadow: '0 0 16px rgba(116, 185, 255, 0.15), inset 0 1px 2px rgba(255,255,255,0.5)',
      }}
      animate={animate ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Image
        src="/liukanshan.jpg"
        alt="刘看山"
        width={s}
        height={s}
        className="object-contain"
        style={{ width: s, height: s }}
        priority
      />
    </motion.div>
  );
}
