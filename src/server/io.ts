/**
 * Socket.io 实例管理
 *
 * 用于在 API 路由中访问 Socket.io 服务器实例，
 * 实现 HTTP API 与 WebSocket 的联动（如发送消息后实时广播）。
 */

import { Server as SocketIOServer } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var _io: SocketIOServer | undefined
}

export function setIO(io: SocketIOServer): void {
  globalThis._io = io
}

export function getIO(): SocketIOServer | undefined {
  return globalThis._io
}

/**
 * 向指定房间广播消息
 * 如果 Socket.io 未初始化，静默忽略（降级为纯 HTTP）
 */
export function broadcastToRoom(roomId: string, event: string, data: unknown): void {
  const io = getIO()
  if (io) {
    io.to(roomId).emit(event, data)
  }
}
