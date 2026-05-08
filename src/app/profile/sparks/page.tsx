'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Flame, Clock, ChevronLeft, ChevronRight,
  ArrowLeft, Trash2, ShieldAlert, ShieldCheck,
} from 'lucide-react';

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
  isPublic: boolean;
  reviewStatus?: string;
}

export default function MySparksPage() {
  const router = useRouter();
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setGuestId(localStorage.getItem('xh_user_id'));
  }, []);

  // 加载我的火花
  const loadSparks = useCallback(async () => {
    setLoading(true);
    try {
      const gid = guestId || localStorage.getItem('xh_user_id');
      const res = await fetch(`/api/sparks/mine`, {
        headers: gid ? { 'x-guest-id': gid } : {},
      });
      if (!res.ok) {
        console.error(`[MySparks] fetch failed: ${res.status}`);
        return;
      }
      const data = await res.json();
      if (mountedRef.current) setSparks(data.data?.list || []);
    } catch (e) {
      console.error('我的火花加载失败:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    loadSparks();
  }, [loadSparks]);

  // v8.1: 删除火花
  const handleDelete = async (spark: Spark) => {
    if (updatingId === spark.id) return;
    if (!confirm('确定要删除这个火花吗？')) return;
    setUpdatingId(spark.id);
    try {
      const res = await fetch(`/api/sparks/${spark.id}`, {
        method: 'DELETE',
        headers: {
          ...(localStorage.getItem('xh_user_id') ? { 'x-guest-id': localStorage.getItem('xh_user_id')! } : {}),
        },
      });
      const result = await res.json();
      if (result.success) {
        setSparks((prev) => prev.filter((s) => s.id !== spark.id));
      } else {
        alert(result.error?.message || '删除失败');
      }
    } catch (e) {
      console.error('删除火花失败:', e);
      alert('网络异常，删除失败');
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

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部导航 */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.push('/profile')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-white/90 text-center pr-10">我的火花</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
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
                <p className="text-sm text-white/30">还没有你的火花</p>
                <p className="text-xs text-white/20 mt-1">在对白中点击「火花」标记你的灵感</p>
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
                      {/* 热度值 */}
                      <span className="flex items-center gap-1 text-[11px] text-white/15">
                        <Flame className="w-3.5 h-3.5" />
                        {spark.hotScore || 0}
                      </span>

                      {/* v8.1: 公开状态标签（审核瞬时完成，无中间状态） */}
                      {spark.isPublic ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400/60 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          已公开
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-white/25 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3" />
                          私密
                        </span>
                      )}

                      {/* v8.1: 删除按钮 */}
                      <button
                        onClick={() => handleDelete(spark)}
                        disabled={updatingId === spark.id}
                        className="flex items-center gap-1 text-[10px] text-red-400/60 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full hover:bg-red-500/15 transition-colors"
                      >
                        {updatingId === spark.id ? (
                          <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        删除
                      </button>

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
