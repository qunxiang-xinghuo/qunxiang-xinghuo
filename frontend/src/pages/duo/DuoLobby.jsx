import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Check, Users, Plus, Link2, Loader2, Sparkles } from 'lucide-react'
import axios from 'axios'

const duoBrainholes = [
  { id: 'bh_d1', title: '如果某天醒来，全世界只剩下你一个人，你会先去哪个地方？为什么？', content: '没有网络，没有外卖，没有声音...', source: '知乎' },
  { id: 'bh_d2', title: '你在工作中做过最"出格"的一次决定是什么？结果如何？', content: '那天下班后，我回了老板一封很长的邮件...', source: '知乎' },
  { id: 'bh_d3', title: '如果你能和任何职业的人互换一天身份，你会选谁？', content: '飞行员、急诊医生、还是幼儿园老师？', source: '知乎' },
]

export default function DuoLobby() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomIdFromUrl = searchParams.get('room')
  
  const [mode, setMode] = useState(roomIdFromUrl ? 'join' : 'create') // create | join
  const [identity, setIdentity] = useState(null)
  const [selectedBrainhole, setSelectedBrainhole] = useState(null)
  const [roomId, setRoomId] = useState(roomIdFromUrl || '')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('xh_identity')
    if (saved) setIdentity(JSON.parse(saved))
  }, [])

  const createRoom = async () => {
    if (!selectedBrainhole) {
      setError('请先选择一个脑洞')
      return
    }
    if (!identity) {
      setError('请先选择身份')
      navigate('/duo/identity')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/rooms/create', {
        brainhole_id: selectedBrainhole.id,
        brainhole_title: selectedBrainhole.title,
        creator_identity: identity.label
      })
      setCreatedRoom(res.data)
      setRoomId(res.data.roomId)
    } catch (err) {
      setError('创建房间失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setError('请输入房间号')
      return
    }
    if (!identity) {
      setError('请先选择身份')
      navigate('/duo/identity')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`/api/rooms/${roomId.trim()}`)
      if (res.data.status === 'closed') {
        setError('该房间已结束')
        setLoading(false)
        return
      }
      // 保存房间信息并进入聊天室
      localStorage.setItem('xh_duo_room', JSON.stringify({
        roomId: roomId.trim(),
        brainhole: { id: res.data.brainhole_id, title: res.data.brainhole_title }
      }))
      navigate('/duo/chat')
    } catch (err) {
      setError('房间不存在或已失效')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (!createdRoom) return
    const url = `${window.location.origin}/duo/lobby?room=${createdRoom.roomId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const copyRoomId = () => {
    if (!createdRoom) return
    navigator.clipboard.writeText(createdRoom.roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const enterRoom = () => {
    if (!createdRoom) return
    localStorage.setItem('xh_duo_room', JSON.stringify({
      roomId: createdRoom.roomId,
      brainhole: { id: selectedBrainhole.id, title: selectedBrainhole.title }
    }))
    navigate('/duo/chat')
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
        <h2 className="flex-1 text-center text-lg font-medium text-white pr-10">
          {mode === 'create' ? '创建房间' : '加入房间'}
        </h2>
      </div>

      {/* 模式切换 */}
      <div className="mx-4 mb-6 bg-gray-800/50 rounded-xl p-1 flex">
        <button
          onClick={() => { setMode('create'); setError(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'create' ? 'bg-xh-accent text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          创建房间
        </button>
        <button
          onClick={() => { setMode('join'); setError(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'join' ? 'bg-xh-accent text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          加入房间
        </button>
      </div>

      {/* 身份显示 */}
      {identity && (
        <div className="mx-4 mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-xh-accent/20 text-xh-accent px-3 py-1.5 rounded-full">
            <Users className="w-3 h-3" />
            <span className="text-xs font-medium">{identity.label}</span>
          </div>
          <span className="text-xs text-gray-500">当前身份</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* 创建房间模式 */}
      {mode === 'create' && !createdRoom && (
        <div className="flex-1 flex flex-col">
          <div className="px-6 mb-4">
            <p className="text-sm text-gray-400">选择一个脑洞，创建房间后把链接发给朋友。</p>
          </div>
          <div className="flex-1 px-4 space-y-3 overflow-y-auto no-scrollbar">
            {duoBrainholes.map((bh, i) => (
              <motion.div
                key={bh.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => { setSelectedBrainhole(bh); setError(''); }}
                className={`relative rounded-2xl p-5 cursor-pointer transition-all border-2 ${
                  selectedBrainhole?.id === bh.id
                    ? 'border-xh-gold bg-xh-gold/10'
                    : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {bh.source}
                  </span>
                  {selectedBrainhole?.id === bh.id && (
                    <span className="text-xs text-xh-gold">已选中</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white leading-relaxed mb-2">{bh.title}</h3>
                <p className="text-xs text-gray-400">{bh.content}</p>
              </motion.div>
            ))}
          </div>
          <div className="p-4">
            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full py-4 rounded-xl font-medium text-center bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? '创建中...' : '创建房间'}
            </button>
          </div>
        </div>
      )}

      {/* 创建成功 - 分享界面 */}
      {mode === 'create' && createdRoom && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col px-4"
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-xh-gold/20 text-xh-gold mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">房间创建成功！</h3>
              <p className="text-sm text-gray-400">把下面的链接或房间号发给朋友</p>
            </div>

            {/* 房间号 */}
            <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mb-3">
              <p className="text-xs text-gray-500 mb-2">房间号</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-lg font-mono text-xh-gold font-bold tracking-wider">
                  {createdRoom.roomId}
                </code>
                <button
                  onClick={copyRoomId}
                  className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 分享链接 */}
            <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mb-6">
              <p className="text-xs text-gray-500 mb-2">分享链接</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-xs text-gray-300 truncate">
                  {`${window.location.origin}/duo/lobby?room=${createdRoom.roomId}`}
                </div>
                <button
                  onClick={copyLink}
                  className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  {copied ? <span className="text-xs text-green-400">已复制</span> : <span className="text-xs">复制</span>}
                </button>
              </div>
            </div>

            {/* 选中的脑洞 */}
            <div className="w-full bg-gradient-to-r from-xh-card to-gray-800 rounded-xl p-3 border border-gray-700/30 mb-6">
              <p className="text-[10px] text-xh-gold mb-1">房间话题</p>
              <p className="text-sm text-white">{selectedBrainhole.title}</p>
            </div>
          </div>

          <div className="pb-4 space-y-3">
            <button
              onClick={enterRoom}
              className="w-full py-4 rounded-xl font-medium text-center bg-gradient-to-r from-xh-accent to-rose-600 text-white shadow-lg flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              进入房间等待队友
            </button>
            <button
              onClick={() => { setCreatedRoom(null); setSelectedBrainhole(null); }}
              className="w-full py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            >
              重新选择脑洞
            </button>
          </div>
        </motion.div>
      )}

      {/* 加入房间模式 */}
      {mode === 'join' && (
        <div className="flex-1 flex flex-col px-4">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 text-violet-400 mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">加入朋友的房间</h3>
                <p className="text-sm text-gray-400">输入房间号或从链接进入</p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 mb-4">
                <label className="text-xs text-gray-500 mb-2 block">房间号</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(''); }}
                  placeholder="例如：ROOM_ABC123"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-xh-gold transition-colors font-mono tracking-wider uppercase"
                />
              </div>

              {roomIdFromUrl && (
                <div className="bg-xh-gold/10 border border-xh-gold/30 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-xh-gold">检测到房间链接，点击加入即可</p>
                </div>
              )}
            </div>
          </div>

          <div className="pb-4">
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full py-4 rounded-xl font-medium text-center bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
              {loading ? '加入中...' : '加入房间'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
