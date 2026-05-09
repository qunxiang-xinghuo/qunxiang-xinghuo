'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trash2, MessageSquare, Flame, BookOpen, Users,
  AlertTriangle, Clock, Search, UserPlus, Shield, ShieldOff,
  X, Check, Zap,
} from 'lucide-react';

interface AbnormalRoom {
  id: string;
  type: string;
  status: string;
  isAiRoom: boolean;
  title: string;
  createdAt: string;
  participantCount: number;
  messageCount: number;
  participants: string[];
  humanCount: number;
  aiCount: number;
  hasOnlineHuman: boolean;
  isLongRunning: boolean;
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

interface AdminUser {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  level: number;
  sparkCount: number;
  storyCount: number;
  reactionCount: number;
  createdAt: string;
}

type TabType = 'rooms' | 'sparks' | 'stories' | 'users';

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabType>('rooms');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [abnormalRooms, setAbnormalRooms] = useState<AbnormalRoom[]>([]);
  const [sparks, setSparks] = useState<SparkItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', email: '', isAdmin: false });
  const [userActionLoading, setUserActionLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'rooms') {
        const res = await fetch('/api/admin/rooms');
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setAbnormalRooms(data.data.abnormalRooms || []);
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
      } else if (tab === 'users') {
        const res = await fetch(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setUsers(data.data.list || []);
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

  // 用户搜索防抖
  useEffect(() => {
    if (tab !== 'users') return;
    const timer = setTimeout(() => { fetchData(); }, 400);
    return () => clearTimeout(timer);
  }, [search, tab]);

  const handleDelete = async (type: 'room' | 'spark' | 'story' | 'user', id: string) => {
    if (!confirm('确定删除？此操作不可恢复。')) return;
    setDeletingId(id);
    try {
      if (type === 'user') {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
          alert(data.error?.message || '删除失败');
        }
      } else {
        const res = await fetch('/api/admin/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id }),
        });
        const data = await res.json();
        if (data.success) {
          if (type === 'room') setAbnormalRooms((prev) => prev.filter((r) => r.id !== id));
          else if (type === 'spark') setSparks((prev) => prev.filter((s) => s.id !== id));
          else if (type === 'story') setStories((prev) => prev.filter((s) => s.id !== id));
        } else {
          alert(data.error?.message || '删除失败');
        }
      }
    } catch (e) {
      alert('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', name: '', email: '', isAdmin: false });
    setUserModalOpen(true);
  };

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({ username: user.username || '', password: '', name: user.name || '', email: user.email || '', isAdmin: user.isAdmin });
    setUserModalOpen(true);
  };

  const submitUser = async () => {
    if (!userForm.username || (!editingUser && !userForm.password)) {
      alert('用户名和密码必填');
      return;
    }
    setUserActionLoading(true);
    try {
      if (editingUser) {
        const body: any = { id: editingUser.id };
        if (userForm.username) body.username = userForm.username;
        if (userForm.name) body.name = userForm.name;
        if (userForm.email) body.email = userForm.email;
        if (userForm.password) body.password = userForm.password;
        body.isAdmin = userForm.isAdmin;
        const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.success) {
          setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.data.user } : u)));
          setUserModalOpen(false);
        } else {
          alert(data.error?.message || '更新失败');
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (data.success) {
          setUsers((prev) => [data.data.user, ...prev]);
          setUserModalOpen(false);
        } else {
          alert(data.error?.message || '创建失败');
        }
      }
    } catch (e) {
      alert('操作失败');
    } finally {
      setUserActionLoading(false);
    }
  };

  const filterBySearch = <T extends { title?: string; name?: string | null }>(list: T[]) => {
    if (!search.trim() || tab === 'users') return list;
    const kw = search.toLowerCase();
    return list.filter((item: any) =>
      (item.title && item.title.toLowerCase().includes(kw)) ||
      (item.name && item.name.toLowerCase().includes(kw))
    );
  };

  const tabs = [
    { key: 'rooms' as TabType, label: '异常活跃房间', icon: Zap },
    { key: 'sparks' as TabType, label: '公开火花', icon: Flame },
    { key: 'stories' as TabType, label: '公开故事', icon: BookOpen },
    { key: 'users' as TabType, label: '用户管理', icon: Users },
  ];

  const activeAiRooms = abnormalRooms.filter((r) => r.isAiRoom && r.status === 'active');
  const unclosedAiRooms = abnormalRooms.filter((r) => r.isAiRoom && r.status !== 'active');
  const nonAiRooms = abnormalRooms.filter((r) => !r.isAiRoom);

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
      <div className="shrink-0 flex gap-4 px-4 pt-3 pb-2 border-b border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors pb-1 border-b-2 whitespace-nowrap ${
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
      <div className="shrink-0 px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex-1">
          <Search className="w-3.5 h-3.5 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'users' ? '搜索用户名、昵称或邮箱...' : '搜索标题...'}
            className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 outline-none"
          />
        </div>
        {tab === 'users' && (
          <button
            onClick={openCreateUser}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm hover:bg-[#e2b04a]/20 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            新建
          </button>
        )}
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
          <div className="space-y-5">
            {/* 统计 */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/30">活跃AI房间</p>
                <p className="text-lg font-bold text-emerald-400">{activeAiRooms.length}</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/30">未关闭AI房间</p>
                <p className="text-lg font-bold text-amber-400">{unclosedAiRooms.length}</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <p className="text-[10px] text-white/30">真人房间</p>
                <p className="text-lg font-bold text-white/70">{nonAiRooms.length}</p>
              </div>
            </div>

            {/* 活跃AI房间 */}
            {activeAiRooms.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-emerald-400/70 mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  活跃AI房间 — 正在和刘看山聊天 ({activeAiRooms.length})
                </h3>
                <div className="space-y-2">
                  {activeAiRooms.map((room) => (
                    <RoomCard key={room.id} room={room} mounted={mounted} deletingId={deletingId} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {/* 未关闭AI房间 */}
            {unclosedAiRooms.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-amber-400/70 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  未关闭AI房间 — 用户已离开，房间未关 ({unclosedAiRooms.length})
                </h3>
                <div className="space-y-2">
                  {unclosedAiRooms.map((room) => (
                    <RoomCard key={room.id} room={room} mounted={mounted} deletingId={deletingId} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {/* 真人房间 */}
            {nonAiRooms.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  真人房间 — 该关但没关 ({nonAiRooms.length})
                </h3>
                <div className="space-y-2">
                  {nonAiRooms.map((room) => (
                    <RoomCard key={room.id} room={room} mounted={mounted} deletingId={deletingId} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )}

            {abnormalRooms.length === 0 && (
              <p className="text-xs text-white/15 py-8 text-center">暂无异常活跃房间</p>
            )}
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
        ) : tab === 'stories' ? (
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
        ) : (
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-xs text-white/15 py-4 text-center">暂无用户</p>
            ) : (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={mounted ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e2b04a]/20 to-orange-500/20 border border-[#e2b04a]/20 flex items-center justify-center text-xs text-[#e2b04a] font-bold">
                          {(user.name || user.username || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-white/80">
                            {user.name || user.username || '未命名'}
                            {user.isAdmin && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-[#e2b04a] bg-[#e2b04a]/10 px-1.5 py-0.5 rounded-full">
                                <Shield className="w-2.5 h-2.5" />管理员
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-white/25">@{user.username || '-'} · {user.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 ml-9">
                        <span className="text-[10px] text-white/20">Lv.{user.level}</span>
                        <span className="text-[10px] text-white/20">火花 {user.sparkCount}</span>
                        <span className="text-[10px] text-white/20">故事 {user.storyCount}</span>
                        <span className="text-[10px] text-white/20">{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete('user', user.id)}
                        disabled={deletingId === user.id}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 用户编辑/创建弹窗 */}
      <AnimatePresence>
        {userModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setUserModalOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[480px] bg-[#0c0c0e] border-t border-white/10 rounded-t-2xl sm:rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white/90">
                  {editingUser ? '编辑用户' : '新建用户'}
                </h3>
                <button onClick={() => setUserModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">用户名</label>
                  <input
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="用户名"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-[#e2b04a]/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">{editingUser ? '新密码（留空不修改）' : '密码'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? '留空不修改' : '初始密码'}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-[#e2b04a]/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">昵称</label>
                  <input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="显示名称"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-[#e2b04a]/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">邮箱</label>
                  <input
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="邮箱地址"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/80 placeholder:text-white/20 outline-none focus:border-[#e2b04a]/30"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/[0.03] text-[#e2b04a] focus:ring-[#e2b04a]/30"
                  />
                  <span className="text-sm text-white/60">设为管理员</span>
                </label>
              </div>
              <button
                onClick={submitUser}
                disabled={userActionLoading}
                className="w-full mt-5 py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] text-sm font-medium hover:bg-[#e2b04a]/20 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {userActionLoading ? '处理中...' : editingUser ? '保存修改' : '创建用户'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomCard({
  room,
  mounted,
  deletingId,
  onDelete,
}: {
  room: AbnormalRoom;
  mounted: boolean;
  deletingId: string | null;
  onDelete: (type: 'room', id: string) => void;
}) {
  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-white/[0.03] border border-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white/80 truncate">{room.title}</p>
            {room.isLongRunning && (
              <span className="text-[9px] text-red-400/60 bg-red-400/10 px-1.5 py-0.5 rounded-full">超2小时</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-white/20">{room.type}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400/60' : 'bg-amber-500/10 text-amber-400/60'
            }`}>{room.status}</span>
            {room.isAiRoom && (
              <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full">AI</span>
            )}
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
            {room.hasOnlineHuman && (
              <span className="text-[9px] text-emerald-400/60">● 在线</span>
            )}
          </div>
          {room.participants.length > 0 && (
            <p className="text-[10px] text-white/15 mt-1">{room.participants.join(', ')}</p>
          )}
        </div>
        <button
          onClick={() => onDelete('room', room.id)}
          disabled={deletingId === room.id}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
