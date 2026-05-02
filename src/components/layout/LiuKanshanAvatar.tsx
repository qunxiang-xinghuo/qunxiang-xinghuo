'use client';

import { motion } from 'framer-motion';

interface LiuKanshanAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  emotion?: 'neutral' | 'happy' | 'thinking' | 'sleepy';
  className?: string;
}

const sizeMap = {
  sm: { container: 48, ear: 10, eye: 8, mouthW: 10, mouthH: 6, blush: 7 },
  md: { container: 64, ear: 14, eye: 10, mouthW: 12, mouthH: 7, blush: 9 },
  lg: { container: 96, ear: 20, eye: 14, mouthW: 16, mouthH: 10, blush: 12 },
  xl: { container: 128, ear: 26, eye: 18, mouthW: 22, mouthH: 14, blush: 16 },
};

export default function LiuKanshanAvatar({
  size = 'md',
  animate = true,
  emotion = 'neutral',
  className = '',
}: LiuKanshanAvatarProps) {
  const s = sizeMap[size];
  const c = s.container;

  const eyeColor = emotion === 'sleepy' ? '#a0aec0' : '#74b9ff';
  const mouthColor = emotion === 'happy' ? '#ff6b6b' : emotion === 'thinking' ? '#e2b04a' : '#ff9f43';
  const bounceY = animate ? [0, -6, 0] : 0;

  return (
    <motion.div
      className={`relative rounded-full flex-shrink-0 ${className}`}
      style={{
        width: c,
        height: c,
        background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
        border: '2px solid #74b9ff',
        boxShadow: '0 0 24px #74b9ff40, inset -2px -2px 6px rgba(0,0,0,0.1)',
      }}
      animate={animate ? { y: bounceY } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* 耳朵 */}
      <div
        className="absolute rounded-full bg-[#f5f5f5] border border-gray-200"
        style={{
          top: -s.ear * 0.35,
          left: s.ear * 0.3,
          width: s.ear,
          height: s.ear,
        }}
      />
      <div
        className="absolute rounded-full bg-[#f5f5f5] border border-gray-200"
        style={{
          top: -s.ear * 0.35,
          right: s.ear * 0.3,
          width: s.ear,
          height: s.ear,
        }}
      />

      {/* 脸 */}
      <div
        className="absolute rounded-full bg-[#f5f5f5] flex items-center justify-center"
        style={{
          inset: c * 0.04,
        }}
      >
        {/* 眼睛 */}
        <div className="flex gap-2 items-center" style={{ marginTop: -c * 0.02 }}>
          <div
            className="rounded-full"
            style={{
              width: s.eye,
              height: s.eye,
              background: eyeColor,
              opacity: emotion === 'sleepy' ? 0.5 : 1,
            }}
          />
          <div
            className="rounded-full"
            style={{
              width: s.eye,
              height: s.eye,
              background: eyeColor,
              opacity: emotion === 'sleepy' ? 0.5 : 1,
            }}
          />
        </div>

        {/* 嘴巴 */}
        <div
          className="absolute rounded-b-full"
          style={{
            bottom: c * 0.18,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s.mouthW,
            height: s.mouthH,
            background: mouthColor,
          }}
        />
      </div>

      {/* 腮红 */}
      <div
        className="absolute rounded-full bg-[#ffcccc] opacity-40"
        style={{
          top: c * 0.28,
          left: c * 0.08,
          width: s.blush,
          height: s.blush * 0.85,
        }}
      />
      <div
        className="absolute rounded-full bg-[#ffcccc] opacity-40"
        style={{
          top: c * 0.28,
          right: c * 0.08,
          width: s.blush,
          height: s.blush * 0.85,
        }}
      />
    </motion.div>
  );
}
