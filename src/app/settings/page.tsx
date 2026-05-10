'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, User, Lock, AlertCircle, Eye, EyeOff, X,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  level: number;
}

// 首字母彩色头像（默认头像）
function DefaultAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const colors = [
    'bg-red-500', 'bg-xh-gold', 'bg-slate-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
  ];
  const colorIndex = name?.charCodeAt(0) % colors.length || 0;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`${bgColor} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

// 头像组件
function UserAvatar({ user, size = 48 }: { user: UserData | null; size?: number }) {
  if (!user) return <DefaultAvatar name="?" size={size} />;
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name || '头像'}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return <DefaultAvatar name={user.name || user.username || '?'} size={size} />;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // v8.0-login-fix: 页面级认证门禁 — 未登录返回空白页
  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  // 弹窗控制
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 用户名编辑
  const [usernameValue, setUsernameValue] = useState('');

  // 密码
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadUser() {
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/me', {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        // v7.0: 优先显示 username（登录用户名）
        setUsernameValue(data.data.username || data.data.name || '');
        localStorage.setItem('xh_user', JSON.stringify(data.data));
      }
    } catch (e) {
      console.error('加载用户信息失败:', e);
    } finally {
      setLoading(false);
    }
  }

  // 头像上传（multipart/form-data → Multer）
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: '图片大小不能超过 2MB' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: guestId ? { 'x-guest-id': guestId } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, image: data.data?.imageUrl || data.data?.user?.image } : null);
        setToast({ type: 'success', message: '头像更新成功' });
      } else {
        setToast({ type: 'error', message: data.error?.message || '头像上传失败' });
      }
    } catch (e) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // 修改用户名
  const saveUsername = useCallback(async () => {
    if (!usernameValue.trim()) {
      setToast({ type: 'error', message: '用户名不能为空' });
      return;
    }
    setSaving(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ username: usernameValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const newName = usernameValue.trim();
        setUser((prev) => prev ? { ...prev, name: newName, username: newName } : null);
        // 同步更新 localStorage
        const raw = localStorage.getItem('xh_user');
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            saved.name = newName;
            saved.username = newName;
            localStorage.setItem('xh_user', JSON.stringify(saved));
          } catch { /* ignore */ }
        }
        setToast({ type: 'success', message: '用户名修改成功' });
        setShowUsernameModal(false);
      } else {
        setToast({ type: 'error', message: data.error?.message || '用户名修改失败' });
      }
    } catch (e) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  }, [usernameValue]);

  // 修改密码
  const savePassword = useCallback(async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setToast({ type: 'error', message: '请填写所有密码字段' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: '两次输入的新密码不一致' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: '新密码至少6个字符' });
      return;
    }

    setSaving(true);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: 'success', message: '密码修改成功' });
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToast({ type: 'error', message: data.error?.message || '密码修改失败' });
      }
    } catch (e) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  }, [oldPassword, newPassword, confirmPassword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen page-gradient">
        <div className="w-6 h-6 border-2 border-[#8a9ab0]/30 border-t-[#8a9ab0] rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = user?.username || user?.name || '用户';

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <TopBar title="设置" showBack onBack={() => router.push('/profile')} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-6">
        {/* 头像区域：居中，可点击上传 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={saving}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#8a9ab0]/30">
              <UserAvatar user={user} size={80} />
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {saving && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-white/30 mt-2">点击更换头像</p>
        </motion.div>

        {/* 功能列表 */}
        <div className="space-y-2">
          {/* 修改用户名 */}
          <motion.button
            initial={mounted ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              setUsernameValue(user?.username || user?.name || '');
              setShowUsernameModal(true);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-[#74b9ff]/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#74b9ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">修改用户名</p>
              <p className="text-[11px] text-white/30 mt-0.5">{displayName}</p>
            </div>
            <span className="text-xs text-xh-yellow/60">修改</span>
          </motion.button>

          {/* 修改密码 */}
          <motion.button
            initial={mounted ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-[#8a9ab0]/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-xh-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">修改密码</p>
              <p className="text-[11px] text-white/30 mt-0.5">********</p>
            </div>
            <span className="text-xs text-xh-yellow/60">修改</span>
          </motion.button>
        </div>

        <p className="text-center text-[10px] text-white/10 pt-8">群像·星火 v7.0</p>
      </div>

      {/* 用户名修改弹窗 */}
      <AnimatePresence>
        {showUsernameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setShowUsernameModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1a1a1c] rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white/90">修改用户名</h3>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                placeholder="输入新用户名"
                maxLength={30}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#8a9ab0]/50 transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveUsername}
                  disabled={saving || !usernameValue.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8a9ab0] to-[#6c7c90] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 密码修改弹窗 */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1a1a1c] rounded-2xl border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white/90">修改密码</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-white/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="旧密码"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#8a9ab0]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="新密码（至少6个字符）"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#8a9ab0]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="确认新密码"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#8a9ab0]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={savePassword}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8a9ab0] to-[#6c7c90] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 z-50 ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
