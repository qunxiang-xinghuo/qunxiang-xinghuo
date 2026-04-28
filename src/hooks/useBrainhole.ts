'use client';

import { useState, useEffect } from 'react';
import { Brainhole } from '@/components/brainhole/BrainholeCard';

// Mock data matching demo.html
const mockBrainholes: Brainhole[] = [
  { id: 'bh_1', title: '如果你突然拥有了读心术，但只能读取陌生人的想法，你会怎么利用它？', content: '每天早上挤地铁的时候，耳边会响起几百个陌生人的心声...', source: '知乎' },
  { id: 'bh_2', title: '作为一个外卖员，你见过最让你难忘的一单是什么？', content: '深夜十一点，订单备注写着：不用敲门，放在门口就好，谢谢你还这么晚送餐。', source: '知乎' },
  { id: 'bh_3', title: '如果你能和五年前的自己通话一分钟，你会说什么？', content: '只有一分钟，时间一到自动挂断...', source: '知乎' },
  { id: 'bh_4', title: '作为医生，有没有哪个瞬间让你觉得"这个职业值了"？', content: '抢救了三个小时，心电图终于出现规律的波形...', source: '知乎' },
  { id: 'bh_5', title: '如果你的宠物突然开口说话了，你觉得它第一句话会是什么？', content: '养了十年的老猫，在一个雷雨夜突然看着你说...', source: '知乎' },
];

export const aiPrompts = [
  '第一反应是什么？不要思考，直接说出来。',
  '如果你是故事里的主角，下一步会怎么做？',
  '这个情境让你联想到自己生活中的哪件事？',
  '从你这个身份的角度，最在意的是什么？',
  '如果要用一句话总结你的感受，会是什么？',
  '你觉得这个情境里最不合理的部分是什么？',
];

export function useBrainhole() {
  const [brainholes, setBrainholes] = useState<Brainhole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBrainholes(mockBrainholes);
      setLoading(false);
    }, 500);
  }, []);

  const getBrainholeById = (id: string) => {
    return brainholes.find(b => b.id === id);
  };

  const getRandomPrompt = () => {
    return aiPrompts[Math.floor(Math.random() * aiPrompts.length)];
  };

  return {
    brainholes,
    loading,
    getBrainholeById,
    getRandomPrompt,
  };
}
