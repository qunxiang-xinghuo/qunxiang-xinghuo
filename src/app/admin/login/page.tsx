'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const err = searchParams.get('error');
    if (err) {
      setError(err === 'CredentialsSignin' ? '账号或密码错误' : `登录错误: ${err}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('admin', {
      username,
      password,
      redirect: false,
      callbackUrl: '/admin',
    });

    setLoading(false);

    if (result?.error) {
      setError('管理员账号或密码错误');
    } else if (result?.ok) {
      router.push('/admin');
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#3B82F6]/8 blur-xl" />
        <div className="absolute top-32 right-6 w-20 h-20 rounded-full bg-[#74b9ff]/8 blur-xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={mounted ? { opacity: 0, y: -20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">管理员登录</h1>
          <p className="text-sm text-[#94a3b8] mt-2">群像·星火 后台管理系统</p>
        </motion.div>

        <motion.form
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          onSubmit={handleSubmit}
          className="w-full max-w-[320px] space-y-4"
        >
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-400 text-center py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10"
            >
              {error}
            </motion.p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#94a3b8] mb-1.5 block">管理员用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-[#3B82F6]/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#94a3b8] mb-1.5 block">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 placeholder:text-white/20 outline-none focus:border-[#3B82F6]/30 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3.5 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-2 text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            返回用户登录
          </button>
        </motion.form>
      </div>

      <div className="px-6 pb-6 text-center relative z-10">
        <p className="text-[10px] text-[#64748b]">群像·星火 · 管理员后台</p>
      </div>
    </div>
  );
}
