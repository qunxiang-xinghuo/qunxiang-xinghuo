import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { ArrowLeft, Heart, X, Bookmark, Loader2 } from 'lucide-react'
import axios from 'axios'

// 模拟数据（API不可用时使用）
const mockData = [
  {
    id: 'bh_1',
    title: '如果你突然拥有了读心术，但只能读取陌生人的想法，你会怎么利用它？',
    content: '每天早上挤地铁的时候，耳边会响起几百个陌生人的心声...',
    source: '知乎',
  },
  {
    id: 'bh_2',
    title: '作为一个外卖员，你见过最让你难忘的一单是什么？',
    content: '深夜十一点，订单备注写着：不用敲门，放在门口就好，谢谢你还这么晚送餐。',
    source: '知乎',
  },
  {
    id: 'bh_3',
    title: '如果你能和五年前的自己通话一分钟，你会说什么？',
    content: '只有一分钟，时间一到自动挂断...',
    source: '知乎',
  },
  {
    id: 'bh_4',
    title: '作为医生，有没有哪个瞬间让你觉得"这个职业值了"？',
    content: '抢救了三个小时，心电图终于出现规律的波形...',
    source: '知乎',
  },
  {
    id: 'bh_5',
    title: '如果你的宠物突然开口说话了，你觉得它第一句话会是什么？',
    content: '养了十年的老猫，在一个雷雨夜突然看着你说...',
    source: '知乎',
  }
]

export default function BrainMatch() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState([])

  // 加载脑洞数据
  useEffect(() => {
    const fetchBrainholes = async () => {
      try {
        const res = await axios.get('/api/brainholes')
        setCards(res.data.length > 0 ? res.data : mockData)
      } catch (err) {
        console.log('API不可用，使用模拟数据')
        setCards(mockData)
      } finally {
        setLoading(false)
      }
    }
    fetchBrainholes()
  }, [])

  const handleSwipe = useCallback((direction) => {
    const current = cards[currentIndex]
    if (!current) return

    if (direction === 'right') {
      // 收藏/喜欢
      setLiked(prev => [...prev, current.id])
      axios.post(`/api/brainholes/${current.id}/like`).catch(() => {})
      // 进入记录页
      localStorage.setItem('xh_current_brainhole', JSON.stringify(current))
      setTimeout(() => {
        navigate('/solo/record')
      }, 300)
    } else {
      // 跳过，显示下一张
      setCurrentIndex(prev => prev + 1)
    }
  }, [cards, currentIndex, navigate])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-xh-gold animate-spin" />
      </div>
    )
  }

  if (currentIndex >= cards.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center px-6"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-white mb-2">今天的脑洞已看完</h3>
        <p className="text-sm text-gray-400 text-center mb-6">
          你收藏了 {liked.length} 个感兴趣的脑洞
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0)
            setLiked([])
          }}
          className="bg-xh-accent text-white px-6 py-3 rounded-xl font-medium"
        >
          重新浏览
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 顶部导航 */}
      <div className="flex items-center px-4 py-4">
        <button
          onClick={() => navigate('/solo/identity')}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">
          脑洞广场
        </h2>
      </div>

      {/* 进度指示 */}
      <div className="px-6 mb-4">
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i < currentIndex ? 'bg-xh-accent' : i === currentIndex ? 'bg-xh-gold' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* 卡片区域 */}
      <div className="flex-1 relative px-4 flex items-center justify-center">
        {cards.slice(currentIndex, currentIndex + 2).reverse().map((card, index) => (
          <SwipeCard
            key={card.id}
            card={card}
            onSwipe={handleSwipe}
            isTop={index === 1}
          />
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-center gap-6 pb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-xh-accent to-rose-600 flex items-center justify-center text-white shadow-lg shadow-xh-accent/30"
        >
          <Heart className="w-7 h-7" />
        </motion.button>
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-gray-500 text-center pb-4">
        左滑跳过 · 右滑收藏并记录反应
      </p>
    </motion.div>
  )
}

function SwipeCard({ card, onSwipe, isTop }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  const controls = useAnimation()

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      controls.start({ x: 500, opacity: 0 })
      onSwipe('right')
    } else if (info.offset.x < -100) {
      controls.start({ x: -500, opacity: 0 })
      onSwipe('left')
    } else {
      controls.start({ x: 0, opacity: 1 })
    }
  }

  if (!isTop) {
    return (
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2">
        <div className="bg-gray-800 rounded-3xl p-6 h-[420px] border border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="absolute inset-x-4 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
    >
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 h-[420px] border border-gray-700 shadow-2xl flex flex-col">
        {/* 来源标签 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Bookmark className="w-3 h-3" />
            {card.source}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-xh-gold/20 text-xh-gold">
            精选脑洞
          </span>
        </div>

        {/* 内容 */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white leading-relaxed mb-4">
            {card.title}
          </h3>
          {card.content && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {card.content}
            </p>
          )}
        </div>

        {/* 底部装饰 */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 text-center">
            右滑收藏，记录你的第一反应
          </p>
        </div>
      </div>
    </motion.div>
  )
}
