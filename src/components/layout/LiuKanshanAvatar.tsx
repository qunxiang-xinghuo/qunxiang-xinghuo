'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface LiuKanshanAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'sleepy';
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 64,
  lg: 96,
  xl: 128,
};

// v5.2: 刘看山官方北极狐形象 - 使用真实北极狐图片
const LIUKANSHAN_IMAGE_URL =
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop&crop=face';

/**
 * CSS回退版本：当图片加载失败时显示
 * 一只可爱的北极狐简笔画风格
 */
function CssFallbackAvatar({ size, animate, className }: { size: number; animate: boolean; className?: string }) {
  return (
    <motion.div
      className={`relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        border: '2px solid rgba(116, 185, 255, 0.5)',
        boxShadow: '0 0 20px rgba(116, 185, 255, 0.2), inset -2px -2px 6px rgba(0,0,0,0.05)',
      }}
      animate={animate ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* 北极狐剪影 */}
      <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]" fill="none">
        {/* 耳朵 */}
        <ellipse cx="32" cy="28" rx="10" ry="14" fill="#d4d4d4" transform="rotate(-15 32 28)" />
        <ellipse cx="68" cy="28" rx="10" ry="14" fill="#d4d4d4" transform="rotate(15 68 28)" />
        {/* 头 */}
        <ellipse cx="50" cy="55" rx="28" ry="26" fill="#e8e8e8" />
        {/* 脸部 */}
        <ellipse cx="50" cy="58" rx="18" ry="16" fill="#f0f0f0" />
        {/* 眼睛 */}
        <circle cx="40" cy="52" r="3.5" fill="#4a5568" />
        <circle cx="60" cy="52" r="3.5" fill="#4a5568" />
        <circle cx="41" cy="51" r="1.2" fill="white" />
        <circle cx="61" cy="51" r="1.2" fill="white" />
        {/* 鼻子 */}
        <ellipse cx="50" cy="62" rx="3" ry="2" fill="#a0aec0" />
        {/* 嘴巴 */}
        <path d="M47 66 Q50 69 53 66" stroke="#a0aec0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* 腮红 */}
        <ellipse cx="32" cy="58" rx="5" ry="3" fill="#ffb6c1" opacity="0.4" />
        <ellipse cx="68" cy="58" rx="5" ry="3" fill="#ffb6c1" opacity="0.4" />
      </svg>
    </motion.div>
  );
}

export default function LiuKanshanAvatar({
  size = 'md',
  animate = true,
  className = '',
}: LiuKanshanAvatarProps) {
  const s = sizeMap[size];
  const [imgError, setImgError] = useState(false);

  // 图片加载失败时回退到CSS版本
  if (imgError) {
    return <CssFallbackAvatar size={s} animate={animate} className={className} />;
  }

  return (
    <motion.div
      className={`relative rounded-full flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: s,
        height: s,
        border: '2px solid rgba(116, 185, 255, 0.4)',
        boxShadow: '0 0 20px rgba(116, 185, 255, 0.15)',
      }}
      animate={animate ? { y: [0, -4, 0] } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* v5.2: 真实北极狐图片 */}
      <img
        src={LIUKANSHAN_IMAGE_URL}
        alt="刘看山 - 北极狐"
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
        loading="eager"
      />
    </motion.div>
  );
}
