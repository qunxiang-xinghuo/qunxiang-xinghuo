/**
 * Socket.io 事件处理器
 *
 * 处理客户端连接、房间加入/离开、消息转发等事件。
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

export function registerSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log('[Socket] Connected:', socket.id)

    // 加入房间
    socket.on('join-room', ({ roomId, userId, identity }: JoinRoomData) => {
      socket.join(roomId)
      // 通知房间内其他人
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
      // 广播给房间内所有人（包括发送者，确保多设备同步）
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

    // 断开连接
    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', socket.id, reason)
    })
  })
}
