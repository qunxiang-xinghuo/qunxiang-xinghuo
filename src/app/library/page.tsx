'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Clock, ChevronRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

interface Spark {
  id: string;
  content: string;
  title: string;
  hotScore: number;
  createdAt: string;
  identity: string;
  brainholeTitle: string;
  sparkCount: number;
  messageCount: number;
  isPublic?: boolean;
}

export default function SparksPage() {
  const router = useRouter();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [mySparks, setMySparks] = useState<Spark[]>([]);
  const [latestSparks, setLatestSparks] = useState<Spark[]>([]);
  const [tab, setTab] = useState<'public' | 'mine'>('public');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // 公开火花墙（按热度排序）
        const res = await fetch('/api/sparks/public?limit=50');
        const data = await res.json();
        setSparks(data.data?.list || []);

        // 我的火花
        const guestId = localStorage.getItem('xh_user_id');
        const myRes = await fetch('/api/sparks/mine', {
          ...(guestId ? { headers: { 'x-guest-id': guestId } } : {}),
        });
        const myData = await myRes.json();
        setMySparks(myData.data?.list || []);

        // 最新火花（用于顶部展示）
        const latestRes = await fetch('/api/sparks/public?limit=6');
        const latestData = await latestRes.json();
        setLatestSparks(latestData.data?.list || []);
      } catch (e) {
        console.error('火花页加载失败:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 切换公开/私密状态
  const toggleVisibility = async (spark: Spark) => {
    if (updatingId === spark.id) return;
    setUpdatingId(spark.id);
    try {
      const guestId = localStorage.getItem('xh_user_id');
      const res = await fetch(`/api/sparks/${spark.id}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ isPublic: !spark.isPublic }),
      });
      const result = await res.json();
      if (result.success) {
        // 更新本地状态
        setMySparks((prev) =>
          prev.map((s) => (s.id === spark.id ? { ...s, isPublic: !spark.isPublic } : s))
        );
        // 如果设为公开，同步更新公开列表
        if (!spark.isPublic) {
          const updated = mySparks.find((s) => s.id === spark.id);
          if (updated) {
            setSparks((prev) => [updated, ...prev].sort((a, b) => b.hotScore - a.hotScore));
          }
        } else {
          setSparks((prev) => prev.filter((s) => s.id !== spark.id));
        }
      }
    } catch (e) {
      console.error('切换可见性失败:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="火花" subtitle="灵感碰撞的瞬间" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 最新火花展示 */}
        {latestSparks.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#74b9ff]" />
              <h2 className="text-sm font-semibold text-white/90">最新火花</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {latestSparks.slice(0, 4).map((spark, idx) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-3">{spark.content}</p>
                  <p className="text-[10px] text-white/25 mt-2 truncate">{spark.identity || '匿名用户'}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

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
              <span className="ml-1.5 text-[10px] bg-[#e2b04a]/20 text-[#e2b04a] px-1.5 py-0.5 rounded-full">
                {mySparks.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(tab === 'public' ? sparks : mySparks).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Flame className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30">
                  还没有{tab === 'public' ? '公开火花' : '你的火花'}
                </p>
                <p className="text-xs text-white/20 mt-1">
                  {tab === 'public' ? '去个人火花中设为公开吧' : '在对白中点击「火花」标记'}
                </p>
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
                  {/* 脑洞标题 */}
                  <p className="text-[11px] text-[#e2b04a]/50 mb-1.5 font-medium">{spark.brainholeTitle}</p>
                  {/* 内容 */}
                  <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{spark.content}</p>
                  {/* 底部信息 */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/25">{spark.identity || '匿名'}</span>
                      <span className="text-[11px] text-white/15 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(spark.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#e2b04a]/40" />
                        <span className="text-[11px] text-white/30">{spark.hotScore || 0}</span>
                      </span>
                      {/* 我的火花：公开/私密切换 */}
                      {tab === 'mine' && spark.isPublic !== undefined && (
                        <button
                          onClick={() => toggleVisibility(spark)}
                          disabled={updatingId === spark.id}
                          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                            spark.isPublic
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/[0.05] text-white/30 border border-white/5'
                          }`}
                        >
                          {updatingId === spark.id ? (
                            <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : spark.isPublic ? (
                            <>
                              <Eye className="w-3 h-3" />
                              公开
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              私密
                            </>
                          )}
                        </button>
                      )}
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
