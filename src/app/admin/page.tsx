'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trash2, MessageSquare, Flame, BookOpen,
  AlertTriangle, Clock, Users, Zap, Search,
} from 'lucide-react';

interface ZombieRoom {
  id: string;
  type: string;
  status: string;
  isAiRoom: boolean;
  title: string;
  createdAt: string;
  participantCount: number;
  messageCount: number;
  participants: string[];
}

interface SparkItem {
  id: string;
  title: string;
  summary: string;
  hotScore: number;
  messageCount: number;
  ownerName: string;
  ownerId: string;
  roomType: string | null;
  createdAt: string;
}

interface StoryItem {
  id: string;
  title: string;
  eraBackground: string;
  status: string;
  hotScore: number;
  creatorName: string;
  creatorId: string | null;
  roleCount: number;
  roomCount: number;
  createdAt: string;
}

type TabType = 'rooms' | 'sparks' | 'stories';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabType>('rooms');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [zombieAiRooms, setZombieAiRooms] = useState<ZombieRoom[]>([]);
  const [orphanRooms, setOrphanRooms] = useState<ZombieRoom[]>([]);
  const [sparks, setSparks] = useState<SparkItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'rooms') {
        const res = await fetch('/api/admin/rooms');
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setZombieAiRooms(data.data.zombieAiRooms || []);
        setOrphanRooms(data.data.orphanRooms || []);
      } else if (tab === 'sparks') {
        const res = await fetch('/api/admin/sparks');
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setSparks(data.data.list || []);
      } else if (tab === 'stories') {
        const res = await fetch('/api/admin/stories');
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setStories(data.data.list || []);
      }
    } catch (e) {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleDelete = async (type: 'room' | 'spark' | 'story', id: string) => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'room') {
          setZombieAiRooms((prev) => prev.filter((r) => r.id !== id));
          setOrphanRooms((prev) => prev.filter((r) => r.id !== id));
        } else if (type === 'spark') {
          setSparks((prev) => prev.filter((s) => s.id !== id));
        } else if (type === 'story') {
          setStories((prev) => prev.filter((s) => s.id !== id));
        }
      } else {
        alert(data.error?.message || '删除失败');
      }
    } catch (e) {
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const filterBySearch = <T extends { title: string }>(list: T[]) => {
    if (!search.trim()) return list;
    return list.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  };

  const tabs = [
    { key: 'rooms' as TabType, label: '僵尸房间', icon: Zap },
    { key: 'sparks' as TabType, label: '公开火花', icon: Flame },
    { key: 'stories' as TabType, label: '公开故事', icon: BookOpen },
  ];

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.push('/profile')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-[#e2b04a]">管理员后台</h1>
            <p className="text-[11px] text-white/30">清理与管理</p>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="shrink-0 flex gap-4 px-4 pt-3 pb-2 border-b border-white/5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 ${
                tab === t.key ? 'text-[#e2b04a] border-[#e2b04a]' : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 搜索 */}
      <div className="shrink-0 px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <Search className="w-3.5 h-3.5 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题..."
            className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 outline-none"
          />
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 pt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="w-8 h-8 text-red-400/30 mb-2" />
            <p className="text-sm text-white/30">{error}</p>
          </div>
        ) : tab === 'rooms' ? (
          <div className="space-y-4">
            {/* AI 僵尸房间 */}
            <div>
              <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#e2b04a]" />
                AI 僵尸房间 ({zombieAiRooms.length})
              </h3>
              {zombieAiRooms.length === 0 ? (
                <p className="text-xs text-white/15 py-4 text-center">暂无僵尸 AI 房间</p>
              ) : (
                <div className="space-y-2">
                  {filterBySearch(zombieAiRooms).map((room) => (
                    <motion.div
                      key={room.id}
                      initial={mounted ? { opacity: 0, y: 6 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate">{room.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-white/20">
                              <Clock className="w-3 h-3" />
                              {new Date(room.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-white/20">
                              <MessageSquare className="w-3 h-3" />
                              {room.messageCount}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-white/20">
                              <Users className="w-3 h-3" />
                              {room.participantCount}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete('room', room.id)}
                          disabled={deletingId === room.id}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 孤儿房间 */}
            <div>
              <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3 text-white/30" />
                孤儿房间 ({orphanRooms.length})
              </h3>
              {orphanRooms.length === 0 ? (
                <p className="text-xs text-white/15 py-4 text-center">暂无孤儿房间</p>
              ) : (
                <div className="space-y-2">
                  {filterBySearch(orphanRooms).map((room) => (
                    <motion.div
                      key={room.id}
                      initial={mounted ? { opacity: 0, y: 6 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate">{room.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-white/20">{room.type}</span>
                            <span className="text-[10px] text-white/20">{room.status}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete('room', room.id)}
                          disabled={deletingId === room.id}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : tab === 'sparks' ? (
          <div className="space-y-2">
            {filterBySearch(sparks).length === 0 ? (
              <p className="text-xs text-white/15 py-4 text-center">暂无公开火花</p>
            ) : (
              filterBySearch(sparks).map((spark) => (
                <motion.div
                  key={spark.id}
                  initial={mounted ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{spark.title}</p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{spark.summary}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-white/20">{spark.ownerName}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-[#e2b04a]/30">
                          <Flame className="w-3 h-3" />
                          {spark.hotScore}
                        </span>
                        <span className="text-[10px] text-white/15">{spark.roomType || 'duet'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete('spark', spark.id)}
                      disabled={deletingId === spark.id}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filterBySearch(stories).length === 0 ? (
              <p className="text-xs text-white/15 py-4 text-center">暂无公开故事</p>
            ) : (
              filterBySearch(stories).map((story) => (
                <motion.div
                  key={story.id}
                  initial={mounted ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{story.title}</p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{story.eraBackground}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-white/20">{story.creatorName}</span>
                        <span className="text-[10px] text-white/20">{story.status}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-[#e2b04a]/30">
                          <Flame className="w-3 h-3" />
                          {story.hotScore}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete('story', story.id)}
                      disabled={deletingId === story.id}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
