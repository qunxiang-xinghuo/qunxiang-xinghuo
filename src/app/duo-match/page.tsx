'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Sparkles, Edit3, Check } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

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

function DuoMatchContent() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'zhihu' | 'ai' | 'custom'>('zhihu');
  const [zhihuIdentities, setZhihuIdentities] = useState<string[]>([]);
  const [selectedZhihuId, setSelectedZhihuId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  // 获取知乎身份（无需登录检查，用户已在首页登录）
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
    // AI随机
    setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]);
  }, []);

  const handleConfirm = async () => {
    let identity = '';
    if (selectedType === 'zhihu') {
      identity = selectedZhihuId || '匿名用户';
    } else if (selectedType === 'ai') {
      identity = aiGenerated;
    } else {
      identity = customLabel.trim() || '自定义角色';
    }

    setIsMatching(true);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          preferDifferent: true,
          timeoutMinutes: 1,
          mode: 'quick',
        }),
      });

      const result = await res.json();

      if (result.success) {
        const matchId = result.data?.matchId;
        if (matchId) {
          localStorage.setItem('xh_duo_match_id', matchId);
          localStorage.setItem('xh_duo_identity', identity);
          localStorage.removeItem('xh_duo_brainhole');
          router.push(`/duo-waiting?matchId=${matchId}`);
        } else {
          alert('匹配请求创建失败');
          setIsMatching(false);
        }
      } else {
        alert(result.message || '匹配请求失败');
        setIsMatching(false);
      }
    } catch {
      alert('网络错误，请重试');
      setIsMatching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <TopBar title="身份选择" showBack />

      {/* 页面标题 */}
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-lg font-bold text-white/90 mb-1">在这次对撞中，你是谁？</h2>
        <p className="text-xs text-white/30">选择一个身份，系统将为你匹配对戏伙伴</p>
      </div>

      {/* 身份选项 - 卡片式布局 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-3 space-y-3">
        {options.map((option) => (
          <div
            key={option.type}
            onClick={() => setSelectedType(option.type)}
            className={`relative rounded-xl p-4 cursor-pointer transition-all border ${
              selectedType === option.type
                ? 'border-xh-gold/40 bg-xh-gold/10'
                : 'border-white/5 bg-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedType === option.type ? 'bg-xh-gold/20' : 'bg-white/5'
                }`}
              >
                {option.type === 'zhihu' && <User className="w-5 h-5 text-xh-gold" />}
                {option.type === 'ai' && <Sparkles className="w-5 h-5 text-violet-400" />}
                {option.type === 'custom' && <Edit3 className="w-5 h-5 text-orange-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80">{option.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === option.type ? 'border-xh-gold bg-xh-gold' : 'border-white/20'
                    }`}
                  >
                    {selectedType === option.type && <Check className="w-2.5 h-2.5 text-[#1a1a2e]" strokeWidth={4} />}
                  </div>
                </div>
                <p className="text-[10px] text-white/30">{option.desc}</p>
              </div>
            </div>

            {/* 选项详情 */}
            {selectedType === option.type && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-white/5"
              >
                {option.type === 'zhihu' && (
                  <div className="space-y-1.5">
                    {zhihuIdentities.length === 0 ? (
                      <p className="text-xs text-white/30">暂无认证身份，将使用默认身份</p>
                    ) : (
                      zhihuIdentities.map((id) => (
                        <button
                          key={id}
                          onClick={(e) => { e.stopPropagation(); setSelectedZhihuId(id); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            selectedZhihuId === id
                              ? 'bg-xh-gold/15 text-xh-gold border border-xh-gold/20'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {id}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {option.type === 'ai' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-xs text-violet-300">{aiGenerated}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAiGenerated(aiIdentities[Math.floor(Math.random() * aiIdentities.length)]);
                      }}
                      className="ml-auto text-[10px] text-violet-400 hover:text-violet-300"
                    >
                      换一个
                    </button>
                  </div>
                )}

                {option.type === 'custom' && (
                  <div>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="例如：急诊科护士、北漂创业者..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-400/50"
                      maxLength={20}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-[10px] text-white/20 mt-1 text-right">{customLabel.length}/20</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* 底部确认按钮 */}
      <div className="shrink-0 px-6 py-4 border-t border-white/5">
        <button
          onClick={handleConfirm}
          disabled={isMatching}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isMatching ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '确认身份，开始匹配'
          )}
        </button>
      </div>
    </div>
  );
}

export default function DuoMatchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full bg-[#1a1a2e] items-center justify-center">
        <p className="text-white/40 text-sm">加载中...</p>
      </div>
    }>
      <DuoMatchContent />
    </Suspense>
  );
}
