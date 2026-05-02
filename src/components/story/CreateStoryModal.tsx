'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';

interface RoleInput {
  name: string;
  description: string;
  requirements: string;
}

interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
  const [title, setTitle] = useState('');
  const [worldview, setWorldview] = useState('');
  const [conflict, setConflict] = useState('');
  const [roles, setRoles] = useState<RoleInput[]>([
    { name: '', description: '', requirements: '' },
  ]);
  const [minActors, setMinActors] = useState(2);
  const [loading, setLoading] = useState(false);

  const addRole = () => {
    setRoles([...roles, { name: '', description: '', requirements: '' }]);
  };

  const removeRole = (index: number) => {
    if (roles.length <= 1) return;
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof RoleInput, value: string) => {
    const updated = [...roles];
    updated[index][field] = value;
    setRoles(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !worldview.trim() || !conflict.trim()) {
      alert('请填写完整的故事信息');
      return;
    }
    const validRoles = roles.filter((r) => r.name.trim());
    if (validRoles.length === 0) {
      alert('至少需要一个角色');
      return;
    }
    if (minActors > validRoles.length) {
      alert('最少启动人数不能大于角色总数');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          worldview: worldview.trim(),
          conflict: conflict.trim(),
          roles: validRoles,
        }),
      });
      const result = await res.json();
      if (result.success) {
        onCreated();
        onClose();
      } else {
        alert(result.error?.message || '创建失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-600/20 shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/15 shrink-0">
            <h3 className="text-base font-bold text-white">发起新故事</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-700/30 hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            {/* 故事标题 */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">故事标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：北京折叠·2035"
                className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40"
                maxLength={40}
              />
            </div>

            {/* 世界观 */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">世界观背景</label>
              <textarea
                value={worldview}
                onChange={(e) => setWorldview(e.target.value)}
                placeholder="描述这个故事发生的世界..."
                className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            {/* 核心冲突 */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">核心冲突</label>
              <textarea
                value={conflict}
                onChange={(e) => setConflict(e.target.value)}
                placeholder="故事的核心矛盾是什么？"
                className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none"
                rows={2}
                maxLength={150}
              />
            </div>

            {/* 最少启动人数 */}
            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">最少启动人数</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={roles.filter((r) => r.name.trim()).length || 5}
                  value={minActors}
                  onChange={(e) => setMinActors(parseInt(e.target.value))}
                  className="flex-1 accent-xh-gold"
                />
                <span className="text-sm text-white/70 w-8 text-center">{minActors}</span>
              </div>
              <p className="text-[10px] text-slate-700 mt-1">所有角色被认领并审核通过后，导演可启动故事</p>
            </div>

            {/* 角色列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-500">角色设定</label>
                <button
                  onClick={addRole}
                  className="flex items-center gap-1 text-[10px] text-xh-gold hover:text-xh-gold/80 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  添加角色
                </button>
              </div>
              <div className="space-y-3">
                {roles.map((role, index) => (
                  <div key={index} className="bg-slate-800/40 rounded-xl p-3 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={role.name}
                        onChange={(e) => updateRole(index, 'name', e.target.value)}
                        placeholder="角色名"
                        className="flex-1 bg-slate-700/30 border border-slate-600/20 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40"
                      />
                      {roles.length > 1 && (
                        <button
                          onClick={() => removeRole(index)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={role.description}
                      onChange={(e) => updateRole(index, 'description', e.target.value)}
                      placeholder="角色设定（一句话）"
                      className="w-full bg-slate-700/30 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 mb-2"
                    />
                    <input
                      type="text"
                      value={role.requirements}
                      onChange={(e) => updateRole(index, 'requirements', e.target.value)}
                      placeholder="角色需求（可选）"
                      className="w-full bg-slate-700/30 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="shrink-0 px-5 py-4 border-t border-slate-700/15">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  发起故事
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
