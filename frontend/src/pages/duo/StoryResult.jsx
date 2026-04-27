import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, BookOpen, RotateCcw, Home, User, Heart } from 'lucide-react'

// 预置的故事草案（基于上面的模拟对话）
const storyDraft = `凌晨三点，急诊室的监护仪突然全部静默。

林悦——那个当了八年急诊科护士的姑娘——站在护士站前，看着所有屏幕变成直线。她没有尖叫，只是下意识地按了按呼叫铃，好像确认这是不是一个系统故障。

同一时间，二十八楼的某个出租屋里，陈默从床上弹起来。他的第一反应不是恐惧，而是打开笔记本电脑，输入那串熟悉的IP地址。服务器还在跑。代码还在编译。可微信里没有新消息，微博热搜停在三个小时前，连平时最吵的小区群都安静得可怕。

林悦走出急诊室，走廊的声控灯随着她的脚步一盏盏亮起。她突然很想找个人说话，随便什么人。而陈默走出房间，在便利店的自动门前站了很久——那扇门居然还在"叮咚"地响，这让他差点哭出来。

后来他们相遇了。在一条没有人的街上，林悦穿着沾了碘伏的护士服，陈默抱着一台还在发热的笔记本。他们说的第一句话出奇地一致：

"你也在确认吗？"

确认世界是不是真的只剩下自己了。

林悦说，她在急诊室见过太多"最后一刻"，反而对"空无一人的开始"毫无准备。陈默说，他写了无数行异常处理代码，却从未想过要处理"人类全部消失"这个bug。

他们在便利店门口坐到天亮。林悦教陈默怎么测心率和血压，陈默给林悦看他写的那个能自动播放白噪音的程序——「至少让便利店一直有声音」。

故事还没完。但那个晚上，一个护士和一个程序员，用各自职业的惯性，笨拙地对抗着同一种孤独。

而这，可能就是人类最本质的共鸣。`

const contribution = {
  me: { name: '北漂程序员', percent: 48, color: 'from-blue-500 to-cyan-500' },
  partner: { name: '急诊科护士', percent: 52, color: 'from-xh-accent to-rose-500' },
}

const sparks = [
  { text: '所有监护仪同时静默的那一秒', owner: '急诊科护士' },
  { text: '去便利店找个能发出声音的东西，证明"热闹"还存在', owner: '北漂程序员' },
  { text: '你也在确认吗？', owner: '双方默契' },
]

export default function StoryResult() {
  const navigate = useNavigate()
  const brainhole = JSON.parse(localStorage.getItem('xh_duo_brainhole') || '{}')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 顶部 */}
      <div className="flex items-center px-4 py-4 border-b border-gray-800">
        <button onClick={() => navigate('/duo/chat')} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">故事草案</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 标题区 */}
        <div className="px-6 pt-6 pb-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-xh-gold/20 text-xh-gold px-4 py-1.5 rounded-full text-xs mb-4"
          >
            <Sparkles className="w-3 h-3" />
            AI 串联生成
          </motion.div>
          <h1 className="text-xl font-bold text-white mb-2">静默之后</h1>
          <p className="text-xs text-gray-500">基于脑洞「{brainhole.title}」</p>
        </div>

        {/* 贡献占比 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-4 mb-6 bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30"
        >
          <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            双方贡献占比
          </h3>
          <div className="space-y-3">
            {Object.entries(contribution).map(([key, data]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-white">{data.name}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{data.percent}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: data.percent + '%' }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${data.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 火花摘录 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-4 mb-6"
        >
          <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-xh-accent" />
            对话中的火花
          </h3>
          <div className="space-y-2">
            {sparks.map((spark, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="bg-gradient-to-r from-xh-accent/10 to-rose-500/10 rounded-xl p-3 border border-xh-accent/20"
              >
                <p className="text-xs text-gray-300 italic leading-relaxed">"{spark.text}"</p>
                <p className="text-[10px] text-gray-500 mt-1">—— {spark.owner}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 故事正文 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-4 mb-6 bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-5 border border-gray-700/30"
        >
          <div className="prose prose-invert prose-sm max-w-none">
            {storyDraft.split('\n\n').map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-sm text-gray-300 leading-[1.8] mb-4 last:mb-0"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* 底部操作 */}
        <div className="px-4 pb-8 space-y-3">
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-xh-gold/20 to-orange-500/20 border border-xh-gold/30 text-xh-gold py-3 rounded-xl text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            保存故事草案
          </button>
          <button
            onClick={() => navigate('/duo/chat')}
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-400 py-3 rounded-xl text-sm font-medium hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            返回继续对话
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 bg-gray-800/50 text-gray-500 py-3 rounded-xl text-sm font-medium hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </motion.div>
  )
}
