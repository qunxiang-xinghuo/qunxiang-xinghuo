'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  Settings, Flame, BookOpen, ChevronRight, LogOut, Sparkles, Coins, Heart,
} from 'lucide-react';

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  level: number;
}

// 默认头像：白底灰色首字母
function DefaultAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className="bg-white/10 rounded-full flex items-center justify-center text-white/50 font-bold flex-shrink-0 border border-white/10"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initial}
    </div>
  );
}

// 用户头像组件
function UserAvatar({ user, size = 64 }: { user: UserData | null; size?: number }) {
  if (!user) return <DefaultAvatar name="?" size={size} />;
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name || '头像'}
        className="rounded-full object-cover flex-shrink-0 border border-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return <DefaultAvatar name={user.name || user.username || '?'} size={size} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // 从 API 加载最新用户信息
  async function loadUserFromApi() {
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch('/api/users/me', {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('xh_user', JSON.stringify(data.data));
      }
    } catch (e) {
      console.error('加载用户信息失败:', e);
    }
  }

  useEffect(() => {
    // 先从 localStorage 读取显示
    const raw = localStorage.getItem('xh_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUser(u);
      } catch {
        localStorage.removeItem('xh_user');
        setUser(null);
      }
    }
    setPageLoading(false);

    // 然后从 API 刷新最新数据
    loadUserFromApi();
  }, [router]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen page-gradient">
        <div className="w-6 h-6 border-2 border-[#e2b04a]/30 border-t-[#e2b04a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen page-gradient px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#e2b04a]/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-[#e2b04a]" />
        </div>
        <h2 className="text-lg font-bold text-white/90 mb-2">请先登录</h2>
        <p className="text-sm text-white/40 mb-6 text-center">登录后即可查看个人信息和使用全部功能</p>
        <button
          onClick={() => router.push('/login')}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#e2b04a] to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          去登录
        </button>
      </div>
    );
  }

  const menuItems = [
    { icon: Coins, label: '我的收益', desc: '盐粒收益明细', path: '/earnings' },
    { icon: Heart, label: '个人疗愈', desc: '私密对话空间', path: '/healing' },
    { icon: Flame, label: '我的火花', desc: '管理你的灵感片段', path: '/profile/sparks' },
    { icon: BookOpen, label: '我的故事', desc: '参与的故事记录', path: '/story-hall' },
    { icon: Settings, label: '设置', desc: '账号与偏好', path: '/settings' },
  ];

  // 显示数据库中的登录用户名（username）
  const displayName = user.username || user.name || '用户';

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 居中标题 */}
      <div className="shrink-0 px-4 pt-4 pb-2 text-center">
        <h1 className="text-lg font-bold text-white/90">我的</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 用户信息：头像左+用户名右，左对齐 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8 px-2"
        >
          {/* 头像 64px 圆形，白底 */}
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <UserAvatar user={user} size={64} />
          </div>

          {/* 用户名 */}
          <h2 className="text-xl font-bold text-white/90">{displayName}</h2>
        </motion.div>

        {/* 功能菜单 */}
        <div className="space-y-2">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + idx * 0.05 }}
                onClick={() => router.push(item.path)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#e2b04a]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#e2b04a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">{item.label}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20" />
              </motion.button>
            );
          })}
        </div>

        {/* 退出登录 */}
        <div className="mt-8 pb-6">
          <button
            onClick={async () => {
              // v7.0-fix6: 先清除所有本地数据，再调用 signOut，最后硬刷新
              // 顺序：localStorage → signOut(清除HTTPOnly cookie) → 硬刷新
              localStorage.removeItem('xh_user');
              localStorage.removeItem('xh_identity');
              localStorage.removeItem('xh_user_id');
              sessionStorage.clear();

              try {
                await signOut({ redirect: false });
              } catch (e) {
                console.error('[Logout] signOut 失败:', e);
              }

              // 使用 replace 避免历史记录残留，确保彻底回到登录页
              window.location.replace('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-400/60 text-sm hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>

        <p className="text-center text-[10px] text-white/10 pb-4">群像·星火 v7.0</p>
      </div>
    </div>
  );
}
