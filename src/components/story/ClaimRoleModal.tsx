'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Sparkles } from 'lucide-react';

interface ClaimRoleModalProps {
  roleName: string;
  roleDescription: string;
  storyId: string;
  roleId: string;
  onClose: () => void;
  onClaimed: () => void;
}

export default function ClaimRoleModal({
  roleName,
  roleDescription,
  storyId,
  roleId,
  onClose,
  onClaimed,
}: ClaimRoleModalProps) {
  const [claimReason, setClaimReason] = useState('');
  const [identityTag, setIdentityTag] = useState('');
  const [performanceDirection, setPerformanceDirection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stories/${storyId}/roles/${roleId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimReason: claimReason.trim() || undefined,
          identityTag: identityTag.trim() || undefined,
          performanceDirection: performanceDirection.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        onClaimed();
        onClose();
      } else {
        setError(result.error?.message || '认领失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-sm bg-slate-900 rounded-2xl overflow-hidden border border-slate-600/20 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">认领角色</h3>
              <button onClick={onClose} className="p-2 rounded-full bg-slate-700/30 hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 mb-4">
                <p className="text-xs text-red-400 text-center">{error}</p>
              </div>
            )}

            <div className="bg-xh-gold/10 rounded-xl p-3 border border-xh-gold/20 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-xh-gold" />
                <span className="text-sm font-medium text-xh-gold">{roleName}</span>
              </div>
              <p className="text-xs text-slate-500">{roleDescription}</p>
            </div>

            <label className="text-xs text-slate-500 mb-1.5 block">身份标签</label>
            <input
              type="text"
              value={identityTag}
              onChange={(e) => setIdentityTag(e.target.value)}
              placeholder="例如：急诊科医生"
              className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 mb-3"
              maxLength={40}
            />

            <label className="text-xs text-slate-500 mb-1.5 block">演绎方向</label>
            <textarea
              value={performanceDirection}
              onChange={(e) => setPerformanceDirection(e.target.value)}
              placeholder="例如：理性与情感交织，关键时刻会为了患者打破规则..."
              className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none mb-3"
              rows={2}
              maxLength={150}
            />
            <p className="text-[10px] text-slate-600 mt-1 text-right">{performanceDirection.length}/150</p>

            <label className="text-xs text-slate-500 mb-1.5 block">扮演此角色的理由 / 一句话人设</label>
            <textarea
              value={claimReason}
              onChange={(e) => setClaimReason(e.target.value)}
              placeholder="例如：我是一名急诊科医生，面对生死抉择时总是理性与情感交织..."
              className="w-full bg-slate-700/30 border border-slate-600/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-xh-gold/40 resize-none"
              rows={2}
              maxLength={150}
            />
            <p className="text-[10px] text-slate-600 mt-1 text-right">{claimReason.length}/150</p>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-xh-gold to-xh-gold-dark text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  确认认领
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
