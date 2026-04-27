import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, User, Users, UsersRound, ChevronLeft, ChevronRight } from 'lucide-react'

const modes = [
  {
    id: 'solo',
    title: '单人模式',
    desc: '一个人，一个脑洞，一段真实反应',
    icon: User,
    color: 'from-rose-500 to-orange-500',
    path: '/solo/identity'
  },
  {
    id: 'duo',
    title: '双人模式',
    desc: '匹配陌生人，碰撞思想火花',
    icon: Users,
    color: 'from-violet-500 to-purple-500',
    path: '/duo/lobby'
  },
  {
    id: 'team',
    title: '多人组队',
    desc: '三五好友，共创群像故事（即将上线）',
    icon: UsersRound,
    color: 'from-emerald-500 to-teal-500',
    path: null
  }
]

export default function HomePage() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)

  const handleStart = () => {
    navigate('/solo/identity')
  }

  const scrollTo = (index) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.75
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      })
      setActiveIndex(index)
    }
  }

  const handleScroll = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.75
      const index = Math.round(scrollRef.current.scrollLeft / cardWidth)
      setActiveIndex(index)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col relative overflow-hidden"
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-xh-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-48 h-48 bg-xh-gold/10 rounded-full blur-3xl" />
      </div>

      {/* 顶部标题区 */}
      <div className="pt-16 pb-8 px-6 text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-xh-gold" />
            <h1 className="text-3xl font-bold tracking-wider text-white">
              群像·星火
            </h1>
            <Sparkles className="w-6 h-6 text-xh-gold" />
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            每一个认真生活的人，都能成为故事的一部分
          </p>
        </motion.div>
      </div>

      {/* 中间开始按钮 */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-xh-accent to-rose-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
          <div className="relative bg-gradient-to-r from-xh-accent to-rose-600 text-white px-10 py-5 rounded-full text-lg font-medium shadow-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            开始创作
          </div>
        </motion.button>
      </div>

      {/* 下方模式卡片 */}
      <div className="pb-10 relative z-10">
        <div className="flex items-center justify-between px-6 mb-4">
          <span className="text-xs text-gray-500">选择创作模式</span>
          <div className="flex gap-1">
            {modes.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === activeIndex ? 'bg-xh-gold' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory"
        >
          {modes.map((mode, index) => {
            const Icon = mode.icon
            const isActive = index === activeIndex
            return (
              <motion.div
                key={mode.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => mode.path && navigate(mode.path)}
                className={`flex-shrink-0 w-[75%] snap-center rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                  isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
                } ${
                  mode.path
                    ? 'bg-gradient-to-br ' + mode.color
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-8 h-8 text-white/90" />
                  {!mode.path && (
                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                      即将上线
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{mode.title}</h3>
                <p className="text-xs text-white/80 leading-relaxed">{mode.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* 左右切换按钮 */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollTo(Math.min(modes.length - 1, activeIndex + 1))}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
