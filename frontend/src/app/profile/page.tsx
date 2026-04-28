'use client';

import TopBar from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/useAuth';
import { User, Sparkles, Settings, Heart, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const menuItems = [
  { id: 'couple', label: '情侣共建', icon: Heart, badge: '即将上线' },
  { id: 'heal', label: '情绪树洞', icon: Heart, badge: '即将上线' },
  { id: 'serial', label: '连载故事', icon: Heart, badge: '即将上线' },
  { id: 'income', label: '收益中心', icon: Heart, badge: '即将上线' },
  { id: 'settings', label: '设置', icon: Settings },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="个人中心" />

      <div className="px-6 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-xh-gold to-orange-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
          {user?.name?.charAt(0) || '游'}
        </div>
        <h2 className="text-white font-medium text-lg mb-1">{user?.name || '游客用户'}</h2>
        <div className="inline-flex items-center gap-1.5 bg-xh-gold/20 text-xh-gold px-3 py-1 rounded-full text-xs">
          <User size={12} />
          <span>{user?.identity.label || '未设置身份'}</span>
        </div>

        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-xh-gold font-bold text-xl">{user?.level || 1}</div>
            <div className="text-gray-500 text-xs mt-1">等级</div>
          </div>
          <div className="text-center">
            <div className="text-xh-accent font-bold text-xl">{user?.sparkCount || 0}</div>
            <div className="text-gray-500 text-xs mt-1">火花数</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-700/50 text-gray-300">
                  <Icon size={18} />
                </div>
                <span className="text-white text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] bg-xh-gold/20 text-xh-gold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
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
