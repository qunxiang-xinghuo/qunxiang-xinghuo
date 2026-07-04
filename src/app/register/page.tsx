'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 个字符');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f8ff] to-[#e8f4ff] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2e4a] mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            加入群像·星火
          </h1>
          <p className="text-[#4a6888] text-sm">
            给真心话一个角色的壳
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
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#dce2ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5AB0D8]/50 focus:border-[#5AB0D8] transition"
              placeholder="你的昵称"
              required
            />
          </div>

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
              placeholder="至少 6 个字符"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1.5">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#dce2ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5AB0D8]/50 focus:border-[#5AB0D8] transition"
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#7EC8E8] to-[#5AB0D8] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#4a6888]">
          已有账号？{' '}
          <Link href="/login" className="text-[#5AB0D8] hover:underline">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  );
}
