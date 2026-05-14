'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Theater, ArrowLeft, Lightbulb, Users } from 'lucide-react';

export default function MultiplayerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部栏 */}
      <div className="shrink-0 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/50" />
          </button>
          <span className="text-base font-semibold text-white/90">多人组队</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-6">
        {/* 大图标 + 标题 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: -12 } : false}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/10 border border-[#3B82F6]/25 flex items-center justify-center mx-auto mb-4">
            <Theater className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-lg font-bold text-white/90 mb-1">多人即兴碰撞</h1>
          <p className="text-sm text-white/40">一群人，一个场景，N 种身份</p>
        </motion.div>

        {/* 想象一下 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="text-sm text-white/60 mb-3 font-medium">想象一下：</p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm text-white/50 leading-relaxed mb-3">
              深夜急诊室，一个危重病人被推进来。
              在场的每个人都用自己的视角在说话——
            </p>
            <div className="space-y-2">
              {[
                { role: '医生', text: '血压70/40，准备除颤仪！' },
                { role: '家属', text: '他是不是没有希望了？' },
                { role: '交警', text: '我目击了事故全程，需要我提供什么信息？' },
                { role: '实习医生', text: '这是我第一次参与抢救，我该做什么？' },
              ].map((item, i) => (
                <p key={i} className="text-sm text-white/40 leading-relaxed">
                  <span className="text-[#8a9ab0]/60">{item.role}：</span>
                  {item.text}
                </p>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-sm text-white/30 leading-relaxed">
                没有剧本，没有排练。<br />
                每个人站在自己的身份里，<br />
                即兴说出那一刻最真实的反应。
              </p>
            </div>
          </div>
        </motion.div>

        {/* 怎样玩 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-white/60 mb-3 font-medium flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#8a9ab0]/60" />
            怎样玩
          </p>
          <div className="space-y-3">
            {[
              {
                step: '①',
                title: '进入一个场景',
                desc: '系统给出一个冲突情境，你选择一个身份（或系统分配）',
              },
              {
                step: '②',
                title: '即兴碰撞',
                desc: '多人同时在线，轮流发言。用你的身份视角回应这个场景。不需要表演能力，只需要做你自己',
              },
              {
                step: '③',
                title: '投票决定走向',
                desc: '当剧情出现分歧时，所有人投票。多数意见决定下一步剧情方向。被否决的灵感不会消失，它们进入"灵感库"，下次可能被唤醒',
              },
              {
                step: '④',
                title: '几分钟一个故事',
                desc: '这不是长篇连载，是一口气完成的。短则5分钟，长则15分钟。结束之后，火花片段被自动标记',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-sm text-[#8a9ab0]/50 font-bold shrink-0 mt-0.5">{item.step}</span>
                <div>
                  <p className="text-sm text-white/70 font-medium">{item.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 为什么多人碰撞有未来 */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-sm text-white/60 mb-3 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#8a9ab0]/60" />
            为什么多人碰撞有未来
          </p>
          <div className="space-y-3">
            {[
              {
                title: '一个人的视角是有限的',
                desc: '六个人看同一个急诊室，每个人注意到的东西完全不同',
              },
              {
                title: '真实身份带来真实碰撞',
                desc: '真正的护士和扮演护士的人，说出来的那句话，分量是不一样的',
              },
              {
                title: '投票让故事有了民主性',
                desc: '不是一个人决定的剧情，而是一群人的集体选择',
              },
              {
                title: '灵感库是宝藏',
                desc: '被否决的剧情方向不会消失，它们可以被后来的玩家重新发现，成为另一场精彩碰撞的起点',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8a9ab0]/40 shrink-0 mt-2" />
                <div>
                  <p className="text-sm text-white/60 font-medium">{item.title}</p>
                  <p className="text-xs text-white/30 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 底部即将开放 */}
        <motion.div
          initial={mounted ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 border-t border-white/5"
        >
          <p className="text-sm text-white/20 mb-1">🚧 功能开发中</p>
          <p className="text-xs text-white/15">期待你和一群人，在同一个急诊室里争吵</p>
        </motion.div>
      </div>
    </div>
  );
}
