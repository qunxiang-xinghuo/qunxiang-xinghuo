'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trash2, Flame, BookOpen, Shield, Search,
  AlertTriangle, Clock, Users, Zap, Bot, UserPlus, X, Edit2,
} from 'lucide-react';

interface RoomItem {
  id: string;
  type: string;
  status: string;
  isAiRoom: boolean;
  title: string;
  createdAt: string;
  lastMessageAt: string | null;
  participantCount: number;
  onlineCount: number;
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

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  image: string | null;
  isAdmin: boolean;
  level: number;
  sparkCount: number;
  storyCount: number;
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

  const [activeAiRooms, setActiveAiRooms] = useState<RoomItem[]>([]);
  const [abnormalRooms, setAbnormalRooms] = useState<RoomItem[]>([]);
  const [sparks, setSparks] = useState<SparkItem[]>([]);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 用户管理弹窗
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm, setUserForm] = useState({ username: '', name: '', email: '', password: '', isAdmin: false });
  const [userFormLoading, setUserFormLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'rooms') {
        const res = await fetch('/api/admin/rooms');
        const data = await res.json();
        if (!data.success) { setError(data.error?.message || '加载失败'); return; }
        setActiveAiRooms(data.data.activeAiRooms || []);
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
        const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
        const res = await fetch(url);
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
  }, [tab, search]);

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
          if (type === 'room') {
            setActiveAiRooms((prev) => prev.filter((r) => r.id !== id));
            setAbnormalRooms((prev) => prev.filter((r) => r.id !== id));
          } else if (type === 'spark') {
            setSparks((prev) => prev.filter((s) => s.id !== id));
          } else if (type === 'story') {
            setStories((prev) => prev.filter((s) => s.id !== id));
          }
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

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) { alert('用户名必填'); return; }
    if (!editingUser && !userForm.password) { alert('密码必填'); return; }
    setUserFormLoading(true);
    try {
      const url = '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? JSON.stringify({ id: editingUser.id, username: userForm.username, name: userForm.name, password: userForm.password || undefined, isAdmin: userForm.isAdmin })
        : JSON.stringify({ username: userForm.username, name: userForm.name, email: userForm.email, password: userForm.password, isAdmin: userForm.isAdmin });
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json();
      if (data.success) {
        setShowUserForm(false);
        setEditingUser(null);
        setUserForm({ username: '', name: '', email: '', password: '', isAdmin: false });
        fetchData();
      } else {
        alert(data.error?.message || '保存失败');
      }
    } catch (e) {
      alert('保存失败');
    } finally {
      setUserFormLoading(false);
    }
  };

  const openEditUser = (user: UserItem) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      isAdmin: user.isAdmin,
    });
    setShowUserForm(true);
  };

  const filterBySearch = <T extends { title: string }>(list: T[]) => {
    if (!search.trim() || tab === 'users') return list;
    return list.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
  };

  const tabs = [
    { key: 'rooms' as TabType, label: '房间监控', icon: Zap },
    { key: 'sparks' as TabType, label: '公开火花', icon: Flame },
    { key: 'stories' as TabType, label: '公开故事', icon: BookOpen },
    { key: 'users' as TabType, label: '用户管理', icon: Shield },
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
      <div className="shrink-0 px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <Search className="w-3.5 h-3.5 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'users' ? '搜索用户名、邮箱...' : '搜索标题...'}
            className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/20 outline-none"
          />
          {tab === 'users' && (
            <button
              onClick={() => { setEditingUser(null); setUserForm({ username: '', name: '', email: '', password: '', isAdmin: false }); setShowUserForm(true); }}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25"
            >
              <UserPlus className="w-3 h-3" />
              新增
            </button>
          )}
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
            {/* 活跃 AI 房间 */}
            <div>
              <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                <Bot className="w-3 h-3 text-emerald-400" />
                活跃 AI 房间 ({activeAiRooms.length})
              </h3>
              {activeAiRooms.length === 0 ? (
                <p className="text-xs text-white/15 py-4 text-center">暂无活跃 AI 房间</p>
              ) : (
                <div className="space-y-2">
                  {filterBySearch(activeAiRooms).map((room) => (
                    <RoomCard key={room.id} room={room} mounted={mounted} deletingId={deletingId} onDelete={(id) => handleDelete('room', id)} />
                  ))}
                </div>
              )}
            </div>

            {/* 异常活跃房间 */}
            <div>
              <h3 className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#e2b04a]" />
                异常活跃房间 ({abnormalRooms.length})
              </h3>
              {abnormalRooms.length === 0 ? (
                <p className="text-xs text-white/15 py-4 text-center">暂无异常活跃房间</p>
              ) : (
                <div className="space-y-2">
                  {filterBySearch(abnormalRooms).map((room) => (
                    <RoomCard key={room.id} room={room} mounted={mounted} deletingId={deletingId} onDelete={(id) => handleDelete('room', id)} />
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
                <SparkCard key={spark.id} spark={spark} mounted={mounted} deletingId={deletingId} onDelete={(id) => handleDelete('spark', id)} />
              ))
            )}
          </div>
        ) : tab === 'stories' ? (
          <div className="space-y-2">
            {filterBySearch(stories).length === 0 ? (
              <p className="text-xs text-white/15 py-4 text-center">暂无公开故事</p>
            ) : (
              filterBySearch(stories).map((story) => (
                <StoryCard key={story.id} story={story} mounted={mounted} deletingId={deletingId} onDelete={(id) => handleDelete('story', id)} />
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
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[10px] text-white/50">
                          {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-white/80">{user.name || user.username || '未命名'}</span>
                        {user.isAdmin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#e2b04a]/10 text-[#e2b04a] border border-[#e2b04a]/20">管理员</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/20">
                        <span>{user.email || '无邮箱'}</span>
                        <span>Lv.{user.level}</span>
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{user.sparkCount}</span>
                        <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{user.storyCount}</span>
                        <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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

      {/* 用户表单弹窗 */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white/80">{editingUser ? '编辑用户' : '新增用户'}</h3>
              <button onClick={() => setShowUserForm(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">用户名 *</label>
                <input
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-[#e2b04a]/30"
                  placeholder="输入用户名"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">昵称</label>
                <input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-[#e2b04a]/30"
                  placeholder="输入昵称"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="text-[11px] text-white/30 mb-1 block">邮箱</label>
                  <input
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-[#e2b04a]/30"
                    placeholder="输入邮箱"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">密码 {editingUser ? '(留空不修改)' : '*'}</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none focus:border-[#e2b04a]/30"
                  placeholder={editingUser ? '留空不修改' : '输入密码'}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={userForm.isAdmin}
                  onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                设为管理员
              </label>
            </div>
            <button
              onClick={handleSaveUser}
              disabled={userFormLoading}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#e2b04a]/15 text-[#e2b04a] border border-[#e2b04a]/25 text-sm font-medium hover:bg-[#e2b04a]/25 disabled:opacity-30 transition-all"
            >
              {userFormLoading ? '保存中...' : '保存'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, mounted, deletingId, onDelete }: { room: RoomItem; mounted: boolean; deletingId: string | null; onDelete: (id: string) => void }) {
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
            {room.isAiRoom ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI</span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">真人</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-white/20">
              <Clock className="w-3 h-3" />
              {new Date(room.createdAt).toLocaleDateString('zh-CN')}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/20">
              <Users className="w-3 h-3" />
              {room.participantCount}人 ({room.onlineCount}在线)
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/20">
              <Flame className="w-3 h-3" />
              {room.messageCount}条
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(room.id)}
          disabled={deletingId === room.id}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function SparkCard({ spark, mounted, deletingId, onDelete }: { spark: SparkItem; mounted: boolean; deletingId: string | null; onDelete: (id: string) => void }) {
  return (
    <motion.div
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
          onClick={() => onDelete(spark.id)}
          disabled={deletingId === spark.id}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function StoryCard({ story, mounted, deletingId, onDelete }: { story: StoryItem; mounted: boolean; deletingId: string | null; onDelete: (id: string) => void }) {
  return (
    <motion.div
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
          onClick={() => onDelete(story.id)}
          disabled={deletingId === story.id}
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400/60 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
