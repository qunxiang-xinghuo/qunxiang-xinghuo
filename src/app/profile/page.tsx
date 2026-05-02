'use client';

import TopBar from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/useAuth';
import {
  User, Heart, Lock, ScrollText, Coins, Settings, LogOut, BookOpen,
  ChevronRight, Crown, Flame, Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const menuItems = [
  { id: 'heal', label: '个人疗愈中心', icon: Heart, badge: '即将开放', desc: '密码保护，永不公开', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'couple', label: '密友空间', icon: Lock, badge: '即将开放', desc: '双人确认，AI催化', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { id: 'my-assets', label: '我的素材', icon: BookOpen, desc: '查看保存的对白历史', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'my-stories', label: '我发起的故事', icon: ScrollText, desc: '作为导演创建的项目', color: 'text-xh-gold', bg: 'bg-xh-gold/10', border: 'border-xh-gold/20' },
  { id: 'joined-stories', label: '我参与的故事', icon: Star, desc: '作为角色参与的项目', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { id: 'income', label: '严选收益', icon: Coins, desc: '盐选收录收益', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'settings', label: '设置', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
];

const stats = [
  { label: '等级', value: (u: any) => u?.level || 1, icon: Crown, color: 'text-xh-gold' },
  { label: '火花数', value: (u: any) => u?.sparkCount || 0, icon: Flame, color: 'text-orange-400' },
  { label: '收益', value: (u: any) => 0, icon: Coins, color: 'text-emerald-400' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.badge === '即将开放') {
      alert('该功能即将开放，敬请期待');
      return;
    }
    if (item.id === 'income') {
      alert('严选收益功能即将上线');
    } else if (item.id === 'my-assets') {
      router.push('/library');
    } else if (item.id === 'my-stories' || item.id === 'joined-stories') {
      router.push('/story-hall');
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="我的" showBack onBack={() => router.back()} />

      {/* 用户信息区 - v5.6: 大幅背景+更大的头像 */}
      <div className="relative shrink-0 overflow-hidden">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-xh-gold/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0e1a] to-transparent pointer-events-none" />

        <div className="relative px-5 pt-5 pb-4">
          {/* 头像 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mx-auto mb-3"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-xh-gold via-orange-400 to-xh-gold-dark p-[3px] shadow-xl shadow-xh-gold/15">
              <div className="w-full h-full rounded-full bg-[#131b2e] flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0) || '游'}
              </div>
            </div>
            {/* 身份标签 */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm text-xh-gold text-[10px] px-3 py-1 rounded-full border border-xh-gold/25 shadow-lg">
              <User size={10} />
              <span>{user?.identity?.label || '未设置身份'}</span>
            </div>
          </motion.div>

          {/* 用户名 */}
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center text-white font-semibold text-lg mt-3"
          >
            {user?.name || '游客用户'}
          </motion.h2>

          {/* 统计数字 - v5.6: 独立卡片 */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex-1 max-w-[120px] card-elevated p-3 text-center"
                >
                  <Icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color}`} />
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value(user)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* 菜单列表 - v5.6: 更有设计感 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-2 pb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1 h-4 rounded-full bg-xh-gold" />
          <span className="text-sm font-semibold text-slate-300">功能菜单</span>
        </div>

        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleMenuClick(item)}
              className="card-elevated p-3.5 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg} ${item.color} border ${item.border}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-slate-200 text-sm font-medium">{item.label}</span>
                  {item.desc && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.badge && (
                  <span className="text-[10px] bg-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  size={16}
                  className="text-slate-600 group-hover:text-xh-gold transition-colors"
                />
              </div>
            </motion.div>
          );
        })}

        {/* 退出登录 */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full mt-3 py-3 rounded-xl bg-red-500/[0.06] text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-500/[0.12] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </motion.button>

        {/* 版本号 */}
        <div className="text-center mt-4 mb-2">
          <p className="text-[10px] text-slate-700">群像星火 v5.6</p>
        </div>
      </div>
    </div>
  );
}
