'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('邮箱或密码错误');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f8ff] to-[#e8f4ff] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2e4a] mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            登录群像·星火
          </h1>
          <p className="text-[#4a6888] text-sm">
            在角色的壳里，说彼此不敢说的话
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#dce2ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5AB0D8]/50 focus:border-[#5AB0D8] transition"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#dce2ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5AB0D8]/50 focus:border-[#5AB0D8] transition"
              placeholder="输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#7EC8E8] to-[#5AB0D8] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#4a6888]">
          还没有账号？{' '}
          <Link href="/register" className="text-[#5AB0D8] hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
