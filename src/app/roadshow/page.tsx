'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Flame, Users, MessageCircle, Cpu, DollarSign, Trophy, Heart } from 'lucide-react';

interface Slide {
  id: number;
  type: 'cover' | 'content' | 'end';
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 0,
    type: 'cover',
    title: '群像·星火',
    subtitle: '基于真实职业经验的多人协同创作平台',
  },
  {
    id: 1,
    type: 'content',
    title: '开场：一个创作者的真实困境',
    icon: <MessageCircle className="w-12 h-12 text-orange-500" />,
    content: (
      <ul className="space-y-4 text-lg leading-relaxed">
        <li className="flex items-start gap-3">
          <span className="text-orange-500 mt-1">●</span>
          <span>创作者写剧本时，经常卡在<strong>专业细节的真实性</strong>上——急诊抢救流程、律师质证技巧、外卖员跑单逻辑</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-orange-500 mt-1">●</span>
          <span><strong>单人创作视角永远单一</strong>——编剧采访了医生，但没采访护士、患者家属、保洁阿姨</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-orange-500 mt-1">●</span>
          <span>同一情境在<strong>不同职业眼中，是完全不同的故事</strong></span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-orange-500 mt-1">●</span>
          <span>有真实职业经验的普通人，<strong>有故事但缺乏表达渠道</strong></span>
        </li>
      </ul>
    ),
  },
  {
    id: 2,
    type: 'content',
    title: '群像·星火是什么？',
    icon: <Flame className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-6 text-lg leading-relaxed">
        <p className="text-2xl font-bold text-orange-400">
          基于真实职业经验的多人协同创作平台
        </p>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="mb-4">核心理念：</p>
          <p className="text-white/90">
            让不同职业背景的普通人，被同时扔进同一个冲突情境<br />
            用各自的职业本能碰撞出火花<br />
            共同完成一部<strong className="text-orange-400">一个人永远写不出的故事</strong>
          </p>
        </div>
        <p className="text-white/70">
          不是 AI 替代人类创作，而是让<strong>真实的人、真实的经验、真实的碰撞</strong>成为创作原材料
        </p>
      </div>
    ),
  },
  {
    id: 3,
    type: 'content',
    title: '模式一：单人灵感积累',
    icon: <Users className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-5 text-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
          <span>选择身份 → 浏览脑洞卡片（左滑跳过 / 右滑收藏）</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
          <span>AI 催化引擎生成引导问题：<em className="text-orange-300">「作为医生，你首先会关注哪些生命体征？」</em></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</div>
          <span>语音或文字给出反应，自动存入个人素材库</span>
        </div>
        <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <span className="text-white/60 text-sm">适用场景：</span>
          <span className="ml-2">日常灵感积累、碎片化创作</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    type: 'content',
    title: '模式二：双人即兴碰撞',
    icon: <MessageCircle className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-5 text-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
          <span>两个不同身份的用户，右滑收藏同一脑洞 → 进入匹配池</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
          <span>60 秒匹配 → 实时对白室（WebSocket 毫秒级同步）</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</div>
          <span>即时对话，随时标记<strong className="text-orange-400">「火花」</strong>（精彩对白片段）</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">4</div>
          <span>火花墙回顾 + AI 串联成完整剧本对白</span>
        </div>
        <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <span className="text-white/60 text-sm">适用场景：</span>
          <span className="ml-2">即兴碰撞、快速产出对白片段</span>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    type: 'content',
    title: '模式三：多人剧本共创',
    icon: <Users className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-5 text-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
          <span>导演创建副本 → 参与者认领角色</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
          <span>导演控场：暂停思考 / 发起投票 / 喊「杀青」</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</div>
          <span>投票选中的精彩选项自动归档到灵感库</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">4</div>
          <span>AI 串联成一部群像故事 + 共创者署名墙</span>
        </div>
        <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <span className="text-white/60 text-sm">适用场景：</span>
          <span className="ml-2">完整剧本创作、团队协作</span>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    type: 'content',
    title: '技术架构',
    icon: <Cpu className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-4 text-lg">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">实时协作</p>
          <p className="text-white/80">Socket.io 自定义 server.ts — Next.js + WebSocket 毫秒级同步</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">AI 双引擎</p>
          <p className="text-white/80">催化引擎（DeepSeek API 生成引导问题）+ 串联引擎（火花→完整故事）</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">三级降级策略</p>
          <p className="text-white/80">DeepSeek API → 本地题库 → 通用提示（确保 Demo 任何网络可用）</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">TDD 全覆盖</p>
          <p className="text-white/80"><strong>216 个测试全部通过</strong>，23 个测试文件，覆盖 22 个 API 路由</p>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    type: 'content',
    title: '商业模式',
    icon: <DollarSign className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-5 text-lg">
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">第一层：C 端免费增值</p>
          <p className="text-white/80">基础玩法免费，高级功能付费（AI 长格式输出 / 导演高级控场工具包）</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">第二层：B 端内容采购</p>
          <p className="text-white/80">微短剧公司、互动小说平台直接采购优质对白，按字数或片段付费</p>
        </div>
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="font-bold text-orange-400 mb-2">第三层：IP 共创分润</p>
          <p className="text-white/80">优质群像故事共同孵化 IP，改编为剧本/短剧/有声书，按贡献度分润</p>
        </div>
      </div>
    ),
  },
  {
    id: 8,
    type: 'content',
    title: '里程碑与成果',
    icon: <Trophy className="w-12 h-12 text-orange-500" />,
    content: (
      <div className="space-y-4 text-lg">
        <div className="flex items-start gap-4">
          <div className="w-24 text-orange-400 font-bold shrink-0">Phase 1</div>
          <div>匹配引擎 — 内存匹配池 + 优先级算法 + 60秒超时检测</div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-24 text-orange-400 font-bold shrink-0">Phase 2</div>
          <div>房间管理 API — 消息 / 火花 / 暂停 / 恢复 / 结束</div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-24 text-orange-400 font-bold shrink-0">Phase 3</div>
          <div>实时通信 + AI 故事串联 — WebSocket + DeepSeek API</div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-24 text-orange-400 font-bold shrink-0">Phase 4</div>
          <div>
            <strong className="text-orange-400">216 个测试全部通过</strong>，23 个测试文件<br />
            AI 催化提示生成器完成
          </div>
        </div>
        <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10 text-white/60">
          下一步：知乎 API 接入（5/9-12）
        </div>
      </div>
    ),
  },
  {
    id: 9,
    type: 'end',
    title: '最好的故事',
    subtitle: '不是一个人关在房间里写出来的',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

export default function RoadshowPage() {
  const [[currentIndex, direction], setCurrentIndex] = useState([0, 0]);

  const paginate = useCallback((newDirection: number) => {
    setCurrentIndex((prev) => {
      const next = prev[0] + newDirection;
      if (next < 0 || next >= slides.length) return prev;
      return [next, newDirection];
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        paginate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate]);

  const slide = slides[currentIndex];

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white overflow-hidden relative select-none">
      {/* 进度条 */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <motion.div
          className="h-full bg-orange-500"
          animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 页码 */}
      <div className="fixed top-4 right-6 text-white/40 text-sm z-50">
        {currentIndex + 1} / {slides.length}
      </div>

      {/* 主要内容 */}
      <div className="flex items-center justify-center min-h-screen px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-4xl"
          >
            {slide.type === 'cover' && (
              <div className="text-center">
                <motion.h1
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-7xl font-bold text-orange-500 mb-6"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-2xl text-white/90 mb-4"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-lg text-amber-400"
                >
                  让真实的人，在真实的情境中，碰撞出真实的火花
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  className="w-48 h-1 bg-orange-500 mx-auto mt-8"
                />
              </div>
            )}

            {slide.type === 'content' && (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  {slide.icon}
                  <h2 className="text-4xl font-bold text-orange-500">{slide.title}</h2>
                </div>
                <div className="text-white/90">{slide.content}</div>
              </div>
            )}

            {slide.type === 'end' && (
              <div className="text-center">
                <motion.h1
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-6xl font-bold text-orange-500 mb-6"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-2xl text-white/90 mb-4"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-xl text-amber-400 mb-8"
                >
                  而是让真实的人在真实的情境中碰撞出来的
                </motion.p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: 'spring' }}
                  className="flex items-center justify-center gap-2 text-orange-500"
                >
                  <Heart className="w-8 h-8" />
                  <span className="text-3xl font-bold">谢谢大家</span>
                  <Heart className="w-8 h-8" />
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 导航按钮 */}
      <button
        onClick={() => paginate(-1)}
        disabled={currentIndex === 0}
        className="fixed left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors z-50"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        onClick={() => paginate(1)}
        disabled={currentIndex === slides.length - 1}
        className="fixed right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors z-50"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* 底部提示 */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-sm z-50">
        按 ← → 方向键或空格键切换幻灯片
      </div>
    </div>
  );
}
