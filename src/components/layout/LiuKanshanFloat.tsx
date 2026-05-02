'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LiuKanshanFloatProps {
  mode?: 'default' | 'solo' | 'duo' | 'multi';
}

const MESSAGES: Record<string, string[]> = {
  default: [
    '嗨！我是刘看山，今天想探索什么脑洞？',
    '点击泡泡可以进入详情哦~',
    '长按泡泡可以快速预览！',
    '发现一个好玩的脑洞，要看看吗？',
  ],
  solo: [
    '这个情境很有趣，你想用什么身份来体验？',
    '真实反应比完美台词更有价值~',
    '试着用语音输入，更方便哦！',
  ],
  duo: [
    '匹配成功！记住，真实反应比完美台词更有火花',
    '试着理解对方的职业视角~',
    '有灵感了就标记火花！',
  ],
  multi: [
    '导演正在控场，轮到你发言了！',
    '代入角色，说出你的真实反应~',
    '群像故事需要每个人的火花！',
  ],
};

export default function LiuKanshanFloat({ mode = 'default' }: LiuKanshanFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [mood, setMood] = useState<'happy' | 'think' | 'surprise' | 'gentle'>('happy');

  const messages = MESSAGES[mode] || MESSAGES.default;

  // 随机提示
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      const moods: Array<'happy' | 'think' | 'surprise' | 'gentle'> = ['happy', 'think', 'surprise', 'gentle'];
      setMood(moods[Math.floor(Math.random() * moods.length)]);
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen, messages.length]);

  const moodColors = {
    happy: '#ff9f43',
    think: '#74b9ff',
    surprise: '#ff4757',
    gentle: '#ffcccc',
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div
              className="relative bg-[#fff5e6] text-gray-800 px-4 py-3 rounded-2xl max-w-[220px] text-sm leading-relaxed shadow-lg border"
              style={{
                borderColor: `${moodColors[mood]}40`,
                boxShadow: `0 4px 20px ${moodColors[mood]}30`,
              }}
            >
              {/* 小三角 */}
              <div
                className="absolute -bottom-2 right-6 w-0 h-0"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: `8px solid #fff5e6`,
                }}
              />
              {messages[messageIndex]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 刘看山浮动按钮 - 使用官方图片 */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 30%, #f5f5f5, #e8e8e8)`,
          border: `2px solid ${moodColors[mood]}`,
          boxShadow: `0 0 15px ${moodColors[mood]}60, inset -2px -2px 6px rgba(0,0,0,0.1)`,
        }}
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          y: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <Image
          src="/liukanshan.jpg"
          alt="刘看山"
          width={48}
          height={48}
          className="object-contain rounded-full"
          style={{ width: 48, height: 48 }}
          priority
        />

        {/* 思考气泡 */}
        {mood === 'think' && (
          <motion.div
            className="absolute -top-4 right-0 text-gray-400 text-xs"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ...
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
