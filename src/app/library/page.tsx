'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Flame, Clock, ChevronRight, Stethoscope, Scale, GraduationCap, Truck, Cpu, Coffee,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useRequireAuth } from '@/hooks/useRequireAuth';

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
  roomId: string | null;
  likedByMe: boolean;
  isMySpark: boolean;
}

type TabType = 'latest' | 'hottest';
type CategoryType = 'all' | '医疗' | '法律' | '教育' | '服务' | '技术' | '生活';

const CATEGORIES: { key: CategoryType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: '全部', icon: Flame },
  { key: '医疗', label: '医疗', icon: Stethoscope },
  { key: '法律', label: '法律', icon: Scale },
  { key: '教育', label: '教育', icon: GraduationCap },
  { key: '服务', label: '服务', icon: Truck },
  { key: '技术', label: '技术', icon: Cpu },
  { key: '生活', label: '生活', icon: Coffee },
];

export default function SparksPage() {
  const router = useRouter();
  const { isAuthenticated } = useRequireAuth();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [tab, setTab] = useState<TabType>('latest');
  const [category, setCategory] = useState<CategoryType>('all');
  const [loading, setLoading] = useState(true);
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setGuestId(localStorage.getItem('xh_user_id'));
  }, []);

  const loadSparks = useCallback(async () => {
    setLoading(true);
    try {
      const gid = guestId || localStorage.getItem('xh_user_id');
      const catParam = category !== 'all' ? `&category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`/api/sparks/public?limit=50&sort=${tab}${catParam}`, {
        headers: gid ? { 'x-guest-id': gid } : {},
      });
      const data = await res.json();
      setSparks(data.data?.list || []);
    } catch (e) {
      console.error('火花页加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [tab, category, guestId]);

  useEffect(() => {
    loadSparks();
  }, [loadSparks]);

  const toggleLike = async (spark: Spark) => {
    if (likeLoadingId === spark.id) return;
    if (spark.isMySpark) return;

    setLikeLoadingId(spark.id);
    try {
      const res = await fetch(`/api/sparks/${spark.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('xh_user_id') ? { 'x-guest-id': localStorage.getItem('xh_user_id')! } : {}),
        },
      });
      const result = await res.json();

      if (result.success) {
        const newLiked = result.data?.liked;
        const newHotScore = result.data?.hotScore ?? spark.hotScore;
        setSparks((prev) =>
          prev.map((s) =>
            s.id === spark.id
              ? { ...s, likedByMe: newLiked, hotScore: newHotScore }
              : s
          )
        );
      } else {
        // v8.1: 点赞失败时给用户反馈
        alert(result.error?.message || '点赞失败');
      }
    } catch (e) {
      console.error('点赞失败:', e);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleSparkClick = (spark: Spark) => {
    // v8.3-fix: 跳转到 spark-detail（公开只读），避免非参与者访问 /room 被 403 拒绝
    router.push(`/spark-detail/${spark.id}`);
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="火花" subtitle="灵感碰撞的瞬间" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-2">
        {/* v8.1: 职业分类横向标签栏 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-[#e2b04a]/15 text-[#e2b04a] border-[#e2b04a]/25'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/[0.06] hover:text-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-4 mb-4 border-b border-white/5 pb-3">
          {[
            { key: 'latest', label: '最新火花' },
            { key: 'hottest', label: '最热火花' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabType)}
              className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                tab === t.key
                  ? 'text-[#e2b04a] border-[#e2b04a]'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sparks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Flame className="w-10 h-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30">
                  {category === 'all' ? (tab === 'latest' ? '还没有最新火花' : '还没有最热火花') : `暂无「${category}」分类的火花`}
                </p>
                <p className="text-xs text-white/20 mt-1">
                  {category === 'all' ? '去对白中点击「火花」标记你的灵感' : '换个分类看看'}
                </p>
              </div>
            ) : (
              sparks.map((spark, idx) => (
                <motion.div
                  key={spark.id}
                  initial={mounted ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-[11px] text-[#e2b04a]/50 mb-1.5 font-medium">{spark.brainholeTitle}</p>

                  <div onClick={() => handleSparkClick(spark)} className="cursor-pointer">
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{spark.content}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/25">{spark.identity || '匿名'}</span>
                      <span className="text-[11px] text-white/15 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(spark.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {spark.isMySpark ? (
                        <span className="flex items-center gap-1 text-[11px] text-white/15">
                          <Flame className="w-3.5 h-3.5" />
                          {spark.hotScore || 0}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(spark);
                          }}
                          disabled={likeLoadingId === spark.id}
                          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all active:scale-95 ${
                            spark.likedByMe
                              ? 'bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25'
                              : 'bg-white/[0.03] text-white/30 border border-white/5 hover:bg-white/[0.06] hover:text-white/50'
                          }`}
                        >
                          {likeLoadingId === spark.id ? (
                            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Flame className={`w-3.5 h-3.5 ${spark.likedByMe ? 'fill-current drop-shadow-[0_0_4px_rgba(226,176,74,0.5)]' : ''}`} />
                          )}
                          {spark.hotScore || 0}
                        </button>
                      )}

                      {spark.roomId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSparkClick(spark);
                          }}
                          className="text-white/15 hover:text-white/30 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
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
