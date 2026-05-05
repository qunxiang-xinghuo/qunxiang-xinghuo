'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 前端校验
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (username.trim().length < 2) {
      setError('用户名至少2个字符');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      console.log('[Register] 正在发送注册请求...');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await res.json();
      console.log('[Register] 注册响应:', result);

      if (result.success) {
        // v6.3-auth-fix: 注册成功后自动登录，不再跳转回登录页手动登录
        console.log('[Register] 注册成功，正在自动登录...');
        const signInResult = await signIn('credentials', {
          username: username.trim(),
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          console.error('[Register] 自动登录失败:', signInResult.error);
          setError('注册成功，但自动登录失败，请手动登录');
          // 自动登录失败时，跳转回登录页并预填用户名密码
          router.push(`/?username=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password)}`);
          return;
        }

        // 自动登录成功，获取真实用户数据
        console.log('[Register] 自动登录成功，正在获取用户数据...');
        const meRes = await fetch('/api/users/me');
        const meData = await meRes.json();

        if (meData.success && meData.data) {
          const realUser = {
            id: meData.data.id,
            name: meData.data.name || meData.data.username || username.trim(),
            username: meData.data.username,
            email: meData.data.email,
            image: meData.data.image,
            identity: { type: 'real' as const, label: meData.data.username || meData.data.name || username.trim() },
            level: meData.data.level || 1,
            sparkCount: meData.data.sparkCount || 0,
          };
          localStorage.setItem('xh_user', JSON.stringify(realUser));
          localStorage.setItem('xh_user_id', meData.data.id);
        }

        router.push('/home');
        router.refresh();
      } else {
        // v6.3-auth-fix: 清晰显示 API 返回的错误信息
        setError(result.message || '注册失败，请稍后重试');
      }
    } catch (err) {
      console.error('[Register] 注册异常:', err);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient relative overflow-hidden">
      {/* 装饰泡泡背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-8 w-16 h-16 rounded-full bg-[#e2b04a]/10 blur-xl" />
        <div className="absolute top-32 right-6 w-20 h-20 rounded-full bg-[#74b9ff]/10 blur-xl" />
        <div className="absolute bottom-40 left-12 w-14 h-14 rounded-full bg-[#e2b04a]/5 blur-lg" />
      </div>

      {/* 顶部 */}
      <div className="pt-6 px-4 flex items-center gap-3 relative z-10">
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e2b04a]/60" />
          <h1 className="text-lg font-bold tracking-wider text-white/90">群像·星火</h1>
        </div>
      </div>

      {/* 标题 */}
      <div className="pt-8 pb-6 px-6 text-center relative z-10">
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-bold text-white/90 mb-2"
        >
          创建账号
        </motion.h2>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-white/50"
        >
          开启你的群像故事之旅
        </motion.p>
      </div>

      {/* 注册表单 */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleRegister}
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
              placeholder="请输入用户名（2-30字符）"
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
                placeholder="请输入密码（至少6位）"
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

          {/* 确认密码 */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5 ml-1">确认密码</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
              maxLength={100}
            />
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

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#e2b04a] to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                确认注册
              </>
            )}
          </button>
        </div>

        {/* 底部登录入口 */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-white/40 hover:text-[#e2b04a] transition-colors"
          >
            已有账号？<span className="text-[#e2b04a]/80 hover:text-[#e2b04a]">去登录</span>
          </button>
        </div>
      </motion.form>

      {/* 底部装饰 */}
      <div className="px-6 pb-6 text-center">
        <p className="text-[10px] text-white/15">注册即表示同意用户协议和隐私政策</p>
      </div>
    </div>
  );
}
