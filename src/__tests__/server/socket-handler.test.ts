import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client'
import { registerSocketHandlers } from '@/server/socket-handler'
import { setIO } from '@/server/io'

describe('Socket.io real-time communication', () => {
  let httpServer: ReturnType<typeof createServer>
  let io: SocketIOServer
  let clientSocket1: ClientSocket
  let clientSocket2: ClientSocket
  const port = 3456 // 使用不常用端口避免冲突

  beforeAll(async () => {
    httpServer = createServer()
    io = new SocketIOServer(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
    })
    registerSocketHandlers(io)
    setIO(io)

    await new Promise<void>((resolve) => {
      httpServer.listen(port, resolve)
    })

    clientSocket1 = ClientIO(`http://localhost:${port}`, {
      transports: ['websocket'],
    })
    clientSocket2 = ClientIO(`http://localhost:${port}`, {
      transports: ['websocket'],
    })

    // 等待连接建立
    await Promise.all([
      new Promise<void>((resolve) => clientSocket1.on('connect', resolve)),
      new Promise<void>((resolve) => clientSocket2.on('connect', resolve)),
    ])
  })

  afterAll(() => {
    io.close()
    httpServer.close()
    clientSocket1.close()
    clientSocket2.close()
  })

  it('should broadcast new-message to room members', async () => {
    const roomId = 'room_test_1'
    const message = { id: 'msg_1', senderId: 'user_a', content: '你好！' }

    // 两个客户端加入房间
    clientSocket1.emit('join-room', { roomId, userId: 'user_a', identity: '急诊科医生' })
    clientSocket2.emit('join-room', { roomId, userId: 'user_b', identity: '退休阿姨' })

    // 等待加入完成（给服务器一点时间处理）
    await new Promise((r) => setTimeout(r, 50))

    // client2 监听新消息
    const receivedMessage = await new Promise<typeof message>((resolve) => {
      clientSocket2.on('new-message', resolve)
      clientSocket1.emit('send-message', { roomId, message })
    })

    expect(receivedMessage.id).toBe('msg_1')
    expect(receivedMessage.content).toBe('你好！')

    clientSocket2.off('new-message')
  })

  it('should broadcast spark-marked to room members', async () => {
    const roomId = 'room_test_2'

    clientSocket1.emit('join-room', { roomId, userId: 'user_a', identity: '急诊科医生' })
    clientSocket2.emit('join-room', { roomId, userId: 'user_b', identity: '退休阿姨' })

    await new Promise((r) => setTimeout(r, 50))

    const sparkData = await new Promise<{ messageId: string; markedBy: string }>((resolve) => {
      clientSocket2.on('spark-marked', resolve)
      clientSocket1.emit('mark-spark', { roomId, messageId: 'msg_123', markedBy: 'user_a' })
    })

    expect(sparkData.messageId).toBe('msg_123')
    expect(sparkData.markedBy).toBe('user_a')

    clientSocket2.off('spark-marked')
  })

  it('should notify user-joined when someone joins room', async () => {
    const roomId = 'room_test_3'

    clientSocket1.emit('join-room', { roomId, userId: 'user_a', identity: '急诊科医生' })
    await new Promise((r) => setTimeout(r, 50))

    const joinEvent = await new Promise<{ userId: string; identity: string }>((resolve) => {
      clientSocket1.on('user-joined', resolve)
      clientSocket2.emit('join-room', { roomId, userId: 'user_b', identity: '退休阿姨' })
    })

    expect(joinEvent.userId).toBe('user_b')
    expect(joinEvent.identity).toBe('退休阿姨')

    clientSocket1.off('user-joined')
  })

  it('should notify user-left when someone leaves room', async () => {
    const roomId = 'room_test_4'

    clientSocket1.emit('join-room', { roomId, userId: 'user_a', identity: '急诊科医生' })
    clientSocket2.emit('join-room', { roomId, userId: 'user_b', identity: '退休阿姨' })
    await new Promise((r) => setTimeout(r, 50))

    const leaveEvent = await new Promise<{ userId: string }>((resolve) => {
      clientSocket1.on('user-left', resolve)
      clientSocket2.emit('leave-room', { roomId, userId: 'user_b' })
    })

    expect(leaveEvent.userId).toBe('user_b')

    clientSocket1.off('user-left')
  })
})
