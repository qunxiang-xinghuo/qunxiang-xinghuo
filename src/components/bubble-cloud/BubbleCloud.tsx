'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Bubble from './Bubble';
import { BubbleItem } from './types';

const CATEGORY_COLORS: Record<string, string> = {
  medical: 'rgba(231,76,60,0.18)', legal: 'rgba(52,152,219,0.18)',
  workplace: 'rgba(243,156,18,0.18)', life: 'rgba(46,204,113,0.18)',
  education: 'rgba(155,89,182,0.18)', tech: 'rgba(26,188,156,0.18)',
  emergency: 'rgba(230,126,34,0.18)', general: 'rgba(149,165,166,0.18)',
  zhihu_hot: 'rgba(0,102,255,0.18)', zhihu_search: 'rgba(0,132,255,0.15)',
  deepseek: 'rgba(138,180,248,0.15)', fallback: 'rgba(149,165,166,0.15)',
};

const CATEGORY_BORDER: Record<string, string> = {
  medical: 'rgba(231,76,60,0.45)', legal: 'rgba(52,152,219,0.45)',
  workplace: 'rgba(243,156,18,0.45)', life: 'rgba(46,204,113,0.45)',
  education: 'rgba(155,89,182,0.45)', tech: 'rgba(26,188,156,0.45)',
  emergency: 'rgba(230,126,34,0.45)', general: 'rgba(149,165,166,0.40)',
  zhihu_hot: 'rgba(0,102,255,0.40)', zhihu_search: 'rgba(0,132,255,0.35)',
  deepseek: 'rgba(138,180,248,0.35)', fallback: 'rgba(149,165,166,0.30)',
};

interface BubbleCloudProps {
  limit?: number;
}

export default function BubbleCloud({ limit = 20 }: BubbleCloudProps) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { fetchBubbles(); }, []);

  const fetchBubbles = useCallback(async () => {
    try {
      const res = await fetch(`/api/brainholes/bubble?limit=${limit}`, { cache: 'no-store' });
      const result = await res.json();
      console.log('[BubbleCloud] API result:', result.success, 'count:', result.data?.brainholes?.length);
      if (result.success && result.data?.brainholes && result.data.brainholes.length > 0) {
        const list: BubbleItem[] = result.data.brainholes.map((b: any) => ({
          id: b.id,
          title: b.title,
          scenario: b.scenario || '',
          hotScore: b.hotScore || 50,
          category: b.category || 'general',
          difficulty: b.difficulty || 'medium',
          source: b.source || 'fallback',
        }));
        setBubbles(list);
      } else {
        console.warn('[BubbleCloud] Empty response, using emergency fallback');
        setBubbles(generateEmergencyFallback());
      }
      setLoaded(true);
    } catch (err) {
      console.error('[BubbleCloud] fetch error:', err);
      setBubbles(generateEmergencyFallback());
      setLoaded(true);
    }
  }, [limit]);

  const handleBubbleClick = useCallback((bubble: BubbleItem) => {
    window.location.href = `/brainhole/${bubble.id}`;
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-xh-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (bubbles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <div className="text-2xl opacity-20">🫧</div>
        <p className="text-xs text-slate-500">暂无热门内容</p>
        <button onClick={fetchBubbles} className="text-[10px] text-xh-gold hover:underline">点击刷新</button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 px-2 py-4">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={bubble.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: index * 0.04 }}
        >
          <Bubble
            item={bubble}
            index={index}
            onClick={() => handleBubbleClick(bubble)}
            bgColor={CATEGORY_COLORS[bubble.category] || CATEGORY_COLORS.general}
            borderColor={CATEGORY_BORDER[bubble.category] || CATEGORY_BORDER.general}
          />
        </motion.div>
      ))}
    </div>
  );
}

function generateEmergencyFallback(): BubbleItem[] {
  return [
    { id: 'em-1', title: '急诊室里的道德困境', scenario: '凌晨2点，急诊科医生面对两个病人...', hotScore: 85, category: 'medical', difficulty: 'hard', source: 'fallback' },
    { id: 'em-2', title: '裁员名单上的秘密', scenario: 'HR总监发现裁员名单上有自己最好的朋友', hotScore: 78, category: 'workplace', difficulty: 'medium', source: 'fallback' },
    { id: 'em-3', title: '学区房背后的交易', scenario: '夫妻假离婚，丈夫却有了新的恋情', hotScore: 72, category: 'life', difficulty: 'medium', source: 'fallback' },
    { id: 'em-4', title: '网红医生的真实面', scenario: '医学大V承诺免费治疗，却做不到', hotScore: 68, category: 'medical', difficulty: 'medium', source: 'fallback' },
    { id: 'em-5', title: '拆迁办的最后一户', scenario: '老人在等40年前失散的亲人', hotScore: 65, category: 'life', difficulty: 'easy', source: 'fallback' },
    { id: 'em-6', title: '老师与学生的秘密', scenario: '最优秀的学生在深夜送外卖', hotScore: 62, category: 'education', difficulty: 'medium', source: 'fallback' },
    { id: 'em-7', title: '外卖骑手的双重身份', scenario: '救人的骑手是医学院肄业生', hotScore: 60, category: 'medical', difficulty: 'easy', source: 'fallback' },
    { id: 'em-8', title: '法庭上的亲情审判', scenario: '律师发现当事人是被拐的亲妹妹', hotScore: 58, category: 'legal', difficulty: 'hard', source: 'fallback' },
    { id: 'em-9', title: '程序员与AI的对赌', scenario: '让AI出错才能保住所有人工作', hotScore: 55, category: 'tech', difficulty: 'medium', source: 'fallback' },
    { id: 'em-10', title: '幼儿园里的真相', scenario: '园长调查体罚，发现意外关联', hotScore: 52, category: 'education', difficulty: 'medium', source: 'fallback' },
    { id: 'em-11', title: '消防员的选择', scenario: '高楼火灾，只能先救一边', hotScore: 50, category: 'emergency', difficulty: 'hard', source: 'fallback' },
    { id: 'em-12', title: '心理咨询师的两难', scenario: '来访者丈夫是自己挚友', hotScore: 48, category: 'medical', difficulty: 'hard', source: 'fallback' },
  ];
}
