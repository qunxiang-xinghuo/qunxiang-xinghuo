'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

const DECORATIVE_BUBBLES = [
  { size: 44, left: '72%', delay: 0, duration: 9, sway: 14 },
  { size: 28, left: '85%', delay: 1.5, duration: 11, sway: 10 },
  { size: 56, left: '68%', delay: 3, duration: 13, sway: 18 },
  { size: 22, left: '90%', delay: 0.8, duration: 10, sway: 8 },
  { size: 36, left: '78%', delay: 4.2, duration: 12, sway: 12 },
  { size: 48, left: '64%', delay: 2.1, duration: 14, sway: 16 },
  { size: 20, left: '94%', delay: 5.5, duration: 9, sway: 6 },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [windowHeight, setWindowHeight] = useState(800);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    setMounted(true);
    localStorage.removeItem('xh_user');
    localStorage.removeItem('xh_identity');
    localStorage.removeItem('xh_user_id');
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status, router]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      const msg = err === 'OAuthCallback'
        ? '知乎登录失败，请重试'
        : `登录错误: ${err}`;
      setError(msg);
    }
  }, [searchParams]);

  const handleZhihuLogin = () => {
    localStorage.removeItem('xh_user');
    localStorage.removeItem('xh_identity');
    localStorage.removeItem('xh_user_id');
    signIn('zhihu', { callbackUrl: '/home' });
  };

  return (
    <div className="flex flex-col h-full page-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#3B82F6]/8 blur-xl" />
        <div className="absolute top-32 right-6 w-20 h-20 rounded-full bg-[#74b9ff]/8 blur-xl" />
        <div className="absolute bottom-40 left-12 w-14 h-14 rounded-full bg-[#3B82F6]/4 blur-lg" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {DECORATIVE_BUBBLES.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
              bottom: -b.size,
              background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.01) 100%)`,
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: `
                inset 0 1px 2px rgba(255,255,255,0.25),
                inset 0 -1px 1px rgba(255,255,255,0.05),
                0 2px 8px rgba(255,255,255,0.06)
              `,
              backdropFilter: 'blur(1.5px)',
            }}
            animate={{
              y: [0, -windowHeight - b.size * 2],
              x: [0, b.sway, -b.sway * 0.6, b.sway * 0.8, 0],
            }}
            transition={{
              y: {
                duration: b.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: b.delay,
              },
              x: {
                duration: b.duration * 0.6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: b.delay,
              },
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: b.size * 0.22,
                height: b.size * 0.16,
                top: b.size * 0.14,
                left: b.size * 0.16,
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 60%, transparent 100%)',
                transform: 'rotate(-30deg)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: b.size * 0.35,
                height: b.size * 0.12,
                bottom: b.size * 0.1,
                right: b.size * 0.15,
                background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 80%)',
                transform: 'rotate(15deg)',
              }}
            />
          </motion.div>
        ))}
      </div>

      <div className="pt-20 pb-6 px-6 text-center relative z-10">
        <motion.div
          initial={mounted ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <Flame className="w-5 h-5 text-[#D4B830]/80" />
          <h1 className="text-3xl font-bold tracking-wider text-white">群像·星火</h1>
          <Flame className="w-5 h-5 text-[#D4B830]/80" />
        </motion.div>

        <motion.p
          initial={mounted ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-sm text-[#a8b8c8] leading-relaxed mb-2"
        >
          让真实发光，让思想变现
        </motion.p>
        <motion.p
          initial={mounted ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-xs text-[#94a3b8] leading-relaxed max-w-[280px] mx-auto"
        >
          在这里，你不再是别人故事的看客，<br />而是创造自己故事的主角
        </motion.p>
      </div>

      <motion.div
        initial={mounted ? { opacity: 0, scale: 0.9 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="flex justify-center relative z-10 mb-2"
      >
        <Image
          src="/logo.png"
          alt="群像·星火"
          width={80}
          height={80}
          className="drop-shadow-[0_0_20px_rgba(212,184,48,0.2)]"
          priority
        />
      </motion.div>

      <motion.div
        initial={mounted ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-6 flex flex-col items-center justify-center relative z-10"
      >
        <div className="w-full max-w-[320px] space-y-4">
          {error && (
            <motion.p
              initial={mounted ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            onClick={handleZhihuLogin}
            className="w-full py-3.5 rounded-xl bg-[#0066FF] text-white text-sm font-medium hover:bg-[#0052CC] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.635c.388.017.393 1.251.393 1.251H9.183c.062 1.191.193 2.387.33 3.355h1.066c.137.948.188 1.715.06 2.463H8.962c.55 2.324 1.11 3.284 2.13 3.944l-.885 1.03c-.82-.545-1.504-1.375-2.048-2.487-.545 1.112-1.23 1.942-2.049 2.487l-.885-1.03c1.02-.66 1.58-1.62 2.13-3.944H5.563c-.128-.748-.076-1.515.06-2.463h1.066c.137-.968.269-2.164.33-3.355H4.638s.005-1.234.393-1.251h2.635a58.104 58.104 0 01-.112-3.797H4.055s-.1-1.177.445-1.171h4.587c-.18-.676-.41-1.38-.68-2.11h1.278z" />
            </svg>
            知乎账号登录
          </button>

          <p className="text-xs text-[#64748b] text-center">
            点击登录即表示同意
            <span className="text-[#3B82F6]/80 hover:text-[#3B82F6] cursor-pointer"> 用户协议 </span>
            和
            <span className="text-[#3B82F6]/80 hover:text-[#3B82F6] cursor-pointer"> 隐私政策 </span>
          </p>
        </div>
      </motion.div>

      <div className="px-6 pb-6 text-center relative z-10">
        <p className="text-[10px] text-[#64748b]">群像·星火 · v9.5</p>
      </div>
    </div>
  );
}
