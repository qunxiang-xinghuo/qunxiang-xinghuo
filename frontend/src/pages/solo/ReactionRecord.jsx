import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, MicOff, Send, Sparkles, Clock, User, Loader2 } from 'lucide-react'
import axios from 'axios'

// AI引导提问（模拟）
const aiPrompts = [
  '第一反应是什么？不要思考，直接说出来。',
  '如果你是故事里的主角，下一步会怎么做？',
  '这个情境让你联想到自己生活中的哪件事？',
  '从你这个身份的角度，最在意的是什么？',
  '如果要用一句话总结你的感受，会是什么？',
  '你觉得这个情境里最不合理的部分是什么？',
]

export default function ReactionRecord() {
  const navigate = useNavigate()
  const [brainhole, setBrainhole] = useState(null)
  const [identity, setIdentity] = useState(null)
  const [content, setContent] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef(null)

  // 加载数据
  useEffect(() => {
    const bh = localStorage.getItem('xh_current_brainhole')
    const id = localStorage.getItem('xh_identity')
    if (bh) setBrainhole(JSON.parse(bh))
    if (id) setIdentity(JSON.parse(id))
  }, [])

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  // 模拟语音输入（使用Web Speech API）
  const toggleRecording = () => {
    if (!isRecording) {
      // 检查浏览器支持
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('您的浏览器不支持语音输入，请直接打字')
        return
      }
      
      const recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          setContent(prev => prev + finalTranscript)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('语音识别错误:', event.error)
        setIsRecording(false)
      }
      
      recognition.onend = () => {
        setIsRecording(false)
      }
      
      recognition.start()
      setIsRecording(true)
      
      // 保存引用以便停止
      window.currentRecognition = recognition
    } else {
      if (window.currentRecognition) {
        window.currentRecognition.stop()
      }
      setIsRecording(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // 准备数据
      const reactionData = {
        user_id: identity?.label || 'anonymous',
        brainhole_id: brainhole?.id || 'unknown',
        identity_label: identity?.label || '匿名用户',
        content: content.trim(),
        ai_prompts: aiPrompts[currentPrompt]
      }
      
      // 发送到后端
      await axios.post('/api/reactions', reactionData)
      
      // 保存到本地（离线备份）
      const localReactions = JSON.parse(localStorage.getItem('xh_reactions') || '[]')
      localReactions.push({
        ...reactionData,
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString()
      })
      localStorage.setItem('xh_reactions', JSON.stringify(localReactions))
      
      navigate('/solo/feedback')
    } catch (err) {
      console.error('提交失败:', err)
      // 即使API失败也保存到本地并跳转
      const localReactions = JSON.parse(localStorage.getItem('xh_reactions') || '[]')
      localReactions.push({
        user_id: identity?.label || 'anonymous',
        brainhole_id: brainhole?.id || 'unknown',
        identity_label: identity?.label || '匿名用户',
        content: content.trim(),
        ai_prompts: aiPrompts[currentPrompt],
        id: 'local_' + Date.now(),
        created_at: new Date().toISOString()
      })
      localStorage.setItem('xh_reactions', JSON.stringify(localReactions))
      navigate('/solo/feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!brainhole || !identity) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-xh-gold animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 顶部导航 */}
      <div className="flex items-center px-4 py-4">
        <button
          onClick={() => navigate('/solo/match')}
          className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">
          记录反应
        </h2>
      </div>

      {/* 脑洞情境卡片 */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-xh-card to-gray-800 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-xh-gold" />
            <span className="text-xs text-xh-gold">当前脑洞</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{brainhole.title}</p>
        </div>
      </div>

      {/* 身份标签 */}
      <div className="px-4 mb-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-xh-accent/20 text-xh-accent px-3 py-1.5 rounded-full">
          <User className="w-3 h-3" />
          <span className="text-xs font-medium">{identity.label}</span>
        </div>
        <span className="text-xs text-gray-500">正在发言</span>
      </div>

      {/* AI引导提问 */}
      <div className="px-4 mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPrompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-violet-300 mb-1">AI 引导提问</p>
                <p className="text-sm text-gray-300">{aiPrompts[currentPrompt]}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* 切换引导 */}
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {aiPrompts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPrompt(i)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] transition-colors ${
                i === currentPrompt
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
              }`}
            >
              引导 {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="relative flex-1 bg-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在这里写下你的第一反应..."
            className="w-full h-full bg-transparent p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
          />
          
          {/* 字数统计 */}
          <div className="absolute bottom-3 right-3 text-[10px] text-gray-600">
            {content.length} 字
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between py-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isRecording
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? '停止录音' : '语音输入'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all ${
              content.trim() && !isSubmitting
                ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? '提交中...' : '记录这个反应'}
          </motion.button>
        </div>
      </div>

      {/* 时间戳 */}
      <div className="px-4 pb-4 flex items-center justify-center gap-1 text-[10px] text-gray-600">
        <Clock className="w-3 h-3" />
        {new Date().toLocaleString('zh-CN')}
      </div>
    </motion.div>
  )
}
