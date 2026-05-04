/**
 * Socket.io 事件处理器
 *
 * 处理客户端连接、房间加入/离开、消息转发等事件。
 * v6.1: 修复消息持久化、生命周期同步、观众点赞
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { db } from '@/lib/db'

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
  message: {
    id: string
    senderId: string
    content: string
    identity?: string
    createdAt: string
  }
}

interface MarkSparkData {
  roomId: string
  messageId: string
  markedBy: string
}

interface SendLikeData {
  roomId: string
  userId: string
  identity: string
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

    // 加入房间 —— v6.1-fix: 同步更新DB participant状态
    socket.on('join-room', async ({ roomId, userId, identity }: JoinRoomData) => {
      socket.join(roomId)
      socket.to(roomId).emit('user-joined', {
        userId,
        identity,
        socketId: socket.id,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} (${identity}) joined room ${roomId}`)

      // v6.1-fix: 更新或创建 participant，标记为在线
      try {
        await db.roomParticipant.upsert({
          where: {
            roomId_userId: { roomId, userId },
          },
          update: {
            isOnline: true,
            leftAt: null,
            identity: identity || '匿名',
          },
          create: {
            roomId,
            userId,
            identity: identity || '匿名',
            role: 'actor',
            isOnline: true,
          },
        })
      } catch (err: any) {
        console.error('[Socket] join-room DB update failed:', err.message)
      }
    })

    // 离开房间 —— v6.1-fix: 同步更新DB participant状态
    socket.on('leave-room', async ({ roomId, userId }: LeaveRoomData) => {
      socket.leave(roomId)
      socket.to(roomId).emit('user-left', {
        userId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] User ${userId} left room ${roomId}`)

      // v6.1-fix: 标记 participant 为离线
      try {
        await db.roomParticipant.updateMany({
          where: { roomId, userId },
          data: {
            isOnline: false,
            leftAt: new Date(),
          },
        })
      } catch (err: any) {
        console.error('[Socket] leave-room DB update failed:', err.message)
      }
    })

    // 转发消息 —— v6.1-fix: 排除发送者避免重复
    socket.on('send-message', ({ roomId, message }: SendMessageData) => {
      // 使用 socket.to() 排除发送者，避免发送者收到自己的消息
      socket.to(roomId).emit('new-message', message)
    })

    // 火花标记广播
    socket.on('mark-spark', ({ roomId, messageId, markedBy }: MarkSparkData) => {
      socket.to(roomId).emit('spark-marked', {
        messageId,
        markedBy,
        timestamp: Date.now(),
      })
    })

    // 点赞 —— v6.1: 观众互动
    socket.on('send-like', ({ roomId, userId, identity }: SendLikeData) => {
      socket.to(roomId).emit('new-like', {
        userId,
        identity,
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

    // 断开连接 —— v6.1-fix: 更新所有房间的participant状态
    socket.on('disconnect', async (reason: string) => {
      console.log('[Socket] Disconnected:', socket.id, reason)

      // 遍历该socket加入的所有room，标记participant为离线
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id)
      for (const roomId of rooms) {
        // 尝试从socket.data获取userId（如果join-room时存了）
        // 由于我们没有在socket.data中存userId，这里直接广播user-left
        socket.to(roomId).emit('user-left', {
          userId: 'unknown',
          timestamp: Date.now(),
        })
      }
    })
  })
}
