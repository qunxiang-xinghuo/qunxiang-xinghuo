'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Flame, TrendingUp, Clock, ChevronRight, Eye, EyeOff,
  Sparkles, Heart,
} from 'lucide-react';
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
  roomId: string | null;
  likedByMe: boolean;
  isMySpark: boolean;
  isPublic?: boolean;
}

type SortType = 'latest' | 'hottest';

export default function SparksPage() {
  const router = useRouter();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [mySparks, setMySparks] = useState<Spark[]>([]);
  const [latestSparks, setLatestSparks] = useState<Spark[]>([]);
  const [tab, setTab] = useState<'public' | 'mine'>('public');
  const [sort, setSort] = useState<SortType>('latest');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);

  const guestId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;

  const loadSparks = useCallback(async () => {
    setLoading(true);
    try {
      // 公开火花墙（支持排序）
      const res = await fetch(`/api/sparks/public?limit=50&sort=${sort}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const data = await res.json();
      const list = data.data?.list || [];
      setSparks(list);

      // 最新火花展示（始终取最新的4条，不受排序影响）
      const latestRes = await fetch('/api/sparks/public?limit=6&sort=latest', {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const latestData = await latestRes.json();
      setLatestSparks(latestData.data?.list?.slice(0, 4) || []);

      // 我的火花
      const myRes = await fetch(`/api/sparks/mine?sort=${sort}`, {
        headers: guestId ? { 'x-guest-id': guestId } : {},
      });
      const myData = await myRes.json();
      setMySparks(myData.data?.list || []);
    } catch (e) {
      console.error('火花页加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [sort, guestId]);

  useEffect(() => {
    loadSparks();
  }, [loadSparks]);

  // 点赞/取消点赞
  const toggleLike = async (spark: Spark) => {
    if (likeLoadingId === spark.id) return;
    if (spark.isMySpark) return; // 不能给自己的火花点赞

    setLikeLoadingId(spark.id);
    try {
      const res = await fetch(`/api/sparks/${spark.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
      });
      const result = await res.json();

      if (result.success) {
        const newLiked = result.data?.liked;
        const newHotScore = result.data?.hotScore ?? spark.hotScore;

        // 更新公开火花列表
        setSparks((prev) =>
          prev.map((s) =>
            s.id === spark.id
              ? { ...s, likedByMe: newLiked, hotScore: newHotScore }
              : s
          )
        );

        // 同步更新最新火花展示
        setLatestSparks((prev) =>
          prev.map((s) =>
            s.id === spark.id
              ? { ...s, likedByMe: newLiked, hotScore: newHotScore }
              : s
          )
        );
      }
    } catch (e) {
      console.error('点赞失败:', e);
    } finally {
      setLikeLoadingId(null);
    }
  };

  // 切换公开/私密状态
  const toggleVisibility = async (spark: Spark) => {
    if (updatingId === spark.id) return;
    setUpdatingId(spark.id);
    try {
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
        setMySparks((prev) =>
          prev.map((s) => (s.id === spark.id ? { ...s, isPublic: !spark.isPublic } : s))
        );
        // 刷新公开列表以同步
        loadSparks();
      }
    } catch (e) {
      console.error('切换可见性失败:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // 点击火花查看详情
  const handleSparkClick = (spark: Spark) => {
    if (spark.roomId) {
      router.push(`/room/${spark.roomId}`);
    }
  };

  const currentList = tab === 'public' ? sparks : mySparks;

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <PageHeader title="火花" subtitle="灵感碰撞的瞬间" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 最新火花展示 */}
        {latestSparks.length > 0 && tab === 'public' && (
          <section className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#74b9ff]" />
              <h2 className="text-sm font-semibold text-white/90">最新火花</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {latestSparks.map((spark, idx) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => handleSparkClick(spark)}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-xs text-white/70 leading-relaxed line-clamp-3">{spark.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] text-white/25 truncate">{spark.identity || '匿名用户'}</p>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#e2b04a]/40" />
                      <span className="text-[10px] text-white/25">{spark.hotScore || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 切换 */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex gap-4">
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

          {/* 排序切换（仅公开火花） */}
          {tab === 'public' && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setSort('latest')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${
                  sort === 'latest'
                    ? 'bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25'
                    : 'bg-white/[0.03] text-white/30 border border-white/5 hover:text-white/50'
                }`}
              >
                <Clock className="w-3 h-3" />
                最新
              </button>
              <button
                onClick={() => setSort('hottest')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${
                  sort === 'hottest'
                    ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/25'
                    : 'bg-white/[0.03] text-white/30 border border-white/5 hover:text-white/50'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                最热
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.length === 0 ? (
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
              currentList.map((spark, idx) => (
                <motion.div
                  key={spark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                >
                  {/* 脑洞标题 */}
                  <p className="text-[11px] text-[#e2b04a]/50 mb-1.5 font-medium">{spark.brainholeTitle}</p>

                  {/* 内容（可点击跳转详情） */}
                  <div
                    onClick={() => handleSparkClick(spark)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{spark.content}</p>
                  </div>

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
                      {/* 点赞按钮 */}
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
                              ? 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/25'
                              : 'bg-white/[0.03] text-white/30 border border-white/5 hover:bg-white/[0.06] hover:text-white/50'
                          }`}
                        >
                          {likeLoadingId === spark.id ? (
                            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : spark.likedByMe ? (
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Flame className="w-3.5 h-3.5" />
                          )}
                          {spark.hotScore || 0}
                        </button>
                      )}

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

                      {/* 详情箭头 */}
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
