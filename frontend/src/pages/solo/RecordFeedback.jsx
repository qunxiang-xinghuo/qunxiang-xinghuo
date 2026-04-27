import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Home, RotateCcw, BookOpen, Flame } from 'lucide-react'

export default function RecordFeedback() {
  const navigate = useNavigate()
  const [count, setCount] = useState(0)
  
  // 获取已记录的反应数量
  useEffect(() => {
    const reactions = JSON.parse(localStorage.getItem('xh_reactions') || '[]')
    setCount(reactions.length)
  }, [])

  // 3秒后自动返回首页的提示
  useEffect(() => {
    const timer = setTimeout(() => {
      // 不自动跳转，让用户自己选择
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
    >
      {/* 背景动画粒子 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: '100vh', 
              x: Math.random() * 100 + '%',
              opacity: 0 
            }}
            animate={{ 
              y: '-10vh', 
              opacity: [0, 1, 0] 
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute"
          >
            <Sparkles 
              className="text-xh-gold" 
              style={{ 
                width: 8 + Math.random() * 12,
                height: 8 + Math.random() * 12,
                opacity: 0.3 + Math.random() * 0.5
              }} 
            />
          </motion.div>
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 text-center">
        {/* 成功动画 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0"
            >
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-xh-gold/30" />
            </motion.div>
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-xh-gold/20 to-orange-500/20 flex items-center justify-center border border-xh-gold/30">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-12 h-12 text-xh-gold" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 标题 */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-white mb-3"
        >
          你的真实反应已被收录
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 mb-2"
        >
          成为故事燃料
        </motion.p>

        {/* 数据统计 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2 mb-8"
        >
          <BookOpen className="w-4 h-4 text-xh-accent" />
          <span className="text-sm text-gray-300">
            你已累计记录 <span className="text-xh-gold font-bold">{count}</span> 个真实反应
          </span>
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/solo/match')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-accent to-rose-600 text-white py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
          >
            <RotateCcw className="w-4 h-4" />
            继续探索下一个脑洞
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-400 py-4 rounded-xl font-medium hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
