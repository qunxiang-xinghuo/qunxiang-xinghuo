import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, User, Wand2, Tag, Zap } from 'lucide-react'

const identityOptions = [
  {
    id: 'real',
    title: '真实身份',
    desc: '绑定知乎认证，用真实职业标签参与',
    detail: '医生 / 律师 / 教师 / 工程师...',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    badge: '最具可信度'
  },
  {
    id: 'recommended',
    title: '推荐身份',
    desc: '系统根据你的回答风格智能推荐',
    detail: '故事讲述者 / 生活观察家 / 逻辑分析师...',
    icon: Wand2,
    color: 'from-violet-500 to-purple-500',
    badge: 'AI推荐'
  },
  {
    id: 'custom',
    title: '自创标签',
    desc: '自定义简短标签，自由表达身份',
    detail: '输入你的专属身份标签',
    icon: Tag,
    color: 'from-orange-500 to-rose-500',
    badge: '最自由'
  }
]

export default function IdentitySelect() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [customTag, setCustomTag] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleSelect = (id) => {
    setSelected(id)
    if (id === 'custom') {
      setShowInput(true)
    } else {
      setShowInput(false)
    }
  }

  const handleConfirm = () => {
    let identity = {}
    if (selected === 'real') {
      identity = { type: 'real', label: '知乎认证用户' }
      // TODO: 后续接入知乎OAuth
    } else if (selected === 'recommended') {
      identity = { type: 'recommended', label: '故事讲述者' }
    } else if (selected === 'custom' && customTag.trim()) {
      identity = { type: 'custom', label: customTag.trim() }
    }
    
    // 保存到本地存储
    localStorage.setItem('xh_identity', JSON.stringify(identity))
    navigate('/solo/match')
  }

  const isValid = selected && (selected !== 'custom' || customTag.trim().length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="h-full flex flex-col"
    >
      {/* 顶部导航 */}
      <div className="flex items-center px-4 py-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">
          选择你的身份
        </h2>
      </div>

      {/* 说明文字 */}
      <div className="px-6 mb-6">
        <p className="text-sm text-gray-400 leading-relaxed">
          你的身份标签会伴随每一次反应记录，<br />
          让读者知道"这是一个_____的真实想法"。
        </p>
      </div>

      {/* 选项列表 */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar">
        {identityOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = selected === option.id
          return (
            <motion.div
              key={option.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(option.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border-2 ${
                isSelected
                  ? 'border-xh-gold bg-xh-gold/10'
                  : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium">{option.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                      {option.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{option.desc}</p>
                  <p className="text-xs text-gray-500">{option.detail}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    isSelected
                      ? 'border-xh-gold bg-xh-gold'
                      : 'border-gray-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-xh-primary" />}
                </div>
              </div>

              {/* 自定义输入框 */}
              {option.id === 'custom' && showInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 overflow-hidden"
                >
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="例如：北漂程序员、三胎妈妈、退休教师..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-xh-gold transition-colors"
                    maxLength={20}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 text-right">
                    {customTag.length}/20
                  </p>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 底部按钮 */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-medium text-center transition-all ${
            isValid
              ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            确认身份，进入脑洞广场
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
