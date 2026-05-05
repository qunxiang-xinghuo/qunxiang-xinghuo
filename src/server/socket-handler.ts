/**
 * Socket.io 事件处理器
 *
 * v6.2-fix6: 移除文字广播，改为静默 viewer count 更新（抖音直播间式围观体验）
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

/**
 * 获取房间的在线人数并广播
 * 包括 actor + spectator
 */
async function broadcastViewerCount(io: SocketIOServer, roomId: string) {
  try {
    const count = await db.roomParticipant.count({
      where: {
        roomId,
        isOnline: true,
      },
    });
    io.to(roomId).emit('room-viewer-count', { count, roomId });
  } catch (err: any) {
    console.error('[Socket] broadcastViewerCount failed:', err.message);
  }
}

export function registerSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Connected:', socket.id)

    // v6.3: 跟踪该 socket 加入的所有房间及对应 userId
    const joinedRooms = new Map<string, string>() // roomId -> userId

    // ==================== 原有房间事件 ====================

    // 加入房间 —— v6.2-fix6: 不再广播 user-joined 文字消息，改为静默更新 viewer count
    socket.on('join-room', async ({ roomId, userId, identity }: JoinRoomData) => {
      socket.join(roomId)
      joinedRooms.set(roomId, userId)
      console.log(`[Socket] User ${userId} (${identity}) joined room ${roomId}`)

      // 更新或创建 participant，标记为在线
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

      // v6.2-fix6: 静默广播房间在线人数（不再发送 "Xxx 加入了房间" 文字提示）
      await broadcastViewerCount(io, roomId)
    })

    // 离开房间 —— v6.2-fix6: 同上，静默更新 viewer count
    socket.on('leave-room', async ({ roomId, userId }: LeaveRoomData) => {
      socket.leave(roomId)
      joinedRooms.delete(roomId)
      console.log(`[Socket] User ${userId} left room ${roomId}`)

      // 标记 participant 为离线
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

      // v6.2-fix6: 静默广播房间在线人数
      await broadcastViewerCount(io, roomId)
    })

    // 转发消息 —— v6.1-fix: 排除发送者避免重复
    socket.on('send-message', ({ roomId, message }: SendMessageData) => {
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

    // 断开连接 —— v6.3: 标记离线并静默更新 viewer count
    socket.on('disconnect', async (reason: string) => {
      console.log('[Socket] Disconnected:', socket.id, reason)

      // 遍历该 socket 跟踪的所有房间，标记 participant 为离线
      for (const [roomId, userId] of joinedRooms.entries()) {
        try {
          await db.roomParticipant.updateMany({
            where: { roomId, userId },
            data: {
              isOnline: false,
              leftAt: new Date(),
            },
          })
        } catch (err: any) {
          console.error('[Socket] disconnect DB update failed:', err.message)
        }
        await broadcastViewerCount(io, roomId)
      }
      joinedRooms.clear()
    })
  })
}
