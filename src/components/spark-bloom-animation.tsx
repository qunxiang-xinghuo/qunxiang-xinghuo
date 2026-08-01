/**
 * 星火绽放庆祝动画组件
 * 当故事完成时显示的烟花/星火绽放效果
 */
'use client';

import { useEffect, useState, useRef } from 'react';

interface Spark {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  sparks: Spark[];
}

const COLORS = [
  '#C8A84E', // 金色
  '#4A9FD8', // 品牌蓝
  '#7EC8E8', // 浅蓝
  '#FFF8DC', // 浅黄
  '#B0E0E6', // 浅绿
];

export function SparkBloomAnimation() {
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 创建多个烟花
    const createFirework = (id: number): Firework => {
      const x = 20 + Math.random() * 60; // 20% - 80% 的水平位置
      const y = 20 + Math.random() * 40; // 20% - 60% 的垂直位置
      const sparkCount = 12 + Math.floor(Math.random() * 8); // 12-20 个星火

      const sparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => {
        const angle = (i / sparkCount) * Math.PI * 2;
        const distance = 80 + Math.random() * 60;
        return {
          id: i,
          x: 0,
          y: 0,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 3 + Math.random() * 4,
          delay: Math.random() * 0.2,
          duration: 0.8 + Math.random() * 0.4,
        };
      });

      return { id, x, y, sparks };
    };

    // 依次创建 5 个烟花
    const fireworkIds = [0, 1, 2, 3, 4];
    const delays = [0, 400, 800, 1200, 1600];

    const timeouts: NodeJS.Timeout[] = [];
    fireworkIds.forEach((id, index) => {
      const timeout = setTimeout(() => {
        setFireworks(prev => [...prev, createFirework(id)]);
      }, delays[index]);
      timeouts.push(timeout);
    });

    // 3.5 秒后淡出
    const fadeTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 3500);
    timeouts.push(fadeTimeout);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, []);

  if (!isVisible && fireworks.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* 背景光晕 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(200, 168, 78, 0.1) 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out',
        }}
      />

      {/* 烟花 */}
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* 中心光点 */}
          <div
            className="absolute w-2 h-2 rounded-full bg-white"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 20px 10px rgba(255, 255, 255, 0.8)',
              animation: 'sparkCenterBurst 0.3s ease-out forwards',
            }}
          />

          {/* 星火 */}
          {firework.sparks.map((spark) => (
            <div
              key={spark.id}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                backgroundColor: spark.color,
                boxShadow: `0 0 ${spark.size * 2}px ${spark.color}`,
                transform: 'translate(-50%, -50%)',
                animation: `sparkBloom ${spark.duration}s ease-out ${spark.delay}s forwards`,
                '--target-x': `${spark.targetX}px`,
                '--target-y': `${spark.targetY}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}

      {/* 中心文字 */}
      <div
        className="relative z-10 text-center"
        style={{
          animation: 'textReveal 1s ease-out 0.5s forwards',
          opacity: 0,
        }}
      >
        <div className="font-serif text-4xl sm:text-5xl font-bold text-brand-gold mb-4"
          style={{
            textShadow: '0 0 30px rgba(200, 168, 78, 0.8), 0 0 60px rgba(200, 168, 78, 0.4)',
          }}
        >
          星火绽放
        </div>
        <div className="text-lg text-ink-secondary">
          故事已完成
        </div>
      </div>

      <style jsx>{`
        @keyframes sparkBloom {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + var(--target-x)),
              calc(-50% + var(--target-y))
            ) scale(0);
            opacity: 0;
          }
        }

        @keyframes sparkCenterBurst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }

        @keyframes textReveal {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
