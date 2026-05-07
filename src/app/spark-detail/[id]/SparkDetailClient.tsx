'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Clock, Sparkles, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  identity: string;
  senderId: string;
  roleCharacter?: string | null;
  isSpark: boolean;
  createdAt: string;
}

interface SparkDetailData {
  id: string;
  title: string;
  content: string;
  hotScore: number;
  createdAt: string;
  identity: string;
  identityPair: string;
  brainholeTitle: string;
  brainholeCategory: string;
  brainholeScenario: string;
  roomId: string | null;
  roomStatus: string | null;
  closedAt: string | null;
  messageCount: number;
  sparkCount: number;
  messages: Message[];
}

export default function SparkDetailClient({ data }: { data: SparkDetailData }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);


  return (
    <div className="flex flex-col min-h-full page-gradient">
      {/* 顶部栏 */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.push('/home')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white/90 truncate">{data.brainholeTitle || data.title}</h1>
          <p className="text-[11px] text-white/30">{data.identityPair}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#e2b04a]/60">
          <Flame className="w-3.5 h-3.5" />
          {data.hotScore}
        </div>
      </div>

      {/* 场景描述 */}
      {data.brainholeScenario && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/50 leading-relaxed">{data.brainholeScenario}</p>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
        <div className="space-y-4">
          {data.messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={mounted ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] ${idx % 2 === 0 ? 'items-start' : 'items-end'} flex flex-col`}>
                {/* 身份标签 */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] text-white/40">{msg.identity}</span>
                  {msg.isSpark && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#e2b04a]">
                      <Sparkles className="w-3 h-3" />
                      火花
                    </span>
                  )}
                </div>
                {/* 消息气泡 */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    idx % 2 === 0
                      ? 'bg-white/[0.06] text-white/85 rounded-tl-sm border border-white/5'
                      : 'bg-[#e2b04a]/15 text-white/85 rounded-tr-sm border border-[#e2b04a]/20'
                  }`}
                >
                  {msg.content}
                </div>
                {/* 时间 */}
                <span className="text-[9px] text-white/20 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 结束提示 */}
        {data.roomStatus === 'finished' || data.roomStatus === 'closed' ? (
          <div className="flex flex-col items-center mt-8 mb-4">
            <div className="w-8 h-px bg-white/10 mb-3" />
            <p className="text-[11px] text-white/20 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {data.closedAt
                ? `对白已结束 · ${new Date(data.closedAt).toLocaleDateString('zh-CN')}`
                : '对白已结束'}
            </p>
            <p className="text-[10px] text-white/15 mt-1">
              共 {data.messageCount} 条消息 · {data.sparkCount} 个火花
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
