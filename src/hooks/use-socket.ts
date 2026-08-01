/**
 * @file Socket.IO 客户端 Hook
 * @description 封装 Socket.IO 连接管理，提供双人实时角色扮演通信能力
 * 支持事件：消息收发、用户加入/离开、会话开始、内心独白、AI 催化、火花标记
 * 注意：当前实际使用 2 秒轮询降级方案，Socket.IO 作为备用通道
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UserInfo {
  socketId: string;
  userId?: string;
  nickname: string;
  roleId: string;
  roleName: string;
  isReady: boolean;
}

interface Message {
  id: string;
  roomId: string;
  roleId: string;
  roleName: string;
  content: string;
  type: 'dialogue' | 'inner-thought' | 'system' | 'spark';
  timestamp: string;
}

interface UseSocketOptions {
  roomId: string;
  userInfo: {
    nickname: string;
    roleId: string;
    roleName: string;
  };
  onMessage?: (message: Message) => void;
  onUserJoined?: (users: UserInfo[]) => void;
  onUserLeft?: (users: UserInfo[]) => void;
  onSessionStarted?: (users: UserInfo[]) => void;
  onInnerThoughtSent?: (data: { roleId: string; content: string; timestamp: string }) => void;
  onInnerThoughtReceived?: (data: { roleId: string; roleName: string; timestamp: string }) => void;
  onCatalystReceived?: (data: { catalyst: string; timestamp: string }) => void;
  onSparkMarked?: (data: { messageId: string; roleId: string; note: string; timestamp: string }) => void;
  onError?: (error: { message: string }) => void;
}

export function useSocket(options: UseSocketOptions) {
  const { roomId, userInfo, onMessage, onUserJoined, onUserLeft, onSessionStarted, onInnerThoughtSent, onInnerThoughtReceived, onCatalystReceived, onSparkMarked, onError } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const callbacksRef = useRef(options);
  
  // Update ref in effect, not during render
  useEffect(() => {
    callbacksRef.current = options;
  });

  // 连接 Socket.IO
  useEffect(() => {
    const socketInstance = io({
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected:', socketInstance.id);
      setConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
    });

    // 加入房间
    socketInstance.on('room-joined', (data: { roomId: string; users: UserInfo[]; messages: Message[] }) => {
      console.log('[Socket.IO] Joined room:', data.roomId);
      setUsers(data.users);
      setMessages(data.messages);
    });

    // 用户加入
    socketInstance.on('user-joined', (data: { userInfo: UserInfo; users: UserInfo[] }) => {
      console.log('[Socket.IO] User joined:', data.userInfo.nickname);
      setUsers(data.users);
      callbacksRef.current.onUserJoined?.(data.users);
    });

    // 用户离开
    socketInstance.on('user-left', (data: { socketId: string; users: UserInfo[] }) => {
      console.log('[Socket.IO] User left:', data.socketId);
      setUsers(data.users);
      callbacksRef.current.onUserLeft?.(data.users);
    });

    // 会话开始
    socketInstance.on('session-started', (data: { users: UserInfo[] }) => {
      console.log('[Socket.IO] Session started');
      setSessionStarted(true);
      callbacksRef.current.onSessionStarted?.(data.users);
    });

    // 新消息
    socketInstance.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      callbacksRef.current.onMessage?.(message);
    });

    // 内心独白发送成功
    socketInstance.on('inner-thought-sent', (data: { roleId: string; content: string; timestamp: string }) => {
      callbacksRef.current.onInnerThoughtSent?.(data);
    });

    // 收到内心独白提示
    socketInstance.on('inner-thought-received', (data: { roleId: string; roleName: string; timestamp: string }) => {
      callbacksRef.current.onInnerThoughtReceived?.(data);
    });

    // 收到 AI 催化
    socketInstance.on('catalyst-received', (data: { catalyst: string; timestamp: string }) => {
      callbacksRef.current.onCatalystReceived?.(data);
    });

    // 高光标记
    socketInstance.on('spark-marked', (data: { messageId: string; roleId: string; note: string; timestamp: string }) => {
      callbacksRef.current.onSparkMarked?.(data);
    });

    // 错误
    socketInstance.on('error', (error: { message: string }) => {
      console.error('[Socket.IO] Error:', error.message);
      callbacksRef.current.onError?.(error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // 加入房间
  const joinRoom = useCallback(() => {
    if (socket && roomId && userInfo) {
      socket.emit('join-room', { roomId, userInfo });
    }
  }, [socket, roomId, userInfo]);

  // 用户准备就绪
  const userReady = useCallback(() => {
    if (socket && roomId) {
      socket.emit('user-ready', { roomId });
    }
  }, [socket, roomId]);

  // 发送消息
  const sendMessage = useCallback((content: string, type: 'dialogue' | 'system' = 'dialogue') => {
    if (socket && roomId && userInfo) {
      const message = {
        roomId,
        message: {
          roomId,
          roleId: userInfo.roleId,
          roleName: userInfo.roleName,
          content,
          type,
        },
      };
      socket.emit('send-message', message);
    }
  }, [socket, roomId, userInfo]);

  // 发送内心独白
  const sendInnerThought = useCallback((content: string) => {
    if (socket && roomId) {
      socket.emit('send-inner-thought', { roomId, content });
    }
  }, [socket, roomId]);

  // 请求 AI 催化
  const requestCatalyst = useCallback((messageCount: number, lastMessage: string) => {
    if (socket && roomId) {
      socket.emit('request-catalyst', { roomId, messageCount, lastMessage });
    }
  }, [socket, roomId]);

  // 标记高光
  const markSpark = useCallback((messageId: string, note: string) => {
    if (socket && roomId) {
      socket.emit('mark-spark', { roomId, messageId, note });
    }
  }, [socket, roomId]);

  return {
    socket,
    connected,
    users,
    messages,
    sessionStarted,
    joinRoom,
    userReady,
    sendMessage,
    sendInnerThought,
    requestCatalyst,
    markSpark,
  };
}
