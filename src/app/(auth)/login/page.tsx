'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center mb-8 pt-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors mr-3"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">登录</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="邮箱地址"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-xh-accent transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-xh-accent transition-colors"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-accent to-rose-600 text-white py-4 rounded-xl font-medium shadow-lg disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed mb-4"
        >
          <LogIn className="w-4 h-4" />
          {isLoading ? '登录中...' : '登录'}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            还没有账号？{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-xh-accent hover:underline"
            >
              立即注册
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
