'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Eye, Users, MessageCircle, ChevronRight, ArrowLeft, Radio } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface PublicRoom {
  id: string;
  type: string;
  status: string;
  brainhole: {
    id: string;
    title: string;
    scenario: string;
    category: string;
  } | null;
  actors: {
    userId: string;
    identity: string;
    role: string;
    isOnline: boolean;
  }[];
  spectatorCount: number;
  messageCount: number;
  createdAt: string;
}

export default function SpectatePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { isAuthenticated } = useRequireAuth();
  const { status: sessionStatus } = useSession();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // v8.0-login-fix: 统一认证门禁
  if (!isAuthenticated) {
    return <div className="h-screen bg-xh-primary" />;
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/rooms/public');
        const data = await res.json();
        if (data.success && data.data?.list) {
          setRooms(data.data.list);
          // 保存房间列表到 localStorage，用于 room 页面的滑动切换
          localStorage.setItem('xh_spectate_rooms', JSON.stringify(data.data.list.map((r: PublicRoom) => r.id)));
        } else {
          setError('加载失败');
        }
      } catch (e) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEnterRoom = async (roomId: string) => {
    // 先以观众身份加入房间
    try {
      const guestId = localStorage.getItem('xh_user_id');
      await fetch(`/api/rooms/${roomId}/spectate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({ identity: '观众' }),
      });
    } catch (e) {
      console.error('加入观众模式失败:', e);
    }
    router.push(`/spectate/${roomId}`);
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'ai_duet': return '人机交互';
      case 'duet': return '双人对白';
      case 'multi': return '多人组队';
      default: return '对白';
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'ai_duet': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'duet': return 'bg-[#e2b04a]/15 text-[#e2b04a] border-[#e2b04a]/20';
      case 'multi': return 'bg-[#74b9ff]/15 text-[#74b9ff] border-[#74b9ff]/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  return (
    <div className="flex flex-col min-h-full page-gradient">
      <TopBar title="观看模式" showBack />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-4">
        {/* 头部说明 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-[#ff6b6b]/5 border border-[#ff6b6b]/10 mb-6"
        >
          <div className="w-10 h-10 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-[#ff6b6b]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">实时围观公开房间</p>
            <p className="text-[11px] text-white/30 mt-0.5">点击进入房间，围观正在进行中的对白</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-white/30">{error}</p>
          </div>
        ) : rooms.length === 0 ? (
          <motion.div
            initial={mounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Radio className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-sm text-white/30">暂无公开房间</p>
            <p className="text-[11px] text-white/20 mt-1">等人开始对话后，这里会显示</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, idx) => (
              <motion.button
                key={room.id}
                initial={mounted ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => handleEnterRoom(room.id)}
                className="w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoomTypeColor(room.type)}`}>
                      {getRoomTypeLabel(room.type)}
                    </span>
                    {room.status === 'ongoing' && (
                      <span className="flex items-center gap-1 text-[10px] text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        进行中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/25">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {room.spectatorCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {room.messageCount}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-white/90 mb-1 truncate">
                  {room.brainhole?.title || '未命名房间'}
                </h3>
                <p className="text-[11px] text-white/30 line-clamp-1 mb-2">
                  {room.brainhole?.scenario || '暂无场景描述'}
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Users className="w-3 h-3 text-white/20 flex-shrink-0" />
                    <div className="flex gap-1 flex-wrap">
                      {room.actors.slice(0, 3).map((actor) => (
                        <span
                          key={actor.userId}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
                        >
                          {actor.identity}
                        </span>
                      ))}
                      {room.actors.length > 3 && (
                        <span className="text-[10px] text-white/25">+{room.actors.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
