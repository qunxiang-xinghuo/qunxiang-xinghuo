'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Flame } from 'lucide-react';
import { signIn } from 'next-auth/react';

// v6.0 装饰性透明泡泡配置
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

  const { status } = useSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [windowHeight, setWindowHeight] = useState(800);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    setMounted(true);
  }, []);

  // v6.3-auth-fix3: 如果 session 明确未认证，清除所有本地残留数据
  // 确保打开登录页时，任何旧的 localStorage 数据都不会导致自动登录
  useEffect(() => {
    if (status === 'unauthenticated') {
      console.log('[LoginForm] Session 未认证，清除本地残留');
      localStorage.removeItem('xh_user');
      localStorage.removeItem('xh_identity');
      localStorage.removeItem('xh_user_id');
    }
  }, [status]);

  // 已登录用户访问登录页，直接重定向到发现页
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/home');
    }
  }, [status, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autoUser = params.get('username');
    const autoPass = params.get('password');
    if (autoUser) setUsername(autoUser);
    if (autoPass) setPassword(autoPass);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      // v6.3-auth-fix3: 登录前清除可能残留的旧数据
      localStorage.removeItem('xh_user');
      localStorage.removeItem('xh_identity');
      localStorage.removeItem('xh_user_id');

      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('用户名或密码错误');
        return;
      }

      // v6.3-auth-fix3: 登录成功后，从服务器获取真实用户数据
      console.log('[Login] 认证成功，正在获取用户数据...');
      const meRes = await fetch('/api/users/me');
      const meData = await meRes.json();

      if (meData.success && meData.data) {
        // v7.0: 优先使用 username（登录用户名）显示
        const displayName = meData.data.username || meData.data.name || username.trim();
        const realUser = {
          id: meData.data.id,
          name: displayName,
          username: meData.data.username,
          email: meData.data.email,
          image: meData.data.image,
          identity: { type: 'real' as const, label: displayName },
          level: meData.data.level || 1,
          sparkCount: meData.data.sparkCount || 0,
        };
        localStorage.setItem('xh_user', JSON.stringify(realUser));
        localStorage.setItem('xh_user_id', meData.data.id);
        console.log('[Login] 用户数据已同步到 localStorage:', realUser.id);
      } else {
        console.warn('[Login] /api/users/me 获取失败，使用基本数据');
        const fallbackUser = {
          id: 'user-' + Date.now(),
          name: username.trim(),
          identity: { type: 'real' as const, label: username.trim() },
          level: 1,
          sparkCount: 0,
        };
        localStorage.setItem('xh_user', JSON.stringify(fallbackUser));
      }

      router.push('/home');
      router.refresh();
    } catch (err) {
      console.error('[Login] 登录异常:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient relative overflow-hidden">
      {/* ====== 装饰背景光斑 ====== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#e2b04a]/8 blur-xl" />
        <div className="absolute top-32 right-6 w-20 h-20 rounded-full bg-[#74b9ff]/8 blur-xl" />
        <div className="absolute bottom-40 left-12 w-14 h-14 rounded-full bg-[#e2b04a]/4 blur-lg" />
      </div>

      {/* ====== 右下角装饰性透明泡泡 ====== */}
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
            {/* 高光点 */}
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
            {/* 底部微折射 */}
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

      {/* ====== 项目简介 ====== */}
      <div className="pt-16 pb-6 px-6 text-center relative z-10">
        <motion.div
          initial={mounted ? { y: -20, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <Flame className="w-5 h-5 text-[#e2b04a]/60" />
          <h1 className="text-3xl font-bold tracking-wider text-white/90">群像·星火</h1>
          <Flame className="w-5 h-5 text-[#e2b04a]/60" />
        </motion.div>

        <motion.p
          initial={mounted ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-sm text-white/60 leading-relaxed mb-2"
        >
          让真实发光，让思想变现
        </motion.p>
        <motion.p
          initial={mounted ? { y: 10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-xs text-white/40 leading-relaxed max-w-[280px] mx-auto"
        >
          在这里，你不再是别人故事的看客，<br />而是创造自己故事的主角
        </motion.p>
      </div>

      {/* ====== 登录表单 ====== */}
      <motion.form
        initial={mounted ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onSubmit={handleLogin}
        className="flex-1 px-6 relative z-10"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5 ml-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 ml-1">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e2b04a] to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                登录
              </>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="text-sm text-white/40 hover:text-[#e2b04a] transition-colors"
          >
            没有账号？<span className="text-[#e2b04a]/80 hover:text-[#e2b04a]">去注册</span>
          </button>
        </div>
      </motion.form>

      <div className="px-6 pb-6 text-center relative z-10">
        <p className="text-[10px] text-white/15">登录即表示同意用户协议和隐私政策 · v7.0</p>
      </div>
    </div>
  );
}
