'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

interface Props {
  show: boolean;
  onDismiss: () => void;
}

const WELCOME_STEPS = [
  {
    text: '嗨！我是刘看山，欢迎来到群像·星火！',
    emoji: '👋',
  },
  {
    text: '这里漂浮着各种真实职业冲突情境，每一个泡泡都是一个待探索的脑洞。',
    emoji: '💭',
  },
  {
    text: '你可以单人沉浸、双人碰撞，或者组队共创群像故事。',
    emoji: '✨',
  },
  {
    text: '点击任意泡泡，收藏素材、记录你的真实反应吧！',
    emoji: '🎯',
  },
];

export default function LiuKanshanWelcome({ show, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState('');

  const current = WELCOME_STEPS[step];

  // 打字机效果
  useEffect(() => {
    if (!show) return;
    setTypedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i <= current.text.length) {
        setTypedText(current.text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [step, show, current.text]);

  const nextStep = () => {
    if (step < WELCOME_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onDismiss} />

          {/* 刘看山 + 对话框 */}
          <motion.div
            className="relative w-full max-w-sm"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* 刘看山形象 */}
            <div className="flex justify-center mb-2">
              <motion.div
                className="w-16 h-16 rounded-full relative"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #f5f5f5, #e0e0e0)',
                  border: '2px solid #74b9ff',
                  boxShadow: '0 0 20px #74b9ff40, inset -2px -2px 6px rgba(0,0,0,0.1)',
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* 耳朵 */}
                <div className="absolute -top-1.5 left-2 w-3.5 h-3.5 rounded-full bg-[#f5f5f5] border border-gray-200" />
                <div className="absolute -top-1.5 right-2 w-3.5 h-3.5 rounded-full bg-[#f5f5f5] border border-gray-200" />

                {/* 脸 */}
                <div className="absolute inset-0.5 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                  <div className="flex gap-2 items-center mt-[-2px]">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#74b9ff]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#74b9ff]" />
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3 h-1.5 rounded-b-full bg-[#ff9f43]" />
                </div>

                {/* 腮红 */}
                <div className="absolute top-4 left-1 w-2.5 h-2 rounded-full bg-[#ffcccc] opacity-40" />
                <div className="absolute top-4 right-1 w-2.5 h-2 rounded-full bg-[#ffcccc] opacity-40" />
              </motion.div>
            </div>

            {/* 对话框 */}
            <div className="bg-white/95 rounded-2xl p-4 shadow-xl border border-white/20">
              {/* 步骤指示器 */}
              <div className="flex gap-1.5 mb-3">
                {WELCOME_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === step ? 'w-6 bg-[#74b9ff]' : 'w-2 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* 文字 */}
              <div className="min-h-[60px] flex items-start gap-2">
                <span className="text-lg">{current.emoji}</span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {typedText}
                  {typedText.length < current.text.length && (
                    <span className="inline-block w-0.5 h-4 bg-[#74b9ff] ml-0.5 animate-pulse" />
                  )}
                </p>
              </div>

              {/* 按钮 */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={onDismiss}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  跳过引导
                </button>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#74b9ff] text-white text-sm font-medium hover:bg-[#5a9bd8] transition-colors"
                >
                  {step < WELCOME_STEPS.length - 1 ? (
                    <>
                      下一步
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    '开始探索'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
