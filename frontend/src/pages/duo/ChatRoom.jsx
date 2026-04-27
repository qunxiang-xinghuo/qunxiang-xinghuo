import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Sparkles, Flame, X, Zap, Users, Copy, Check, Link2, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'

// WebSocket 连接地址
const WS_URL = import.meta.env.VITE_WS_URL || (() => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
})()

export default function ChatRoom() {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const wsRef = useRef(null)
  const inputRef = useRef(null)

  // 房间和身份信息
  const [roomInfo, setRoomInfo] = useState(null)
  const [identity, setIdentity] = useState(null)

  // WebSocket状态
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)

  // 聊天状态
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [typingUser, setTypingUser] = useState(null)

  // AI催化
  const [catalyst, setCatalyst] = useState(null)

  // 火花墙
  const [showSparkWall, setShowSparkWall] = useState(false)
  const [sparks, setSparks] = useState([])

  // 房间信息弹窗
  const [showRoomInfo, setShowRoomInfo] = useState(false)
  const [copied, setCopied] = useState(false)

  // 读取本地存储
  useEffect(() => {
    const room = localStorage.getItem('xh_duo_room')
    const id = localStorage.getItem('xh_identity')
    if (!room || !id) {
      navigate('/duo/lobby')
      return
    }
    setRoomInfo(JSON.parse(room))
    setIdentity(JSON.parse(id))
  }, [navigate])

  // 建立WebSocket连接
  useEffect(() => {
    if (!roomInfo || !identity) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('✅ WebSocket 已连接')
      setConnected(true)
      setConnecting(false)
      // 发送加入房间消息
      ws.send(JSON.stringify({
        type: 'join',
        roomId: roomInfo.roomId,
        identity: identity.label
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWsMessage(data)
    }

    ws.onclose = () => {
      console.log('❌ WebSocket 已断开')
      setConnected(false)
      setConnecting(false)
    }

    ws.onerror = (err) => {
      console.error('WebSocket 错误:', err)
      setConnected(false)
      setConnecting(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [roomInfo, identity])

  // 处理WebSocket消息
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'chat_history':
        setMessages(data.messages.map(m => ({
          id: m.id,
          type: 'chat',
          identity: m.identity,
          content: m.content,
          isSpark: m.isSpark,
          time: formatTime(m.time)
        })))
        break

      case 'message':
        setMessages(prev => [...prev, {
          id: data.id || Date.now(),
          type: 'chat',
          identity: data.identity,
          content: data.content,
          isSpark: data.isSpark,
          time: formatTime(data.time)
        }])
        // 如果是火花消息，更新火花墙
        if (data.isSpark) {
          setSparks(prev => [...prev, {
            id: data.id,
            identity: data.identity,
            content: data.content,
            time: formatTime(data.time)
          }])
        }
        break

      case 'user_joined':
        setMessages(prev => [...prev, {
          id: 'sys_' + Date.now(),
          type: 'system',
          content: data.message
        }])
        setUsers(prev => {
          if (!prev.includes(data.identity)) return [...prev, data.identity]
          return prev
        })
        break

      case 'user_left':
        setMessages(prev => [...prev, {
          id: 'sys_' + Date.now(),
          type: 'system',
          content: data.message
        }])
        setUsers(prev => prev.filter(u => u !== data.identity))
        break

      case 'typing':
        if (data.isTyping) {
          setTypingUser(data.identity)
        } else if (typingUser === data.identity) {
          setTypingUser(null)
        }
        break

      case 'ai_catalyst':
        setCatalyst({ content: data.content, time: Date.now() })
        break

      case 'room_ready':
        setMessages(prev => [...prev, {
          id: 'sys_' + Date.now(),
          type: 'system',
          content: data.message
        }])
        break

      case 'spark_wall':
        setSparks(data.sparks.map(s => ({
          id: s.id,
          identity: s.identity,
          content: s.content,
          time: formatTime(s.time)
        })))
        break

      case 'error':
        console.error('服务器错误:', data.message)
        break

      default:
        console.log('未知消息类型:', data.type)
    }
  }, [typingUser])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 发送消息
  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: input.trim()
    }))

    setInput('')
    // 停止输入中状态
    wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: false }))
  }

  // 输入中状态
  const handleInputChange = (value) => {
    setInput(value)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: value.length > 0
      }))
    }
  }

  // 标记火花（手动）
  const markSpark = async (msgId) => {
    if (!roomInfo) return
    try {
      await axios.post(`/api/rooms/${roomInfo.roomId}/spark`, { message_id: msgId })
      // 本地更新
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isSpark: true } : m))
    } catch (err) {
      console.error('标记火花失败:', err)
    }
  }

  // 复制房间号
  const copyRoomId = () => {
    if (!roomInfo) return
    navigator.clipboard.writeText(roomInfo.roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  if (!roomInfo || !identity) {
    return (
      <div className="h-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-xh-gold animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col relative"
    >
      {/* 顶部导航 */}
      <div className="bg-xh-dark/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors mr-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-white truncate">双人对白室</h2>
              {connected ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
            </div>
            <p className="text-[10px] text-gray-500 truncate">{roomInfo.brainhole?.title}</p>
          </div>

          {/* 在线人数 */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-gray-400 text-xs mr-2">
            <Users className="w-3 h-3" />
            <span>{users.length + 1}</span>
          </div>

          {/* 房间信息按钮 */}
          <button
            onClick={() => setShowRoomInfo(true)}
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors mr-2"
          >
            <Link2 className="w-4 h-4" />
          </button>

          {/* 火花墙按钮 */}
          <button
            onClick={() => setShowSparkWall(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-xh-gold/20 text-xh-gold text-xs border border-xh-gold/30"
          >
            <Flame className="w-3 h-3" />
            火花
            {sparks.length > 0 && (
              <span className="bg-xh-gold text-xh-primary text-[10px] px-1.5 rounded-full font-bold">{sparks.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* 连接状态条 */}
      <AnimatePresence>
        {connecting && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-violet-500/20 border-b border-violet-500/30 px-4 py-2 overflow-hidden"
          >
            <p className="text-xs text-violet-300 text-center">正在连接服务器...</p>
          </motion.div>
        )}
        {!connected && !connecting && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 overflow-hidden"
          >
            <p className="text-xs text-red-300 text-center">连接已断开，请刷新页面重试</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对话流 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {/* 脑洞情境 */}
        <div className="text-center mb-4">
          <div className="inline-block bg-gradient-to-r from-xh-card to-gray-800 rounded-full px-4 py-1.5 text-xs text-gray-400 border border-gray-700/30">
            💡 {roomInfo.brainhole?.title}
          </div>
        </div>

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            )
          }

          const isMe = msg.identity === identity.label
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* 身份标签 */}
                <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isMe ? 'bg-blue-500' : 'bg-xh-accent'}`}>
                    {msg.identity?.[0] || '?'}
                  </div>
                  <span className="text-[10px] text-gray-500">{msg.identity}</span>
                  {msg.isSpark && (
                    <Flame className="w-3 h-3 text-xh-gold" />
                  )}
                </div>

                {/* 气泡 */}
                <div
                  className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed cursor-pointer group ${
                    isMe
                      ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white rounded-br-md'
                      : 'bg-gray-800 text-gray-200 rounded-bl-md'
                  }`}
                  onDoubleClick={() => !msg.isSpark && markSpark(msg.id)}
                >
                  {msg.content}
                  {/* 火花标记按钮（hover显示） */}
                  {!msg.isSpark && (
                    <button
                      onClick={() => markSpark(msg.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="标记为火花"
                    >
                      <Flame className="w-3 h-3 text-xh-gold" />
                    </button>
                  )}
                  {msg.isSpark && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-xh-gold rounded-full flex items-center justify-center">
                      <Flame className="w-3 h-3 text-xh-primary" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 mt-1">{msg.time}</span>
              </div>
            </div>
          )
        })}

        {/* 输入中提示 */}
        <AnimatePresence>
          {typingUser && typingUser !== identity.label && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI催化引导 */}
      <AnimatePresence>
        {catalyst && (
          <motion.div
            key={catalyst.time}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="mx-4 mb-2"
          >
            <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-3 border border-violet-500/30 relative">
              <button
                onClick={() => setCatalyst(null)}
                className="absolute top-1 right-1 p-1 text-gray-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-violet-300 mb-0.5">AI 催化引导</p>
                  <p className="text-xs text-gray-300">{catalyst.content}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入区 */}
      <div className="p-4 border-t border-gray-800 bg-xh-primary">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700/50 px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={connected ? "写下你的反应..." : "连接中..."}
              rows={1}
              disabled={!connected}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none max-h-24 disabled:opacity-50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            className={`p-3 rounded-full transition-all ${
              input.trim() && connected
                ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          双击消息或点击 🔥 可标记为火花
        </p>
      </div>

      {/* 房间信息弹窗 */}
      <AnimatePresence>
        {showRoomInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={() => setShowRoomInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 border border-gray-700 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">房间信息</h3>
                <button onClick={() => setShowRoomInfo(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">房间号</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-mono text-xh-gold font-bold">{roomInfo.roomId}</code>
                    <button onClick={copyRoomId} className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">分享链接</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-xs text-gray-300 truncate">
                      {`${window.location.origin}/duo/lobby?room=${roomInfo.roomId}`}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/duo/lobby?room=${roomInfo.roomId}`)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">当前话题</p>
                  <p className="text-sm text-white">{roomInfo.brainhole?.title}</p>
                </div>

                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 mb-1">在线人员</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">{identity.label} (你)</span>
                    {users.map(u => (
                      <span key={u} className="text-xs text-xh-accent bg-xh-accent/10 px-2 py-1 rounded-full">{u}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 火花墙侧边栏 */}
      <AnimatePresence>
        {showSparkWall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setShowSparkWall(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-[85%] h-full bg-xh-dark border-l border-gray-800 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-xh-gold" />
                  <h3 className="text-white font-medium">火花墙</h3>
                </div>
                <button onClick={() => setShowSparkWall(false)} className="p-2 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {sparks.length === 0 ? (
                  <div className="text-center py-10">
                    <Flame className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">还没有碰撞出火花</p>
                    <p className="text-xs text-gray-600 mt-1">双击消息或点击 🔥 标记精彩对白</p>
                  </div>
                ) : (
                  sparks.map((spark, i) => (
                    <motion.div
                      key={spark.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-gradient-to-r from-xh-gold/10 to-orange-500/10 rounded-xl p-3 border border-xh-gold/20"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Flame className="w-3 h-3 text-xh-gold" />
                        <span className="text-[10px] text-xh-gold font-medium">火花 {i + 1}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{spark.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-500">{spark.identity}</span>
                        <span className="text-[10px] text-gray-600">{spark.time}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
