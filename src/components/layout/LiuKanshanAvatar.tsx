'use client';

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

/**
 * v5.3: 刘看山官方卡通北极狐形象
 * 特征：白色小狐狸、圆脸、三角耳朵、短尾巴、看起来像小狗
 * 纯SVG绘制，无需外部图片资源
 */
function LiuKanshanSvg({ size, emotion }: { size: number; emotion: string }) {
  const eyeY = emotion === 'sleepy' ? 2 : 0;
  const eyeRx = emotion === 'sleepy' ? 3.5 : 2.5;
  const eyeRy = emotion === 'sleepy' ? 1.5 : 2.5;
  const mouthD = emotion === 'happy'
    ? 'M 44 58 Q 50 64 56 58'
    : emotion === 'thinking'
    ? 'M 46 60 Q 50 58 54 60'
    : 'M 47 60 Q 50 62 53 60';
  const cheekOpacity = emotion === 'happy' ? 0.35 : 0.2;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
        <linearGradient id="earGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* 短尾巴（刘看山标志性特征） */}
      <ellipse
        cx="78"
        cy="72"
        rx="10"
        ry="7"
        fill="#f5f5f5"
        stroke="#e0e0e0"
        strokeWidth="1"
      />

      {/* 身体 */}
      <ellipse
        cx="50"
        cy="68"
        rx="28"
        ry="22"
        fill="url(#bodyGrad)"
        filter="url(#softShadow)"
      />

      {/* 左耳朵 */}
      <path
        d="M 28 32 L 22 12 Q 24 8 30 14 L 38 28 Z"
        fill="url(#earGrad)"
        stroke="#e0e0e0"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M 26 28 L 24 16 Q 25 14 28 18 L 32 26 Z"
        fill="#ffe4e1"
        opacity="0.6"
      />

      {/* 右耳朵 */}
      <path
        d="M 72 32 L 78 12 Q 76 8 70 14 L 62 28 Z"
        fill="url(#earGrad)"
        stroke="#e0e0e0"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d="M 74 28 L 76 16 Q 75 14 72 18 L 68 26 Z"
        fill="#ffe4e1"
        opacity="0.6"
      />

      {/* 头部 */}
      <ellipse
        cx="50"
        cy="42"
        rx="26"
        ry="24"
        fill="url(#bodyGrad)"
        filter="url(#softShadow)"
      />

      {/* 脸部浅色区域 */}
      <ellipse
        cx="50"
        cy="48"
        rx="18"
        ry="14"
        fill="#fafafa"
      />

      {/* 左眼 */}
      <ellipse
        cx="40"
        cy={40 + eyeY}
        rx={eyeRx}
        ry={eyeRy}
        fill="#4a5568"
      />
      {emotion !== 'sleepy' && (
        <circle cx="41" cy={39 + eyeY} r="1" fill="white" />
      )}

      {/* 右眼 */}
      <ellipse
        cx="60"
        cy={40 + eyeY}
        rx={eyeRx}
        ry={eyeRy}
        fill="#4a5568"
      />
      {emotion !== 'sleepy' && (
        <circle cx="61" cy={39 + eyeY} r="1" fill="white" />
      )}

      {/* 鼻子 */}
      <ellipse
        cx="50"
        cy="52"
        rx="4"
        ry="3"
        fill="#a0aec0"
      />
      <ellipse
        cx="50"
        cy="51.5"
        rx="2"
        ry="1.2"
        fill="#c0c8d0"
      />

      {/* 嘴巴 */}
      <path
        d={mouthD}
        stroke="#a0aec0"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 左腮红 */}
      <ellipse
        cx="32"
        cy="48"
        rx="6"
        ry="4"
        fill="#ffb6c1"
        opacity={cheekOpacity}
      />

      {/* 右腮红 */}
      <ellipse
        cx="68"
        cy="48"
        rx="6"
        ry="4"
        fill="#ffb6c1"
        opacity={cheekOpacity}
      />

      {/* 眉毛（thinking时） */}
      {emotion === 'thinking' && (
        <>
          <path d="M 36 34 Q 40 32 44 34" stroke="#a0aec0" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M 56 34 Q 60 32 64 34" stroke="#a0aec0" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* 闭眼线（sleepy时） */}
      {emotion === 'sleepy' && (
        <>
          <path d="M 36 42 Q 40 44 44 42" stroke="#4a5568" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 56 42 Q 60 44 64 42" stroke="#4a5568" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function LiuKanshanAvatar({
  size = 'md',
  animate = true,
  emotion = 'neutral',
  className = '',
}: LiuKanshanAvatarProps) {
  const s = sizeMap[size];

  return (
    <motion.div
      className={`relative rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
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
      <LiuKanshanSvg size={s * 0.85} emotion={emotion} />
    </motion.div>
  );
}
