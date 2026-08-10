/**
 * @file 个人资料页面
 * @description 用户查看和编辑个人资料
 * 包括用户名、邮箱、修改密码等功能
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: '密码长度至少 8 位' });
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: '密码修改成功' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        setMessage({ type: 'error', text: data.error || '密码修改失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f8ff] to-white">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#1a2e4a]">用户中心</h1>
          <p className="text-[#4a6888] mt-2">管理你的账户信息和登录方式</p>
        </div>

        {/* 消息提示 */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8f0] p-8 mb-6">
          <h2 className="font-serif text-xl font-semibold text-[#1a2e4a] mb-6">
            基本信息
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#e0e8f0]">
              <span className="text-[#4a6888]">用户名</span>
              <span className="text-[#1a2e4a] font-medium">{profile.username}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-[#e0e8f0]">
              <span className="text-[#4a6888]">邮箱</span>
              <span className="text-[#1a2e4a] font-medium">{profile.email}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[#4a6888]">注册时间</span>
              <span className="text-[#1a2e4a] font-medium">
                {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 登录方式管理 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8f0] p-8 mb-6">
          <h2 className="font-serif text-xl font-semibold text-[#1a2e4a] mb-6">
            登录方式
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#e0e8f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4a9fd8]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a9fd8" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <div className="text-[#1a2e4a] font-medium">邮箱登录</div>
                  <div className="text-sm text-[#8a9db0]">{profile.email}</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                已启用
              </span>
            </div>

            {/* 预留多产品登录入口 */}
            <div className="flex items-center justify-between py-3 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a9db0" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-[#1a2e4a] font-medium">微信登录</div>
                  <div className="text-sm text-[#8a9db0]">即将支持</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                未启用
              </span>
            </div>
          </div>
        </div>

        {/* 修改密码 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8f0] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-[#1a2e4a]">
              安全设置
            </h2>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="px-4 py-2 rounded-lg bg-[#4a9fd8] text-white text-sm font-medium hover:bg-[#3a8fc8] transition-colors"
            >
              {showPasswordForm ? '取消' : '修改密码'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm text-[#4a6888] mb-2">当前密码</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e0e8f0] focus:outline-none focus:ring-2 focus:ring-[#4a9fd8]/20 focus:border-[#4a9fd8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#4a6888] mb-2">新密码</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e0e8f0] focus:outline-none focus:ring-2 focus:ring-[#4a9fd8]/20 focus:border-[#4a9fd8]"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm text-[#4a6888] mb-2">确认新密码</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e0e8f0] focus:outline-none focus:ring-2 focus:ring-[#4a9fd8]/20 focus:border-[#4a9fd8]"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#4a9fd8] text-white font-medium hover:bg-[#3a8fc8] transition-colors"
              >
                确认修改
              </button>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
