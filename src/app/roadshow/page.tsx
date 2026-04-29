"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Brain,
  Zap,
  MessageCircle,
  Trophy,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Brain,
    title: "泡泡云脑洞池",
    desc: "31个跨职业冲突情境，医疗/法律/教育/职场/技术/生活8大分类，热度驱动的泡泡可视化",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "三人模式创作",
    desc: "单人沉浸 + 双人碰撞 + 多人剧场，满足不同创作场景需求",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "AI 双引擎催化",
    desc: "DeepSeek 故事串联 + 知乎直答双模型驱动，三级降级策略确保可用",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageCircle,
    title: "实时 WebSocket 对白",
    desc: "Socket.io 房间消息广播，导演控场（暂停/继续/投票/杀青）",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Sparkles,
    title: "知乎生态接入",
    desc: "圈子发布/评论/点赞 + 搜索/热榜/直答 API，内容闭环",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Trophy,
    title: "217 个测试守护",
    desc: "Vitest + React Testing Library，API/Hooks/组件全覆盖 TDD",
    color: "from-red-500 to-pink-500",
  },
];

const stats = [
  { label: "脑洞数量", value: "31" },
  { label: "分类覆盖", value: "8" },
  { label: "API 路由", value: "26" },
  { label: "测试用例", value: "226" },
];

export default function RoadshowPage() {
  return (
    <div className="min-h-screen bg-[#0f0f23] text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-4 h-4 text-[#e2b04a]" />
            <span className="text-sm text-gray-300">群像·星火 v4.0 路演版</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            每一个认真生活的人
            <br />
            <span className="text-[#e2b04a]">都能成为故事的一部分</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            基于真实职业经验的多人协同创作平台。让不同职业背景的普通人，
            被同时扔进同一个冲突情境，用各自的职业本能碰撞出火花。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full
              bg-gradient-to-r from-[#e2b04a] to-[#f0c050]
              text-[#0f0f23] font-semibold
              hover:scale-105 transition-transform"
          >
            立即体验
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="text-3xl font-bold text-[#e2b04a] mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <motion.h2
          className="text-2xl font-bold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          核心功能亮点
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="p-6 rounded-2xl bg-white/5 border border-white/10
                hover:border-white/20 transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color}
                  flex items-center justify-center mb-4
                  group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-8">技术架构</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js 16.2.4",
              "React 19",
              "TypeScript 5.x",
              "Tailwind CSS v4",
              "Prisma 7.8.0",
              "SQLite",
              "Socket.io",
              "DeepSeek API",
              "知乎开放平台",
            ].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10
                  text-sm text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-4">准备好开启创作之旅了吗？</h2>
          <p className="text-gray-400 mb-8">
            选择一个脑洞，认领你的职业身份，让故事自然生长。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full
              border border-[#e2b04a]/40 text-[#e2b04a]
              hover:bg-[#e2b04a]/10 transition-colors"
          >
            进入泡泡云
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs text-gray-600 border-t border-white/5">
        <p>群像·星火 (Qunxiang Xinghuo) v4.0 · 基于真实职业经验的多人协同创作平台</p>
        <p className="mt-1">技术栈: Next.js 16 + React 19 + Tailwind CSS v4 + Prisma 7.8 + DeepSeek API</p>
      </footer>
    </div>
  );
}
