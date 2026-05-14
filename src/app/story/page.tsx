'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopBar from '@/components/layout/TopBar';
import LiuKanshanAvatar from '@/components/layout/LiuKanshanAvatar';
import { Clock, BookOpen, Users, PenTool } from 'lucide-react';

const features = [
  { icon: BookOpen, title: '发起故事', desc: '创建一个群像故事项目，设定世界观和角色' },
  { icon: Users, title: '认领角色', desc: '浏览进行中的故事，选择心仪角色加入' },
  { icon: PenTool, title: '群像共创', desc: '多人实时协作，共同书写精彩故事' },
];

export default function StoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col h-full page-gradient">
      <TopBar title="故事" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto no-scrollbar">
        <div className="text-center py-8">
          <motion.div
            initial={mounted ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <LiuKanshanAvatar size="lg" animate emotion="thinking" className="mx-auto mb-4" />
          </motion.div>

          <motion.h2
            initial={mounted ? { y: 10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-bold text-white mb-2"
          >
            故事大厅
          </motion.h2>
          <motion.p
            initial={mounted ? { y: 10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-slate-600 mb-6"
          >
            认领角色，共创群像故事
          </motion.p>

          <motion.div
            initial={mounted ? { y: 10, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 justify-center mb-8"
          >
            <Clock className="w-4 h-4 text-xh-yellow/50" />
            <span className="text-xs text-xh-yellow/50">即将开放</span>
          </motion.div>

          <div className="space-y-3 text-left max-w-sm mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={mounted ? { x: -20, opacity: 0 } : false}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] hover:border-slate-600/20 hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-xh-yellow/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-xh-yellow/60" />
                    </div>
                    <div>
                      <h3 className="text-sm text-slate-400 font-medium">{feature.title}</h3>
                      <p className="text-xs text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
