'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketMessage {
  id: string
  senderId: string
  content: string
  isSpark?: boolean
  createdAt: string | Date
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketUrl = window.location.origin;
    console.log('[Socket] 正在连接 WebSocket:', socketUrl, '/socket.io');
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
      console.error('[Socket] 当前连接地址:', window.location.origin, '/socket.io')
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinRoom = useCallback((roomId: string, userId: string, identity: string) => {
    socketRef.current?.emit('join-room', { roomId, userId, identity })
  }, [])

  const leaveRoom = useCallback((roomId: string, userId: string) => {
    socketRef.current?.emit('leave-room', { roomId, userId })
  }, [])

  const sendMessage = useCallback((roomId: string, message: SocketMessage) => {
    socketRef.current?.emit('send-message', { roomId, message })
  }, [])

  const markSpark = useCallback((roomId: string, messageId: string, markedBy: string) => {
    socketRef.current?.emit('mark-spark', { roomId, messageId, markedBy })
  }, [])

  const notifyTyping = useCallback((roomId: string, userId: string, identity: string) => {
    socketRef.current?.emit('typing', { roomId, userId, identity })
  }, [])

  // v6.1: 观众点赞
  const sendLike = useCallback((roomId: string, userId: string, identity: string) => {
    socketRef.current?.emit('send-like', { roomId, userId, identity })
  }, [])

  const on = useCallback(<T = unknown>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler as (data: unknown) => void)
  }, [])

  const off = useCallback(<T = unknown>(event: string, handler: (data: T) => void) => {
    socketRef.current?.off(event, handler as (data: unknown) => void)
  }, [])

  /**
   * @deprecated 请使用 off(event, handler) 定向移除监听器。
   * removeAllListeners 会移除该事件的所有监听器，可能导致其他组件的监听器被意外断开。
   * 详见 ProblemLog.md 问题7。
   */
  const removeAllListeners = useCallback((event: string) => {
    socketRef.current?.removeAllListeners(event)
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    markSpark,
    notifyTyping,
    sendLike,
    on,
    off,
    removeAllListeners,
  }
}
