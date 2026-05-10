'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, User, Edit3, Check, Zap, Flame, ArrowRight, Clock } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

interface BrainholeItem {
  id: string;
  title: string;
  scenario: string;
  category: string;
  hotScore: number;
}

interface IdentityOption {
  type: 'zhihu' | 'ai' | 'custom';
  label: string;
  desc: string;
}

const options: IdentityOption[] = [
  { type: 'zhihu', label: '知乎身份', desc: '使用已认证的职业身份' },
  { type: 'ai', label: 'AI随机生成', desc: '系统分配一个有趣的角色' },
  { type: 'custom', label: '自定义角色', desc: '输入你想要的身份和简介' },
];

const aiIdentities = [
  '急诊科医生', '辩护律师', '初中班主任', '产品经理', '外卖骑手',
  '幼儿园园长', '心理咨询师', '记者', '消防员', '护士',
  '创业者', '退休教师', '北漂程序员', '全职妈妈', '酒吧老板',
  '急诊护士', '拆迁办主任', '民宿老板', '法医', '社工',
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  medical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  legal: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  workplace: { bg: 'bg-xh-gold/10', border: 'border-xh-gold/20', text: 'text-xh-gold' },
  life: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  education: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  tech: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  emergency: { bg: 'bg-xh-gold/10', border: 'border-xh-gold/20', text: 'text-xh-gold' },
  general: { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  medical: '医疗', legal: '法律', workplace: '职场', life: '生活',
  education: '教育', tech: '技术', emergency: '紧急', general: '综合',
};

function MultiMatchContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const searchParams = useSearchParams();
  const preselectedBrainholeId = searchParams.get('brainholeId');

  const [brainholes, setBrainholes] = useState<BrainholeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrainhole, setSelectedBrainhole] = useState<BrainholeItem | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);

  const [selectedType, setSelectedType] = useState<'zhihu' | 'ai' | 'custom'>('zhihu');
  const [zhihuIdentities, setZhihuIdentities] = useState<string[]>([]);
  const [selectedZhihuId, setSelectedZhihuId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState('');

  // 加载脑洞
  useEffect(() => {
    fetch('/api/brainholes/bubble?limit=20')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.brainholes) {
          const list = res.data.brainholes.map((b: any) => ({
            id: String(b.id),
            title: String(b.title),
            scenario: String(b.scenario || '').slice(0, 100),
            category: String(b.category || 'general'),
            hotScore: b.hotScore || 50,
          }));
          setBrainholes(list);
          if (preselectedBrainholeId) {
            const pre = list.find((b: BrainholeItem) => b.id === preselectedBrainholeId);
            if (pre) setSelectedBrainhole(pre);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [preselectedBrainholeId]);

  // 加载知乎身份
  useEffect(() => {
    fetch('/api/users/identities')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const labels = res.data.map((i: any) => i.label);
          setZhihuIdentities(labels);
          if (labels.length > 0) setSelectedZhihuId(labels[0]);
        }
      })
      .catch(() => {});
    setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]);
  }, []);

  const handleSelectBrainhole = (bh: BrainholeItem) => {
    setSelectedBrainhole(bh);
    setShowIdentity(true);
  };

  const handleConfirm = async () => {
    let identity = '';
    if (selectedType === 'zhihu') identity = selectedZhihuId || '匿名用户';
    else if (selectedType === 'ai') identity = aiGenerated;
    else identity = customLabel.trim() || '自定义角色';

    const stableUserId = localStorage.getItem('xh_user_id') || `guest-${Date.now()}`;
    localStorage.setItem('xh_user_id', stableUserId);
    localStorage.setItem('xh_multi_identity', identity);
    if (selectedBrainhole) {
      localStorage.setItem('xh_multi_brainhole', JSON.stringify(selectedBrainhole));
    }
    localStorage.removeItem('xh_multi_match_id');

    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brainholeId: selectedBrainhole?.id,
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'multi',
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.matchId) {
        localStorage.setItem('xh_multi_match_id', result.data.matchId);
        router.push(`/multi-waiting?matchId=${result.data.matchId}`);
      } else {
        setMatchError(result.message || '匹配请求失败');
        setIsMatching(false);
      }
    } catch (err) {
      setMatchError('网络错误，请重试');
      setIsMatching(false);
    }
  };

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="快速组队" showBack onBack={() => router.back()} />

      {/* 标题 */}
      <div className="shrink-0 px-5 pt-5 pb-2">
        <h2 className="text-lg font-bold text-slate-100 mb-1">选一个脑洞，开启群像共创</h2>
        <p className="text-xs text-slate-500">系统会为你匹配一群同样选中它的陌生人</p>
      </div>

      {/* 脑洞列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
          </div>
        ) : brainholes.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">暂无可用脑洞</p>
            <p className="text-slate-600 text-xs mt-1">请稍后再试</p>
          </div>
        ) : (
          brainholes.map((bh, index) => {
            const cat = CATEGORY_COLORS[bh.category] || CATEGORY_COLORS.general;
            const catLabel = CATEGORY_LABELS[bh.category] || bh.category;
            const isSelected = selectedBrainhole?.id === bh.id;
            return (
              <motion.div
                key={bh.id}
                initial={mounted ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleSelectBrainhole(bh)}
                className={`relative rounded-xl p-3.5 cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-xh-gold/40 bg-xh-gold/8'
                    : 'border-slate-700/15 bg-slate-800/30 hover:border-slate-600/25 hover:bg-slate-700/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.border} border flex items-center justify-center shrink-0`}>
                    <Flame className={`w-4 h-4 ${cat.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{bh.title}</h4>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-xh-gold flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{bh.scenario}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.text} ${cat.border} border font-medium`}>
                        {catLabel}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Flame className="w-3 h-3 text-xh-gold" />
                        {bh.hotScore}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 身份选择弹窗 */}
      {showIdentity && selectedBrainhole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <motion.div
            initial={mounted ? { y: '100%' } : false}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-md bg-[#0f1525] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto border border-slate-700/20"
          >
            {/* 已选脑洞 */}
            <div className="p-3 rounded-xl bg-xh-gold/8 border border-xh-gold/15 mb-4">
              <p className="text-[10px] text-slate-500 mb-1">已选脑洞</p>
              <p className="text-sm font-semibold text-slate-100">{selectedBrainhole.title}</p>
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-3">在这次群像中，你是谁？</h3>

            <div className="space-y-2.5 mb-4">
              {options.map((option) => (
                <div
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`relative rounded-xl p-3.5 cursor-pointer transition-all border ${
                    selectedType === option.type
                      ? 'border-xh-gold/40 bg-xh-gold/8'
                      : 'border-slate-700/15 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selectedType === option.type ? 'bg-xh-gold/15' : 'bg-slate-700/30'
                    }`}>
                      {option.type === 'zhihu' && <User className="w-4 h-4 text-xh-gold" />}
                      {option.type === 'ai' && <Sparkles className="w-4 h-4 text-violet-400" />}
                      {option.type === 'custom' && <Edit3 className="w-4 h-4 text-xh-gold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{option.label}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedType === option.type ? 'border-xh-gold bg-xh-gold' : 'border-slate-600'
                        }`}>
                          {selectedType === option.type && <Check className="w-2.5 h-2.5 text-slate-900" strokeWidth={4} />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">{option.desc}</p>
                    </div>
                  </div>

                  {selectedType === option.type && (
                    <motion.div initial={mounted ? { height: 0, opacity: 0 } : false} animate={{ height: 'auto', opacity: 1 }} className="mt-2.5 pt-2.5 border-t border-slate-700/15">
                      {option.type === 'zhihu' && (
                        <div className="space-y-1.5">
                          {zhihuIdentities.length === 0 ? (
                            <p className="text-xs text-slate-500">暂无认证身份，将使用默认身份</p>
                          ) : (
                            zhihuIdentities.map((id) => (
                              <button key={id} onClick={(e) => { e.stopPropagation(); setSelectedZhihuId(id); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                                  selectedZhihuId === id ? 'bg-xh-gold/12 text-xh-gold border border-xh-gold/20' : 'bg-slate-700/20 text-slate-500 hover:bg-slate-700/30'
                                }`}>
                                {id}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      {option.type === 'ai' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/8 rounded-lg border border-violet-500/15">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span className="text-xs text-violet-300">{aiGenerated}</span>
                          <button onClick={(e) => { e.stopPropagation(); setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]); }}
                            className="ml-auto text-[10px] text-violet-400 hover:text-violet-300">换一个</button>
                        </div>
                      )}
                      {option.type === 'custom' && (
                        <div>
                          <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                            placeholder="例如：急诊科护士、北漂创业者..."
                            className="w-full bg-slate-700/20 border border-slate-600/20 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-xh-gold/40"
                            maxLength={20} onClick={(e) => e.stopPropagation()} />
                          <p className="text-[10px] text-slate-600 mt-1 text-right">{customLabel.length}/20</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

            {matchError && (
              <p className="text-xs text-red-400 text-center bg-red-500/10 rounded-lg py-2 mb-3">{matchError}</p>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => { setShowIdentity(false); setMatchError(''); }}
                className="flex-1 py-3 rounded-xl bg-slate-700/30 text-slate-400 text-sm font-medium hover:bg-slate-700/50 transition-colors">
                取消
              </button>
              <button onClick={handleConfirm} disabled={isMatching}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-xh-gold to-xh-gold-dark text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {isMatching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Zap className="w-4 h-4" />开始匹配</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function MultiMatchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full page-gradient items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-xh-gold rounded-full animate-spin" />
      </div>
    }>
      <MultiMatchContent />
    </Suspense>
  );
}
