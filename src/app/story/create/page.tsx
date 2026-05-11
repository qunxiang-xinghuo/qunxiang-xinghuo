'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, X, ScrollText, Clock, Users, AlertCircle,
  CheckCircle2, ChevronRight, Sparkles,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface RoleInput {
  id: string;
  name: string;
  description: string;
  openingInfo: string;
}

const CATEGORIES = ['古风', '民国', '现代', '悬疑', '科幻', '职场'];

export default function CreateStoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { isAuthenticated } = useRequireAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 表单数据
  const [title, setTitle] = useState('');
  const [eraBackground, setEraBackground] = useState('');
  const [storySummary, setStorySummary] = useState('');
  const [category, setCategory] = useState('现代');
  const [roles, setRoles] = useState<RoleInput[]>([
    { id: 'r1', name: '', description: '', openingInfo: '' },
    { id: 'r2', name: '', description: '', openingInfo: '' },
  ]);
  const roleIdCounter = useRef(3);

  if (!isAuthenticated) return <div className="h-screen bg-xh-primary" />;

  const addRole = () => {
    if (roles.length >= 6) return;
    setRoles([...roles, { id: `r${roleIdCounter.current++}`, name: '', description: '', openingInfo: '' }]);
  };

  const removeRole = (idx: number) => {
    if (roles.length <= 2) return;
    setRoles(roles.filter((_, i) => i !== idx));
  };

  const updateRole = (idx: number, field: keyof RoleInput, value: string) => {
    setRoles((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!title.trim() || title.length < 2) return false;
      if (!eraBackground.trim()) return false;
      if (!storySummary.trim() || storySummary.length < 20) return false;
      return true;
    }
    if (s === 2) {
      return roles.every((r) => r.name.trim() && r.description.trim() && r.openingInfo.trim());
    }
    return true;
  };

  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          eraBackground: eraBackground.trim(),
          storySummary: storySummary.trim(),
          category,
          maxCharacters: roles.length,
          roles: roles.map((r, i) => ({ name: r.name, description: r.description, openingInfo: r.openingInfo, sortOrder: i })),
        }),
      });
      const data = await res.json();
      if (!isMounted.current) return;
      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || '提交失败');
      }
    } catch (e) {
      if (!isMounted.current) return;
      alert('网络错误，请稍后重试');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  // 提交成功页面
  if (submitted) {
    return (
      <div className="flex flex-col min-h-full page-gradient items-center justify-center px-6">
        <motion.div
          initial={mounted ? { scale: 0.8, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#00b894]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#00b894]" />
          </div>
          <h2 className="text-lg font-bold text-white/90 mb-2">故事已提交审核</h2>
          <p className="text-sm text-white/40 mb-1">你的故事「{title}」已进入审核队列</p>
          <p className="text-xs text-white/30 mb-6">审核通过后将在故事大厅上线，通常需要 1-2 个工作日</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/my-stories?tab=created')}
              className="w-full py-2.5 rounded-xl bg-[#D4B830]/15 text-[#D4B830] text-sm font-medium border border-[#D4B830]/20"
            >
              查看我发起的故事
            </button>
            <button
              onClick={() => router.push('/story-hall')}
              className="w-full py-2.5 rounded-xl bg-white/[0.05] text-white/50 text-sm border border-white/10"
            >
              去故事大厅
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部栏 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <span className="text-base font-semibold text-white/90">发起故事</span>
          <span className="text-[10px] text-white/20 ml-auto">步骤 {step}/2</span>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex px-6 py-3 gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full bg-[#D4B830]"
              initial={mounted ? { width: '0%' } : false}
              animate={{ width: s <= step ? '100%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20 pt-2">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={mounted ? { opacity: 0, x: 20 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <ScrollText className="w-4 h-4 text-[#D4B830]" />
                <h2 className="text-sm font-semibold text-white/90">故事基本信息</h2>
              </div>

              {/* 标题 */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">故事标题 *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给故事起一个吸引人的标题"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30"
                />
              </div>

              {/* 时代背景 */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">时代背景 *</label>
                <input
                  value={eraBackground}
                  onChange={(e) => setEraBackground(e.target.value)}
                  placeholder="如：1937年，南京 / 2026年，上海"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30"
                />
              </div>

              {/* 分类 */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">分类</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        category === c
                          ? 'bg-[#D4B830]/15 text-[#D4B830] border-[#D4B830]/30'
                          : 'bg-white/[0.03] text-white/40 border-white/10 hover:bg-white/[0.06]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* 故事简介 */}
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">故事简介 *</label>
                <textarea
                  value={storySummary}
                  onChange={(e) => setStorySummary(e.target.value)}
                  placeholder="用一段话概括这个故事的核心冲突和悬念..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30 resize-none"
                />
                <p className="text-[10px] text-white/20 mt-1 text-right">{storySummary.length} 字</p>
              </div>

              {/* 提示 */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4B830]/50 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/30 leading-relaxed">
                    好的故事简介应该包含：时间、地点、核心冲突、悬念。不要透露结局。
                  </p>
                </div>
              </div>

              <button
                onClick={() => validateStep(1) && setStep(2)}
                disabled={!validateStep(1)}
                className="w-full py-3 rounded-xl bg-[#D4B830]/15 text-[#D4B830] text-sm font-medium border border-[#D4B830]/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                下一步：设定角色
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={mounted ? { opacity: 0, x: 20 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#D4B830]" />
                <h2 className="text-sm font-semibold text-white/90">角色设定</h2>
                <span className="text-[10px] text-white/20 ml-auto">{roles.length}/6 角色</span>
              </div>

              {roles.map((role, idx) => (
                <motion.div
                  key={role.id}
                  initial={mounted ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 font-medium">角色 {idx + 1}</span>
                    {roles.length > 2 && (
                      <button onClick={() => removeRole(idx)} className="p-1 rounded hover:bg-white/5">
                        <X className="w-3.5 h-3.5 text-white/20" />
                      </button>
                    )}
                  </div>
                  <input
                    value={role.name}
                    onChange={(e) => updateRole(idx, 'name', e.target.value)}
                    placeholder="角色名称"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30"
                  />
                  <input
                    value={role.description}
                    onChange={(e) => updateRole(idx, 'description', e.target.value)}
                    placeholder="角色设定（身份、性格、动机）"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30"
                  />
                  <textarea
                    value={role.openingInfo}
                    onChange={(e) => updateRole(idx, 'openingInfo', e.target.value)}
                    placeholder="开场信息（该角色进入场景时知道什么、不知道什么）"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#D4B830]/30 resize-none"
                  />
                </motion.div>
              ))}

              {roles.length < 6 && (
                <button
                  onClick={addRole}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-white/30 text-sm hover:bg-white/[0.02] hover:text-white/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加角色
                </button>
              )}

              {/* 提示 */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#D4B830]/50 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/30 leading-relaxed">
                    每个角色的开场信息应该包含「知道什么」和「不知道什么」的悬念设计。角色之间信息不对称是对白的驱动力。
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/[0.05] text-white/50 text-sm border border-white/10"
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!validateStep(2) || submitting}
                  className="flex-1 py-3 rounded-xl bg-[#D4B830]/15 text-[#D4B830] text-sm font-medium border border-[#D4B830]/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-[#D4B830]/30 border-t-[#D4B830] rounded-full animate-spin" />
                  ) : (
                    <>
                      <ScrollText className="w-3.5 h-3.5" />
                      提交审核
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
