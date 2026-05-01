'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('用户名或密码错误');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] relative overflow-hidden">
      {/* 装饰泡泡背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#e2b04a]/10 blur-xl" />
        <div className="absolute top-32 right-6 w-20 h-20 rounded-full bg-[#74b9ff]/10 blur-xl" />
        <div className="absolute bottom-40 left-12 w-14 h-14 rounded-full bg-[#e2b04a]/5 blur-lg" />
      </div>

      {/* 顶部标题 */}
      <div className="pt-16 pb-8 px-6 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles className="w-5 h-5 text-[#e2b04a]/60" />
          <h1 className="text-2xl font-bold tracking-wider text-white/90">群像·星火</h1>
          <Sparkles className="w-5 h-5 text-[#e2b04a]/60" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs text-white/30"
        >
          每一个认真生活的人，都能成为故事的一部分
        </motion.p>
      </div>

      {/* 注册成功提示 */}
      {registered === '1' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
        >
          <p className="text-sm text-emerald-400">注册成功，请登录</p>
        </motion.div>
      )}

      {/* 登录表单 */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleLogin}
        className="flex-1 px-6 relative z-10"
      >
        <div className="space-y-4">
          {/* 用户名 */}
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

          {/* 密码 */}
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

          {/* 错误提示 */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}

          {/* 登录按钮 */}
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

        {/* 底部注册入口 */}
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

      {/* 底部装饰 */}
      <div className="px-6 pb-6 text-center">
        <p className="text-[10px] text-white/15">登录即表示同意用户协议和隐私政策</p>
      </div>
    </div>
  );
}
