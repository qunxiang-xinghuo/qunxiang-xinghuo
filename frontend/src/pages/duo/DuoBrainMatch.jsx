import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Bookmark } from 'lucide-react'

const brainholes = [
  { id: 'bh_d1', title: '如果某天醒来，全世界只剩下你一个人，你会先去哪个地方？为什么？', content: '没有网络，没有外卖，没有声音...', source: '知乎' },
  { id: 'bh_d2', title: '你在工作中做过最"出格"的一次决定是什么？结果如何？', content: '那天下班后，我回了老板一封很长的邮件...', source: '知乎' },
  { id: 'bh_d3', title: '如果你能和任何职业的人互换一天身份，你会选谁？', content: '飞行员、急诊医生、还是幼儿园老师？', source: '知乎' },
]

export default function DuoBrainMatch() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const handleSelect = (bh) => {
    setSelected(bh.id)
    localStorage.setItem('xh_duo_brainhole', JSON.stringify(bh))
    // 短暂延迟后进入匹配等待
    setTimeout(() => {
      navigate('/duo/waiting')
    }, 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 顶部 */}
      <div className="flex items-center px-4 py-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">双人接戏</h2>
      </div>

      <div className="px-6 mb-4">
        <p className="text-sm text-gray-400">选一个让你"有感觉"的脑洞，系统会为你匹配一个同样选中它的陌生人。</p>
      </div>

      {/* 脑洞列表 */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar">
        {brainholes.map((bh, index) => (
          <motion.div
            key={bh.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(bh)}
            className={`relative rounded-2xl p-5 cursor-pointer transition-all border-2 ${
              selected === bh.id
                ? 'border-xh-gold bg-xh-gold/10'
                : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                {bh.source}
              </span>
              {selected === bh.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-xh-gold text-xs"
                >
                  <Heart className="w-3 h-3 fill-current" />
                  已选中
                </motion.div>
              )}
            </div>
            <h3 className="text-base font-bold text-white leading-relaxed mb-2">{bh.title}</h3>
            <p className="text-xs text-gray-400">{bh.content}</p>
            {selected === bh.id && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-center"
              >
                <span className="text-xs text-xh-gold">正在进入匹配...</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
