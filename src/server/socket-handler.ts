/**
 * Socket.io 事件处理器
 *
 * v6.2-fix6: 移除文字广播，改为静默 viewer count 更新（抖音直播间式围观体验）
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { db } from '@/lib/db'

// v8.0-sec-fix: 简单的 UUID 格式校验
function isValidId(id: string): boolean {
  // v8.5-fix: 支持 CUID 格式（如 cmoy8n6wz0000shb2bkhjby3v）
  return typeof id === 'string' && id.length >= 10 && id.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(id)
}

// v8.0-sec-fix: 验证导演权限
async function verifyDirector(storyId: string, userId: string): Promise<boolean> {
  try {
    const story = await db.story.findUnique({
      where: { id: storyId },
      select: { directorId: true },
    })
    return story?.directorId === userId
  } catch {
    return false
  }
}

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
      // v8.0-sec-fix: 校验 ID 格式
      if (!isValidId(roomId) || !isValidId(userId)) {
        console.warn('[Socket] join-room rejected: invalid id format')
        return
      }
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

    // v8.1-fix5: AI房间用户离开后自动关闭
    // v8.2: 同时自动创建 Asset，防止用户不点击"结束对白"直接离开导致数据丢失
    // v9.1-fix: 延迟关闭 AI 房间，防止 socket 短暂断开导致房间被误关
    const aiRoomCloseTimers = new Map<string, NodeJS.Timeout>();

    async function maybeCloseAiRoom(roomId: string) {
      try {
        const room = await db.room.findUnique({
          where: { id: roomId },
          include: {
            brainhole: { select: { title: true } },
            story: { select: { title: true, act4Truth: true } },
            messages: { orderBy: { createdAt: 'asc' } },
            participants: true,
          },
        });
        if (!room || room.status === 'closed') return;
        if (room.isAiRoom || room.type === 'ai_duet') {
          const onlineActors = await db.roomParticipant.count({
            where: {
              roomId,
              role: 'actor',
              isOnline: true,
              userId: { not: { startsWith: 'agent_' } },
            },
          });
          if (onlineActors === 0) {
            // v9.1-fix: 延迟 30 秒关闭房间，给用户重新连接的时间
            const existingTimer = aiRoomCloseTimers.get(roomId);
            if (existingTimer) clearTimeout(existingTimer);
            const timer = setTimeout(async () => {
              aiRoomCloseTimers.delete(roomId);
              // 再次检查，如果用户已重新连接则不关闭
              const stillOnline = await db.roomParticipant.count({
                where: {
                  roomId,
                  role: 'actor',
                  isOnline: true,
                  userId: { not: { startsWith: 'agent_' } },
                },
              });
              if (stillOnline > 0) {
                console.log(`[Socket] AI房间用户已重新连接，取消关闭: ${roomId}`);
                return;
              }
              // 关闭房间
              await db.room.update({
                where: { id: roomId },
                data: { status: 'closed', closedAt: new Date() },
              });
              console.log(`[Socket] AI房间已自动关闭: ${roomId}`);

              // v8.2: 自动创建 Asset（如果还没有）
              const existingAsset = await db.asset.findFirst({ where: { roomId } });
              if (!existingAsset && room.messages.length > 0) {
                const humanParticipant = room.participants.find(
                  (p) => !p.userId.startsWith('agent_') && p.role === 'actor'
                );
                const content = room.messages.map((m) => `${m.identity}: ${m.content}`).join('\n');
                const sparkCount = room.messages.filter((m) => m.isSpark).length;
                if (humanParticipant) {
                  await db.asset.create({
                    data: {
                      userId: humanParticipant.userId,
                      roomId,
                      brainholeId: room.brainholeId || undefined,
                      title: room.brainhole?.title || room.story?.title || '故事对白',
                      summary: room.story?.act4Truth || '',
                      content: content.slice(0, 5000),
                      identity: humanParticipant.identity || '匿名',
                      messageCount: room.messages.length,
                      sparkCount,
                      isPublic: true,
                    },
                  });
                  console.log(`[Socket] AI房间 Asset 已自动创建: ${roomId}`);
                }
              }
            }, 30000);
            aiRoomCloseTimers.set(roomId, timer);
          }
        }
      } catch (err: any) {
        console.error('[Socket] AI房间自动关闭失败:', err.message);
      }
    }

    // v8.5: 空房间防僵尸 —— 没有实际对话的房间直接关闭
    async function maybeCloseEmptyRoom(roomId: string) {
      try {
        const room = await db.room.findUnique({
          where: { id: roomId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
        if (!room || room.status === 'closed') return;
        // 只处理 invite_duet 和 duet 类型（真人房间）
        if (room.type !== 'invite_duet' && room.type !== 'duet') return;
        // 检查是否有实际对话消息（排除系统消息：senderId 以 agent_ 开头或 userId 为 null）
        const realMessages = room.messages.filter(
          (m) => m.senderId && !m.senderId.startsWith('agent_') && m.content?.length > 0
        );
        if (realMessages.length === 0) {
          await db.room.update({
            where: { id: roomId },
            data: { status: 'closed', closedAt: new Date() },
          });
          console.log(`[Socket] 空房间已自动关闭: ${roomId}`);
        }
      } catch (err: any) {
        console.error('[Socket] 空房间关闭失败:', err.message);
      }
    }

    // 离开房间 —— v6.2-fix6: 同上，静默更新 viewer count
    // v7.0-fix7: 向对方广播 opponent-left 事件
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

      // v7.0-fix7: 向房间内其他人广播对方已离开
      socket.to(roomId).emit('opponent-left', { userId, roomId, timestamp: Date.now() })

      // v6.2-fix6: 静默广播房间在线人数
      await broadcastViewerCount(io, roomId)

      // v8.1-fix5: AI房间用户离开后自动关闭
      await maybeCloseAiRoom(roomId);
      // v8.5: 空房间防僵尸
      await maybeCloseEmptyRoom(roomId);
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
    socket.on('director-pause', async ({ storyId, directorId }: DirectorControlData) => {
      // v8.0-sec-fix: 验证导演身份
      if (!isValidId(storyId) || !isValidId(directorId)) return
      const ok = await verifyDirector(storyId, directorId)
      if (!ok) {
        console.warn(`[Socket] director-pause rejected: ${directorId} is not director of ${storyId}`)
        return
      }
      const roomKey = `story-${storyId}`
      io.to(roomKey).emit('director-pause', {
        storyId,
        directorId,
        timestamp: Date.now(),
      })
      console.log(`[Socket] Director ${directorId} paused story ${storyId}`)
    })

    // 导演继续
    socket.on('director-resume', async ({ storyId, directorId }: DirectorControlData) => {
      // v8.0-sec-fix: 验证导演身份
      if (!isValidId(storyId) || !isValidId(directorId)) return
      const ok = await verifyDirector(storyId, directorId)
      if (!ok) {
        console.warn(`[Socket] director-resume rejected: ${directorId} is not director of ${storyId}`)
        return
      }
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
        // v7.0-fix7: 用户意外断开（关闭浏览器/断网）时，向对方广播 opponent-left
        socket.to(roomId).emit('opponent-left', { userId, roomId, timestamp: Date.now() })
        await broadcastViewerCount(io, roomId)

        // v8.1-fix5: AI房间用户断开后自动关闭
        await maybeCloseAiRoom(roomId);
        // v8.5: 空房间防僵尸
        await maybeCloseEmptyRoom(roomId);
      }
      joinedRooms.clear()
    })
  })
}
