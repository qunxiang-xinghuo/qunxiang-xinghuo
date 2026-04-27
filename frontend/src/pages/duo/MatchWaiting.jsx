import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Sparkles, UserCheck } from 'lucide-react'

export default function MatchWaiting() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('waiting') // waiting | matched
  const [countdown, setCountdown] = useState(3)

  // 模拟匹配过程
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('matched')
    }, 2500) // 2.5秒后匹配成功

    return () => clearTimeout(timer)
  }, [])

  // 匹配成功后倒计时自动进入对白室
  useEffect(() => {
    if (status === 'matched') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate('/duo/chat')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, navigate])

  const brainhole = JSON.parse(localStorage.getItem('xh_duo_brainhole') || '{}')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col relative"
    >
      {/* 顶部 */}
      <div className="flex items-center px-4 py-4">
        <button onClick={() => navigate('/duo/match')} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">寻找搭档</h2>
      </div>

      {/* 当前脑洞 */}
      <div className="px-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
          <p className="text-[10px] text-gray-500 mb-1">你选择的脑洞</p>
          <p className="text-sm text-white leading-relaxed">{brainhole.title}</p>
        </div>
      </div>

      {/* 中间动画区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {status === 'waiting' ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-xh-accent/20 to-purple-500/20 flex items-center justify-center border border-xh-accent/30 animate-pulse">
                  <Loader2 className="w-10 h-10 text-xh-accent animate-spin" />
                </div>
                {/* 波纹 */}
                <div className="absolute inset-0 rounded-full border border-xh-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full border border-xh-accent/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">正在寻找另一个接戏的人…</h3>
              <p className="text-sm text-gray-400">有人在世界的某个角落，<br/>和你看着同一个脑洞</p>
            </motion.div>
          ) : (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full"
            >
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-xh-primary">
                    我
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-20 h-20 rounded-full bg-gradient-to-br from-xh-accent to-rose-500 flex items-center justify-center text-white text-xs font-bold border-4 border-xh-primary">
                    <div className="text-center">
                      <UserCheck className="w-5 h-5 mx-auto mb-0.5" />
                      <span class="text-[10px]">搭档</span>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="w-6 h-6 text-xh-gold" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-xh-gold/20 to-orange-500/20 rounded-2xl p-5 border border-xh-gold/30 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-xh-gold" />
                  <h3 className="text-lg font-bold text-white">匹配成功！</h3>
                  <Sparkles className="w-5 h-5 text-xh-gold" />
                </div>
                <p className="text-sm text-gray-300">
                  对方是 <span className="text-xh-gold font-bold">「已认证·急诊科护士」</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">ta 也对这个脑洞"有感觉"</p>
              </div>

              <p className="text-xs text-gray-500">
                {countdown} 秒后自动进入对白室…
              </p>

              <button
                onClick={() => navigate('/duo/chat')}
                className="mt-4 w-full bg-gradient-to-r from-xh-accent to-rose-600 text-white py-3 rounded-xl font-medium"
              >
                立即进入对白室
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
