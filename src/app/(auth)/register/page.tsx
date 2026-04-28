'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);
      router.push('/');
    } catch (error) {
      console.error('Register failed:', error);
      setError('注册失败，请稍后重试');
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
        <h1 className="text-2xl font-bold text-white">注册</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {error && (
          <div className="bg-xh-accent/10 border border-xh-accent/20 text-xh-accent rounded-xl p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="relative">
            <User className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="昵称"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-xh-accent transition-colors"
              required
            />
          </div>

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
              placeholder="密码（至少6位）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-xh-accent transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-xh-accent transition-colors"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !name || !email || !password || !confirmPassword}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-accent to-rose-600 text-white py-4 rounded-xl font-medium shadow-lg disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed mb-4"
        >
          <UserPlus className="w-4 h-4" />
          {isLoading ? '注册中...' : '注册'}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            已有账号？{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-xh-accent hover:underline"
            >
              立即登录
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
