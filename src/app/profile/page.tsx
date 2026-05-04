'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings, Flame, BookOpen, ChevronRight, LogOut, Zap, Sparkles, Coins, Heart,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ sparks: 0, stories: 0, matches: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
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
    {
      icon: Coins,
      label: '我的收益',
      desc: '盐粒收益明细',
      path: '/earnings',
    },
    {
      icon: Heart,
      label: '个人疗愈',
      desc: '私密对话空间',
      path: '/healing',
    },
    {
      icon: Flame,
      label: '我的火花',
      desc: `${stats.sparks} 条灵感片段`,
      path: '/library',
    },
    {
      icon: BookOpen,
      label: '我的故事',
      desc: `${stats.stories} 个参与的故事`,
      path: '/story-hall',
    },
    {
      icon: Settings,
      label: '设置',
      desc: '账号与偏好',
      path: '/settings',
    },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="我的" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* v6.0: 头像左上 + 名称放大 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 mb-8"
        >
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#e2b04a]/20 flex-shrink-0 bg-gradient-to-br from-[#e2b04a]/10 to-orange-500/10">
            <Image
              src="/liukanshan.jpg"
              alt="头像"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-xl font-bold text-white/90">{user.name}</h2>
            <p className="text-xs text-white/30 mt-1">
              等级 Lv.{user.level || 1} · {user.identity?.label || '普通用户'}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">{stats.sparks}</p>
                <p className="text-[10px] text-white/25">火花</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">{stats.stories}</p>
                <p className="text-[10px] text-white/25">故事</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white/80">{stats.matches}</p>
                <p className="text-[10px] text-white/25">匹配</p>
              </div>
            </div>
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
              router.push('/login');
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
