'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings, Flame, BookOpen, ChevronRight, LogOut, Zap, Sparkles, Coins, Heart,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

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

// 用户头像组件
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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState({ sparks: 0, stories: 0, matches: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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

    // 获取统计数据（带10秒超时）
    async function loadStats() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const [sparkRes, storyRes] = await Promise.all([
          fetch('/api/sparks/mine', { signal: controller.signal }).then(r => r.json()),
          fetch('/api/stories/mine', { signal: controller.signal }).then(r => r.json()),
        ]);
        clearTimeout(timeout);

        setStats({
          sparks: sparkRes.data?.list?.length || 0,
          stories: storyRes.data?.list?.length || 0,
          matches: parseInt(localStorage.getItem('xh_match_count') || '0'),
        });
      } catch (e: any) {
        if (e.name === 'AbortError') {
          setLoadError('请求超时，请刷新重试');
        } else {
          setLoadError('加载失败，请刷新重试');
        }
        console.error('统计加载失败:', e);
      }
    }
    loadStats();
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
          onClick={() => router.push('/')}
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
    { icon: Flame, label: '我的火花', desc: `${stats.sparks} 条灵感片段`, path: '/library' },
    { icon: BookOpen, label: '我的故事', desc: `${stats.stories} 个参与的故事`, path: '/story-hall' },
    { icon: Settings, label: '设置', desc: '账号与偏好', path: '/settings' },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="我的" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* v6.2-fix5: 头像与昵称水平对齐 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          {/* 头像 48px 圆形 */}
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e2b04a]/20 flex-shrink-0">
            <UserAvatar user={user} size={48} />
          </div>

          {/* 昵称和等级 */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white/90 truncate">{user.name || user.username || '用户'}</h2>
            <p className="text-xs text-white/30 mt-0.5">
              等级 Lv.{user.level || 1} · 普通用户
            </p>
          </div>
        </motion.div>

        {/* 统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-6 mb-8 px-2"
        >
          <div className="text-center">
            <p className="text-base font-semibold text-white/80">{stats.sparks}</p>
            <p className="text-[10px] text-white/25">火花</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white/80">{stats.stories}</p>
            <p className="text-[10px] text-white/25">故事</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-white/80">{stats.matches}</p>
            <p className="text-[10px] text-white/25">匹配</p>
          </div>
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
                transition={{ delay: 0.1 + idx * 0.05 }}
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
            onClick={() => {
              localStorage.removeItem('xh_user');
              localStorage.removeItem('xh_identity');
              localStorage.removeItem('xh_user_id');
              router.push('/');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-400/60 text-sm hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>

        <p className="text-center text-[10px] text-white/10 pb-4">群像·星火 v6.2</p>
      </div>
    </div>
  );
}
