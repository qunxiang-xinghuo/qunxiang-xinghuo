/**
 * @fileoverview Socket.io 服务器
 * 实现双人创作的实时通信功能
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Socket.io 服务器实例（单例）
let io: SocketIOServer | null = null;

// 房间数据结构
interface Room {
  id: string;
  sceneId: string;
  users: Map<string, UserInfo>;
  messages: Message[];
  createdAt: Date;
}

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
  timestamp: Date;
}

// 房间存储
const rooms = new Map<string, Room>();

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    console.log('[Socket.IO] Already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://qunxiangxinghuo.cn', 'https://www.qunxiangxinghuo.cn']
        : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  console.log('[Socket.IO] Server initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] User connected: ${socket.id}`);

    // 加入房间
    socket.on('join-room', (data: { roomId: string; userInfo: Omit<UserInfo, 'socketId' | 'isReady'> }) => {
      const { roomId, userInfo } = data;
      
      let room = rooms.get(roomId);
      
      // 如果房间不存在，创建新房间
      if (!room) {
        room = {
          id: roomId,
          sceneId: '',
          users: new Map(),
          messages: [],
          createdAt: new Date(),
        };
        rooms.set(roomId, room);
        console.log(`[Socket.IO] Room created: ${roomId}`);
      }

      // 检查房间是否已满（最多2人）
      if (room.users.size >= 2) {
        socket.emit('error', { message: '房间已满，最多支持2人' });
        return;
      }

      // 检查角色是否已被占用
      for (const [, user] of room.users) {
        if (user.roleId === userInfo.roleId) {
          socket.emit('error', { message: `角色 "${userInfo.roleName}" 已被选择` });
          return;
        }
      }

      // 加入房间
      socket.join(roomId);
      
      const fullUserInfo: UserInfo = {
        ...userInfo,
        socketId: socket.id,
        isReady: false,
      };
      
      room.users.set(socket.id, fullUserInfo);
      
      console.log(`[Socket.IO] User ${socket.id} joined room ${roomId} as ${userInfo.roleName}`);

      // 通知房间内其他用户
      socket.to(roomId).emit('user-joined', {
        userInfo: fullUserInfo,
        users: Array.from(room.users.values()),
      });

      // 发送房间状态给新用户
      socket.emit('room-joined', {
        roomId,
        users: Array.from(room.users.values()),
        messages: room.messages,
      });
    });

    // 用户准备就绪
    socket.on('user-ready', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      const user = room.users.get(socket.id);
      if (user) {
        user.isReady = true;
        
        // 检查是否所有用户都准备好了
        const allReady = Array.from(room.users.values()).every(u => u.isReady);
        
        if (allReady && room.users.size === 2) {
          // 通知所有用户可以开始对话
          io?.to(roomId).emit('session-started', {
            users: Array.from(room.users.values()),
          });
          console.log(`[Socket.IO] Session started in room ${roomId}`);
        }
      }
    });

    // 发送消息
    socket.on('send-message', (data: { roomId: string; message: Omit<Message, 'id' | 'timestamp'> }) => {
      const { roomId, message } = data;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      const user = room.users.get(socket.id);
      if (!user) return;

      const fullMessage: Message = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      };

      // 保存消息到房间
      room.messages.push(fullMessage);

      // 广播消息到房间内所有用户
      io?.to(roomId).emit('new-message', fullMessage);
      
      console.log(`[Socket.IO] Message in room ${roomId}: ${user.roleName}: ${message.content.substring(0, 30)}...`);
    });

    // 发送内心独白（只有发送者能看到完整内容，其他人只看到提示）
    socket.on('send-inner-thought', (data: { roomId: string; content: string }) => {
      const { roomId, content } = data;
      const room = rooms.get(roomId);
      
      if (!room) return;
      
      const user = room.users.get(socket.id);
      if (!user) return;

      // 发送完整内容给发送者
      socket.emit('inner-thought-sent', {
        roleId: user.roleId,
        content,
        timestamp: new Date(),
      });

      // 只发送提示给其他用户
      socket.to(roomId).emit('inner-thought-received', {
        roleId: user.roleId,
        roleName: user.roleName,
        timestamp: new Date(),
      });
    });

    // 触发 AI 催化
    socket.on('request-catalyst', async (data: { roomId: string; messageCount: number; lastMessage: string }) => {
      const { roomId, messageCount, lastMessage } = data;
      const room = rooms.get(roomId);
      
      if (!room) return;

      try {
        // 调用 AI 催化 API
        const response = await fetch('http://localhost:5000/api/ai/catalyst', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneId: room.sceneId,
            messageCount,
            lastMessage,
          }),
        });

        const result = await response.json();
        
        // 广播催化提示到房间
        io?.to(roomId).emit('catalyst-received', {
          catalyst: result.catalyst,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('[Socket.IO] Catalyst error:', error);
        socket.emit('error', { message: 'AI 催化请求失败' });
      }
    });

    // 标记高光时刻
    socket.on('mark-spark', (data: { roomId: string; messageId: string; note: string }) => {
      const { roomId, messageId, note } = data;
      
      // 广播高光标记到房间
      io?.to(roomId).emit('spark-marked', {
        messageId,
        roleId: rooms.get(roomId)?.users.get(socket.id)?.roleId,
        note,
        timestamp: new Date(),
      });
    });

    // 双人创作房间事件
    socket.on('room:join', (data: { roomId: string; role: 'A' | 'B' }) => {
      const { roomId, role } = data;
      socket.join(roomId);
      console.log(`[Socket.IO] User ${socket.id} joined room ${roomId} as ${role}`);
      socket.to(roomId).emit('room:user-joined', { socketId: socket.id, role });
    });

    // 发送消息
    socket.on('room:message', (data: { roomId: string; message: unknown }) => {
      const { roomId, message } = data;
      socket.to(roomId).emit('room:message-received', message);
      console.log(`[Socket.IO] Message in room ${roomId}`);
    });

    // 房间状态更新
    socket.on('room:status-update', (data: { roomId: string; status: unknown }) => {
      const { roomId, status } = data;
      socket.to(roomId).emit('room:status-updated', status);
    });

    // 离开房间
    socket.on('room:leave', (data: { roomId: string }) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.to(roomId).emit('room:user-left', { socketId: socket.id });
      console.log(`[Socket.IO] User ${socket.id} left room ${roomId}`);
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.id}`);
      
      // 从所有房间中移除用户
      for (const [roomId, room] of rooms) {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          
          // 通知房间内其他用户
          io?.to(roomId).emit('user-left', {
            socketId: socket.id,
            users: Array.from(room.users.values()),
          });
          
          // 如果房间为空，删除房间
          if (room.users.size === 0) {
            rooms.delete(roomId);
            console.log(`[Socket.IO] Room deleted: ${roomId}`);
          }
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
