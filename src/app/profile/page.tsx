'use client';

import TopBar from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/useAuth';
import { User, Heart, Lock, ScrollText, Coins, Settings, LogOut, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const menuItems = [
  { id: 'heal', label: '个人疗愈中心', icon: Heart, badge: '即将开放', desc: '密码保护，永不公开' },
  { id: 'couple', label: '密友空间', icon: Lock, badge: '即将开放', desc: '双人确认，AI催化' },
  { id: 'my-assets', label: '我的素材', icon: BookOpen, desc: '查看保存的对白历史' },
  { id: 'my-stories', label: '我发起的故事', icon: ScrollText, desc: '作为导演创建的项目' },
  { id: 'joined-stories', label: '我参与的故事', icon: ScrollText, desc: '作为角色参与的项目' },
  { id: 'income', label: '严选收益', icon: Coins, desc: '盐选收录收益' },
  { id: 'settings', label: '设置', icon: Settings },
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
      router.push('/story');
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="我的" />

      {/* 用户信息区 */}
      <div className="px-6 py-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 border-2 border-xh-gold/30">
          {user?.name?.charAt(0) || '游'}
        </div>
        <h2 className="text-white font-medium text-lg mb-1">{user?.name || '游客用户'}</h2>
        <div className="inline-flex items-center gap-1.5 bg-xh-gold/15 text-xh-gold px-3 py-1 rounded-full text-xs border border-xh-gold/20">
          <User size={12} />
          <span>{user?.identity?.label || '未设置身份'}</span>
        </div>

        <div className="flex items-center justify-center gap-8 mt-5">
          <div className="text-center">
            <div className="text-xh-gold font-bold text-xl">{user?.level || 1}</div>
            <div className="text-white/30 text-xs mt-1">等级</div>
          </div>
          <div className="text-center">
            <div className="text-xh-gold font-bold text-xl">{user?.sparkCount || 0}</div>
            <div className="text-white/30 text-xs mt-1">火花数</div>
          </div>
          <div className="text-center">
            <div className="text-xh-gold font-bold text-xl">0</div>
            <div className="text-white/30 text-xs mt-1">收益</div>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMenuClick(item)}
              className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05] transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 text-white/50">
                  <Icon size={18} />
                </div>
                <div>
                  <span className="text-white/80 text-sm">{item.label}</span>
                  {item.desc && (
                    <p className="text-[10px] text-white/25 mt-0.5">{item.desc}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] bg-xh-gold/15 text-xh-gold px-2 py-0.5 rounded-full border border-xh-gold/20">
                    {item.badge}
                  </span>
                )}
                <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          );
        })}

        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 text-red-400 rounded-xl py-3 text-sm font-medium border border-red-500/20 hover:bg-red-500/20 transition-colors mt-3"
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut size={16} />
            <span>退出登录</span>
          </div>
        </button>
      </div>
    </div>
  );
}
