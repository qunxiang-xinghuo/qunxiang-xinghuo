import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { setIO } from './src/server/io'
import { registerSocketHandlers } from './src/server/socket-handler'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000')

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // 初始化 Socket.io
  const io = new SocketIOServer(server, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // 注册 Socket.io 事件处理器
  registerSocketHandlers(io)

  // 暴露 io 实例给 API 路由使用
  setIO(io)

  server.listen(port, hostname, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
  })
})
