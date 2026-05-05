'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Camera, Check, X, Eye, EyeOff, Lock, User, AlertCircle
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

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
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
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

// 头像组件（支持上传的图片或默认头像）
function UserAvatar({ user, size = 48 }: { user: UserData | null; size?: number }) {
  if (!user) return <DefaultAvatar name="?" size={size} />;
  if (user.image && user.image.startsWith('data:image/')) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 昵称编辑
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 密码
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 提示
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

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
        setNameValue(data.data.name || data.data.username || '');
        localStorage.setItem('xh_user', JSON.stringify(data.data));
      }
    } catch (e) {
      console.error('加载用户信息失败:', e);
    } finally {
      setLoading(false);
    }
  }

  // 头像上传
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: 'error', message: '图片大小不能超过 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setSaving(true);
      try {
        const guestId = localStorage.getItem('xh_user_id');
        const res = await fetch('/api/users/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(guestId ? { 'x-guest-id': guestId } : {}),
          },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (data.success) {
          setUser((prev) => prev ? { ...prev, image: base64 } : null);
          setToast({ type: 'success', message: '头像更新成功' });
          const updated = { ...user, image: base64 };
          localStorage.setItem('xh_user', JSON.stringify(updated));
        } else {
          setToast({ type: 'error', message: data.error?.message || '头像上传失败' });
        }
      } catch (e) {
        setToast({ type: 'error', message: '网络错误，请重试' });
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  }, [user]);

  // 昵称保存
  const saveName = useCallback(async () => {
    if (!nameValue.trim()) {
      setToast({ type: 'error', message: '昵称不能为空' });
      return;
    }
    setEditingName(false);
    setSaving(true);

    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => prev ? { ...prev, name: nameValue.trim() } : null);
        setToast({ type: 'success', message: '昵称更新成功' });
        const updated = { ...user, name: nameValue.trim() };
        localStorage.setItem('xh_user', JSON.stringify(updated));
      } else {
        setToast({ type: 'error', message: data.error?.message || '昵称修改失败' });
      }
    } catch (e) {
      setToast({ type: 'error', message: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  }, [nameValue, user]);

  const cancelEditName = useCallback(() => {
    setEditingName(false);
    setNameValue(user?.name || user?.username || '');
  }, [user]);

  // 密码修改
  const handlePasswordChange = useCallback(async () => {
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
        <div className="w-6 h-6 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <TopBar title="设置" showBack onBack={() => router.push('/profile')} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 头像区域 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            disabled={saving}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e2b04a]/30">
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

        {/* 昵称编辑 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="block text-xs text-white/40 mb-2 ml-1">昵称</label>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') cancelEditName();
                }}
                onBlur={saveName}
                autoFocus
                maxLength={30}
                className="flex-1 bg-white/5 border border-[#e2b04a]/30 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
              />
              <button
                onClick={saveName}
                className="w-10 h-10 rounded-xl bg-[#e2b04a]/10 flex items-center justify-center text-[#e2b04a]"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditName}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingName(true);
                setTimeout(() => nameInputRef.current?.focus(), 50);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <User className="w-4 h-4 text-white/30" />
              <span className="flex-1 text-sm text-white/80">{user?.name || user?.username || '未设置'}</span>
              <span className="text-xs text-[#e2b04a]/60">修改</span>
            </button>
          )}
        </motion.div>

        {/* 账号信息（只读） */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <label className="block text-xs text-white/40 mb-2 ml-1">用户名</label>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm text-white/40">{user?.username || '未设置'}</p>
          </div>
        </motion.div>

        {/* 修改密码 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <label className="block text-xs text-white/40 mb-2 ml-1">修改密码</label>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="旧密码"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e2b04a]/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e2b04a] to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? '保存中...' : '修改密码'}
            </button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-white/10 pt-4">群像·星火 v6.2</p>
      </div>

      {/* Toast 提示 */}
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
