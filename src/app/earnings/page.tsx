'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, Clock, Wallet, Gift } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface EarningItem {
  id: string;
  source: string;
  amount: number;
  status: 'pending' | 'settled';
  date: string;
  icon: 'story' | 'spark' | 'bonus';
}

const mockEarnings: EarningItem[] = [
  { id: '1', source: '故事《深夜便利店》盐选分成', amount: 1280, status: 'settled', date: '2026-04-28', icon: 'story' },
  { id: '2', source: '火花「末班公交车」被收录', amount: 350, status: 'pending', date: '2026-04-27', icon: 'spark' },
  { id: '3', source: '月度创作者激励', amount: 500, status: 'pending', date: '2026-04-25', icon: 'bonus' },
  { id: '4', source: '故事《电梯里的沉默》盐选分成', amount: 890, status: 'settled', date: '2026-04-20', icon: 'story' },
  { id: '5', source: '火花「旧手机里的短信」被收录', amount: 220, status: 'settled', date: '2026-04-15', icon: 'spark' },
];

export default function EarningsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'settled'>('all');

  const filtered = mockEarnings.filter((e) => activeTab === 'all' || e.status === activeTab);
  const total = mockEarnings.reduce((sum, e) => sum + e.amount, 0);
  const pending = mockEarnings.filter((e) => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  const iconMap = {
    story: TrendingUp,
    spark: Coins,
    bonus: Gift,
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="我的收益" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 总收益卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#e2b04a]/10 to-orange-500/5 border border-[#e2b04a]/15 mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#e2b04a]" />
              <span className="text-sm text-white/60">盐粒余额</span>
            </div>
            <span className="text-[11px] text-white/25">1 盐粒 = ¥0.01</span>
          </div>
          <p className="text-3xl font-bold text-[#e2b04a] mb-1">
            {total.toLocaleString()}
            <span className="text-sm font-normal text-[#e2b04a]/60 ml-1">盐粒</span>
          </p>
          <p className="text-xs text-white/30 mb-4">≈ ¥{(total / 100).toFixed(2)}</p>
          <div className="flex items-center gap-4 pt-3 border-t border-white/5">
            <div>
              <p className="text-[11px] text-white/30">待结算</p>
              <p className="text-sm font-medium text-white/70">{pending.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/30">已结算</p>
              <p className="text-sm font-medium text-white/70">{(total - pending).toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={() => { /* 提现功能即将开放 */ }}
            disabled
            className="w-full mt-4 py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm font-medium border border-[#e2b04a]/20 hover:bg-[#e2b04a]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Wallet className="w-4 h-4" />
            提现
          </button>
        </motion.div>

        {/* Tab */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-2">
          {(['all', 'pending', 'settled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                activeTab === tab
                  ? 'text-[#e2b04a] border-[#e2b04a]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'pending' ? '待结算' : '已结算'}
            </button>
          ))}
        </div>

        {/* 明细列表 */}
        <div className="space-y-2">
          {filtered.map((item, idx) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <div className="w-9 h-9 rounded-lg bg-[#e2b04a]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#e2b04a]/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.source}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-white/20" />
                    <span className="text-[11px] text-white/25">{item.date}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      item.status === 'settled'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status === 'settled' ? '已结算' : '待结算'}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#e2b04a]">+{item.amount}</span>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Coins className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">暂无收益记录</p>
            <p className="text-xs text-white/20 mt-1">创作故事和火花，获得盐粒收益</p>
          </div>
        )}
      </div>
    </div>
  );
}
