'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, Heart, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface Spark {
  id: string;
  content: string;
  heat: number;
  createdAt: string;
  identity: string;
  messageId: string;
}

export default function SparksPage() {
  const router = useRouter();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [mySparks, setMySparks] = useState<Spark[]>([]);
  const [tab, setTab] = useState<'public' | 'mine'>('public');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // 公开火花墙（按热度排序）
        const res = await fetch('/api/sparks/public?limit=50');
        const data = await res.json();
        setSparks(data.data?.list || []);

        // 我的火花
        const myRes = await fetch('/api/sparks/mine');
        const myData = await myRes.json();
        setMySparks(myData.data?.list || []);
      } catch (e) {
        console.error('火花页加载失败:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="火花" subtitle="灵感碰撞的瞬间" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* Tab 切换 */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-3">
          <button
            onClick={() => setTab('public')}
            className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
              tab === 'public'
                ? 'text-[#e2b04a] border-[#e2b04a]'
                : 'text-white/30 border-transparent hover:text-white/50'
            }`}
          >
            公开火花
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
              tab === 'mine'
                ? 'text-[#e2b04a] border-[#e2b04a]'
                : 'text-white/30 border-transparent hover:text-white/50'
            }`}
          >
            我的火花
            {mySparks.length > 0 && (
              <span className="ml-1 text-[10px] bg-[#e2b04a]/20 text-[#e2b04a] px-1.5 rounded-full">{mySparks.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(tab === 'public' ? sparks : mySparks).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Flame className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30">还没有{tab === 'public' ? '公开火花' : '你的火花'}</p>
                <p className="text-xs text-white/20 mt-1">在对白中点击 标记为火花</p>
              </div>
            ) : (
              (tab === 'public' ? sparks : mySparks).map((spark, idx) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-sm text-white/80 leading-relaxed">{spark.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/25">{spark.identity || '匿名'}</span>
                      <span className="text-[11px] text-white/15">{new Date(spark.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#e2b04a]/40" />
                      <span className="text-[11px] text-white/30">{spark.heat || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
