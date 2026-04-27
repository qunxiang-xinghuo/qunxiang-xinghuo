import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Wifi, WifiOff, Users, Copy, Check, Link2, Sparkles, Type } from 'lucide-react'

// 自动判断 WebSocket 地址
const WS_URL = (() => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const isDev = import.meta.env.DEV
  if (isDev) return 'ws://localhost:3001'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
})()

function generateRoomId() {
  return 'XH-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateNickname() {
  const pool = ['旅人', '观察者', '棋手', '诗人', '猎手', '舞者', '匠人', '行者', '沉默者', '夜行者']
  const adj = ['孤独的', '热烈的', '温柔的', '锋利的', '慵懒的', '固执的', '自由的', '安静的']
  return adj[Math.floor(Math.random() * adj.length)] + pool[Math.floor(Math.random() * pool.length)]
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function LiveRoom() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roomId = searchParams.get('room')

  const [nickname, setNickname] = useState('')
  const [tempName, setTempName] = useState(generateNickname())
  const [joined, setJoined] = useState(false)

  // Auto-generate room if missing
  useEffect(() => {
    if (!roomId) {
      const newRoom = generateRoomId()
      setSearchParams({ room: newRoom })
    }
  }, [roomId, setSearchParams])

  const handleJoin = () => {
    const name = nickname.trim() || tempName
    setNickname(name)
    setJoined(true)
  }

  // If no roomId yet, show loading
  if (!roomId) {
    return (
      <div className="h-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-xh-gold animate-spin" />
      </div>
    )
  }

  // If not joined, show name input
  if (!joined) {
    return (
      <NameInput
        roomId={roomId}
        nickname={nickname}
        setNickname={setNickname}
        tempName={tempName}
        onJoin={handleJoin}
      />
    )
  }

  // Chat view
  return <ChatView roomId={roomId} nickname={nickname} />
}

function NameInput({ roomId, nickname, setNickname, tempName, onJoin }) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    const url = `${window.location.origin}/live?room=${roomId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-xh-accent/20 flex items-center justify-center mx-auto mb-4">
            <Type className="w-8 h-8 text-xh-accent" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">实时对戏室</h2>
          <p className="text-xs text-gray-500">
            房间号: <span className="text-xh-gold font-mono font-bold">{roomId}</span>
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mb-6">
          <label className="text-xs text-gray-500 mb-2 block">你的昵称</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={tempName}
            maxLength={12}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-xh-gold"
            onKeyDown={(e) => e.key === 'Enter' && onJoin()}
            autoFocus
          />
        </div>

        <button
          onClick={onJoin}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-xh-accent to-rose-600 text-white font-medium shadow-lg mb-4 hover:opacity-90 transition-opacity"
        >
          进入房间
        </button>

        <button
          onClick={copyLink}
          className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
          {copied ? '链接已复制，快发给队友' : '复制房间链接'}
        </button>
      </motion.div>
    </div>
  )
}

function ChatView({ roomId, nickname }) {
  const wsRef = useRef(null)
  const scrollRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [typingUser, setTypingUser] = useState(null)
  const [copied, setCopied] = useState(false)

  // WebSocket connection
  useEffect(() => {
    setConnecting(true)
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setConnecting(false)
      ws.send(JSON.stringify({
        type: 'join',
        roomId: roomId,
        identity: nickname
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'chat_history':
            setMessages(data.messages.map(m => ({
              id: m.id,
              type: 'chat',
              identity: m.identity,
              content: m.content,
              time: formatTime(m.time)
            })))
            break
          case 'message':
            setMessages(prev => [...prev, {
              id: data.id || Date.now(),
              type: 'chat',
              identity: data.identity,
              content: data.content,
              time: formatTime(data.time)
            }])
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
          case 'room_ready':
            setMessages(prev => [...prev, {
              id: 'sys_' + Date.now(),
              type: 'system',
              content: data.message
            }])
            break
          case 'error':
            console.error('Server error:', data.message)
            break
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setConnecting(false)
    }

    ws.onerror = () => {
      setConnected(false)
      setConnecting(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [roomId, nickname])

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'message', content: input.trim() }))
    setInput('')
    wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: false }))
  }

  const handleInputChange = (value) => {
    setInput(value)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: value.length > 0 }))
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/live?room=${roomId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="bg-xh-dark/80 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-white font-mono">{roomId}</h2>
            {connecting && <span className="text-[10px] text-yellow-400">连接中...</span>}
            {!connecting && connected && <Wifi className="w-3 h-3 text-green-400" />}
            {!connecting && !connected && <WifiOff className="w-3 h-3 text-red-400" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800 text-gray-400 text-xs">
              <Users className="w-3 h-3" />
              <span>{users.length + 1}</span>
            </div>
            <button
              onClick={copyLink}
              className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="复制链接"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Connection warning */}
      <AnimatePresence>
        {!connected && !connecting && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 overflow-hidden"
          >
            <p className="text-xs text-red-300 text-center">连接已断开，请刷新页面重连</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">房间已就绪</p>
            <p className="text-xs text-gray-600 mt-1">把链接发给队友，开始实时对戏</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[10px] text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">{msg.content}</span>
              </div>
            )
          }
          const isMe = msg.identity === nickname
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${isMe ? 'bg-blue-500' : 'bg-xh-accent'}`}>
                    {msg.identity?.[0] || '?'}
                  </div>
                  <span className="text-[10px] text-gray-500">{msg.identity}</span>
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white rounded-br-md'
                    : 'bg-gray-800 text-gray-200 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-600 mt-1">{msg.time}</span>
              </div>
            </div>
          )
        })}

        <AnimatePresence>
          {typingUser && typingUser !== nickname && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex justify-start items-center gap-2"
            >
              <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <span className="text-[10px] text-gray-500">{typingUser} 正在输入...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-xh-primary">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700/50 px-4 py-2">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={connected ? '写下你的文字，Enter 发送...' : '连接中...'}
              rows={1}
              disabled={!connected}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none max-h-24 disabled:opacity-50"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            className={`p-3 rounded-full transition-all ${
              input.trim() && connected
                ? 'bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
