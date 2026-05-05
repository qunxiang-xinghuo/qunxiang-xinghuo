import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import fs from 'fs'
import path from 'path'
import { setIO } from './src/server/io'
import { registerSocketHandlers } from './src/server/socket-handler'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000')

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// v5.3-fix: 静态资源MIME类型映射
const mimeTypes: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // v5.3-fix: 显式处理 _next/static 静态资源（App Router+自定义server兼容）
      if (req.url && req.url.startsWith('/_next/')) {
        const staticPath = path.join(process.cwd(), '.next', req.url.replace('/_next/', ''))
        if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
          const ext = path.extname(staticPath)
          res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          fs.createReadStream(staticPath).pipe(res)
          return
        }
      }

      // v7.0-fix7: 对 /spectate 进行服务端登录检查兜底（中间件对此路由执行异常）
      if (req.url === '/spectate' || req.url?.startsWith('/spectate?')) {
        const cookie = req.headers.cookie || '';
        const hasSession = cookie.includes('next-auth.session-token');
        if (!hasSession) {
          res.statusCode = 307;
          res.setHeader('Location', '/login');
          res.end();
          return;
        }
      }

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
