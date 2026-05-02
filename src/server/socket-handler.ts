/**
 * Socket.io 事件处理器
 *
 * 处理客户端连接、房间加入/离开、消息转发等事件。
 * v5.0: 新增故事大厅多人对白室事件
 */

import { Server as SocketIOServer, Socket } from 'socket.io'

interface JoinRoomData {
  roomId: string
  userId: string
  identity: string
}

interface LeaveRoomData {
  roomId: string
  userId: string
}

interface SendMessageData {
  roomId: string
  message: unknown
}

interface MarkSparkData {
  roomId: string
  messageId: string
  markedBy: string
}

// v5.0: 故事大厅事件数据类型
interface JoinStoryData {
  storyId: string
  userId: string
  identity: string
}

interface SendStoryMessageData {
  storyId: string
  message: unknown
}

interface DirectorControlData {
  storyId: string
  directorId: string
}

interface BranchVoteData {
  storyId: string
  branchId: string
  optionIdx: number
  votedBy: string
}

export function registerSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Connected:', socket.id)

    // ==================== 原有房间事件 ====================

    // 加入房间
    socket.on('join-room', ({ roomId, userId, identity }: JoinRoomData) => {
      socket.join(roomId)
      socket.to(roomId).emit('user-joined', {
        userId,
        identity,
        socketId: socket.id,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} (${identity}) joined room ${roomId}`)
    })

    // 离开房间
    socket.on('leave-room', ({ roomId, userId }: LeaveRoomData) => {
      socket.leave(roomId)
      socket.to(roomId).emit('user-left', {
        userId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} left room ${roomId}`)
    })

    // 转发消息（消息已存入数据库，此处仅做实时广播）
    socket.on('send-message', ({ roomId, message }: SendMessageData) => {
      io.to(roomId).emit('new-message', message)
    })

    // 火花标记广播
    socket.on('mark-spark', ({ roomId, messageId, markedBy }: MarkSparkData) => {
      io.to(roomId).emit('spark-marked', {
        messageId,
        markedBy,
        timestamp: Date.now(),
      })
    })

    // 正在输入提示
    socket.on('typing', ({ roomId, userId, identity }: { roomId: string; userId: string; identity: string }) => {
      socket.to(roomId).emit('user-typing', { userId, identity })
    })

    // ==================== v5.0: 故事大厅事件 ====================

    // 加入故事房间
    socket.on('join-story', ({ storyId, userId, identity }: JoinStoryData) => {
      const roomKey = `story-${storyId}`
      socket.join(roomKey)
      socket.to(roomKey).emit('story-user-joined', {
        userId,
        identity,
        socketId: socket.id,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} (${identity}) joined story ${storyId}`)
    })

    // 离开故事房间
    socket.on('leave-story', ({ storyId, userId }: { storyId: string; userId: string }) => {
      const roomKey = `story-${storyId}`
      socket.leave(roomKey)
      socket.to(roomKey).emit('story-user-left', {
        userId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} left story ${storyId}`)
    })

    // 发送故事消息（数据库已保存，此处广播）
    socket.on('send-story-message', ({ storyId, message }: SendStoryMessageData) => {
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('new-story-message', message)
    })

    // 导演暂停
    socket.on('director-pause', ({ storyId, directorId }: DirectorControlData) => {
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('director-pause', {
        storyId,
        directorId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] Director ${directorId} paused story ${storyId}`)
    })

    // 导演继续
    socket.on('director-resume', ({ storyId, directorId }: DirectorControlData) => {
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('director-resume', {
        storyId,
        directorId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] Director ${directorId} resumed story ${storyId}`)
    })

    // 分支提案
    socket.on('branch-proposed', ({ storyId, branch }: { storyId: string; branch: unknown }) => {
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('branch-proposed', branch)
    })

    // 分支投票
    socket.on('branch-vote', ({ storyId, branchId, optionIdx, votedBy }: BranchVoteData) => {
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('branch-vote', {
        branchId,
        optionIdx,
        votedBy,
        timestamp: Date.now(),
      })
    })

    // 正在输入提示（故事大厅版本）
    socket.on('story-typing', ({ storyId, userId, identity }: { storyId: string; userId: string; identity: string }) => {
      const roomKey = `story-${storyId}`
      socket.to(roomKey).emit('story-user-typing', { userId, identity })
    })

    // 断开连接
    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', socket.id, reason)
    })
  })
}
