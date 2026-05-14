'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Lightbulb, Sparkles } from 'lucide-react';

export default function LongTermPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <span className="text-base font-semibold text-white/90">长期连载</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-6">
        {/* 大图标 + 标题 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: -12 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4B830]/20 to-[#6c7c90]/10 border border-[#D4B830]/25 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#D4B830]" />
          </div>
          <h1 className="text-lg font-bold text-white/90 mb-1">长期连载</h1>
          <p className="text-sm text-white/40">从玩故事到写故事</p>
        </motion.div>

        {/* 核心概念 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5"
        >
          <p className="text-base text-white/70 font-medium mb-2">一个故事坑，N个人一起写</p>
          <p className="text-sm text-white/40 leading-relaxed">
            你可以发起一个「长期连载坑」——一个只有开头的故事，开放给所有人认领角色，一集一集往下演。
          </p>
          <p className="text-sm text-white/40 leading-relaxed mt-2">
            每一集的剧情，不是一个人写的，而是不同角色在对话中碰撞出来的。
          </p>
        </motion.div>

        {/* 怎样运作 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-white/60 mb-3 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4B830]/60" />
            怎样运作
          </p>
          <div className="space-y-3">
            {[
              {
                step: '①',
                title: '众筹故事坑',
                desc: '发起人写第一幕，设定世界观和角色。其他人申请认领角色。集齐角色后，故事正式开演。',
              },
              {
                step: '②',
                title: '一集一集推进',
                desc: '每集有场景设定，AI副导演引导。角色之间即时对白，火花被自动标记。导演每集喊咔。下一集基于上一集剧情继续。',
              },
              {
                step: '③',
                title: '人人都是创作者',
                desc: '你的每一句对白都影响故事走向。最受欢迎的演绎成为这一集的「正史」。故事完结后，整部作品署名所有参与者。',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-sm text-[#D4B830]/50 font-bold shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <p className="text-sm text-white/70 font-medium">{item.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 为什么有未来 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-sm text-white/60 mb-3 font-medium flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#D4B830]/60" />
            为什么这个故事模式有未来
          </p>
          <div className="space-y-3">
            {[
              {
                title: '单人写故事是孤独的',
                desc: '多人共创降低创作门槛，灵感在碰撞中产生。',
              },
              {
                title: '真实身份带来真实故事',
                desc: '不同职业的人演同一个角色，会带出完全不同的专业细节和人生经验。',
              },
              {
                title: '从玩到写的自然进阶',
                desc: '第一次玩是为了看结局，第二次玩发现了火花，第三次你开始关心故事本身，第四次你会想：「我能不能开一个坑？」',
              },
              {
                title: '有潜力的故事就是下一个IP',
                desc: '最受欢迎的长篇故事，可以改编成短剧、互动小说、音频剧。每个贡献者都能获得署名和分成。',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4B830]/40 shrink-0 mt-2" />
                <div>
                  <p className="text-sm text-white/60 font-medium">{item.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 底部 */}
        <motion.div
          initial={mounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 border-t border-white/5"
        >
          <p className="text-sm text-white/20 mb-1">🚧 功能开发中</p>
          <p className="text-xs text-white/15">期待你的故事</p>
          <p className="text-xs text-white/15">成为群像星火的第一部长篇</p>
        </motion.div>
      </div>
    </div>
  );
}
