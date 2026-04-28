# 群像·星火 部署指南

## 环境要求

- **Node.js**: >= 18.17.0（推荐使用 Node.js 20 LTS）
- **npm**: >= 9.0.0
- **数据库**: SQLite（文件数据库，无需额外安装）

## 一键部署

### Vercel（推荐）

1. Fork 本项目到 GitHub
2. 登录 [Vercel](https://vercel.com)，点击 "New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目，无需额外配置
5. 点击 "Deploy" 开始部署

### Docker 部署

```bash
# 构建镜像
docker build -t xinghuo .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  xinghuo
```

### 传统服务器部署

#### 1. 安装依赖

```bash
npm install
```

#### 2. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:push

# 填充种子数据（可选）
npm run db:seed
```

#### 3. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **提示**: 使用 `openssl rand -base64 32` 生成随机密钥

#### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

#### 5. 使用 PM2 进程管理（生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "xinghuo" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs xinghuo

# 重启服务
pm2 restart xinghuo
```

## 目录结构

```
├── prisma/
│   ├── schema.prisma      # 数据库 schema
│   ├── migrations/        # 数据库迁移
│   ├── seed.ts          # 种子数据
│   └── dev.db           # 开发数据库文件
├── src/
│   ├── app/             # Next.js App Router 页面
│   ├── components/     # React 组件
│   ├── lib/            # 工具库（数据库配置等）
│   ├── server/         # 服务端逻辑
│   └── test/           # 测试配置
└── public/             # 静态资源
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run db:push` | 同步数据库结构 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run test` | 运行测试 |
| `npm run lint` | 运行 ESLint |

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 是 | SQLite 数据库路径 |
| `NEXTAUTH_SECRET` | 是 | NextAuth 加密密钥 |
| `NEXTAUTH_URL` | 是 | 网站 URL（生产环境需使用 HTTPS） |

## 故障排除

### 数据库问题

```bash
# 重置数据库
npm run db:reset

# 重新生成 Prisma Client
npm run db:generate
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 使用其他端口
PORT=3001 npm start
```

### 构建失败

```bash
# 清除缓存重新构建
rm -rf .next
npm run build
```

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: SQLite + Prisma ORM
- **认证**: NextAuth.js
- **样式**: Tailwind CSS 4
- **动画**: Framer Motion
- **状态管理**: React Hooks
- **测试**: Vitest + Testing Library
