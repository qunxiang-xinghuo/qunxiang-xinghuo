'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Sparkles, Edit3, Check } from 'lucide-react';

interface IdentityOption {
  type: 'zhihu' | 'ai' | 'custom';
  label: string;
  desc: string;
}

interface DuoIdentityModalProps {
  isOpen: boolean;
  brainholeTitle: string;
  onClose: () => void;
  onConfirm: (identity: string, type: 'zhihu' | 'ai' | 'custom') => void;
}

export default function DuoIdentityModal({ isOpen, brainholeTitle, onClose, onConfirm }: DuoIdentityModalProps) {
  const [selectedType, setSelectedType] = useState<'zhihu' | 'ai' | 'custom'>('zhihu');
  const [zhihuIdentities, setZhihuIdentities] = useState<string[]>([]);
  const [selectedZhihuId, setSelectedZhihuId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取用户已有身份
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // AI随机生成身份
  useEffect(() => {
    if (!isOpen || !brainholeTitle) return;
    const identities = [
      '急诊科医生', '辩护律师', '初中班主任', '产品经理', '外卖骑手',
      '幼儿园园长', '心理咨询师', '记者', '消防员', '护士',
      '创业者', '退休教师', '北漂程序员', '全职妈妈', '酒吧老板',
    ];
    const random = identities[Math.floor(Math.random() * identities.length)];
    setAiGenerated(random);
  }, [isOpen, brainholeTitle]);

  const handleConfirm = () => {
    let identity = '';
    if (selectedType === 'zhihu') {
      identity = selectedZhihuId || '匿名用户';
    } else if (selectedType === 'ai') {
      identity = aiGenerated;
    } else {
      identity = customLabel.trim() || '自定义角色';
    }
    onConfirm(identity, selectedType);
  };

  const options: IdentityOption[] = [
    { type: 'zhihu', label: '知乎身份', desc: '使用已认证的职业身份' },
    { type: 'ai', label: 'AI随机生成', desc: '系统分配一个与脑洞相关的角色' },
    { type: 'custom', label: '自定义角色', desc: '输入你想要的身份和简介' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* 弹窗内容 */}
          <motion.div
            className="relative w-full max-w-sm bg-[#1a1a2e] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-6">
              {/* 标题 */}
              <h2 className="text-lg font-bold text-white mb-1">确认你的身份</h2>
              <p className="text-xs text-white/40 mb-5">
                {brainholeTitle === '快速匹配'
                  ? '选择一个身份，系统将为你随机匹配对戏伙伴'
                  : `选择一个身份进入"${brainholeTitle.slice(0, 20)}..."`}
              </p>

              {/* 身份选项 */}
              <div className="space-y-2.5 mb-5">
                {options.map((option) => (
                  <div
                    key={option.type}
                    onClick={() => setSelectedType(option.type)}
                    className={`relative rounded-xl p-3 cursor-pointer transition-all border ${
                      selectedType === option.type
                        ? 'border-xh-gold/40 bg-xh-gold/10'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          selectedType === option.type ? 'bg-xh-gold/20' : 'bg-white/5'
                        }`}
                      >
                        {option.type === 'zhihu' && <User className="w-4 h-4 text-xh-gold" />}
                        {option.type === 'ai' && <Sparkles className="w-4 h-4 text-violet-400" />}
                        {option.type === 'custom' && <Edit3 className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/80">{option.label}</span>
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
                        className="mt-2 pt-2 border-t border-white/5"
                      >
                        {option.type === 'zhihu' && (
                          <div className="space-y-1.5">
                            {zhihuIdentities.length === 0 ? (
                              <p className="text-xs text-white/30">暂无认证身份，请先设置</p>
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
                                const identities = ['急诊科医生', '辩护律师', '初中班主任', '产品经理', '外卖骑手', '幼儿园园长', '心理咨询师', '记者', '消防员', '护士', '创业者', '退休教师', '北漂程序员', '全职妈妈', '酒吧老板'];
                                setAiGenerated(identities[Math.floor(Math.random() * identities.length)]);
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

              {/* 确认按钮 */}
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-xh-gold to-orange-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? '正在进入...' : '确认身份，开始匹配'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
