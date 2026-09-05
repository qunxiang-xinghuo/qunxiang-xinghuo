# 群像·星火 — 创作工坊

## 项目概览
群像·星火是一个角色扮演创作平台网站。核心价值是给两个或多个人一个"舞台"，让不敢说出口的话在角色扮演中被说出来，然后变成故事。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Font**: Noto Serif SC (标题) + Noto Sans SC (正文)
- **Database**: SQLite + Prisma 7
- **Auth**: NextAuth v5
- **AI**: coze-coding-dev-sdk (豆包大模型)
- **Real-time**: Socket.io (双人实时通信)
- **Integration**: 知乎开放平台 API

## 目录结构
```
src/
├── proxy.ts                    # Next.js 16 全局安全代理（限流/可疑请求拦截/登录态校验）
├── app/
│   ├── layout.tsx              # 全局布局（Header + Footer + Providers）
│   ├── page.tsx                # 首页（剧场感门面 + 精选故事）
│   ├── globals.css             # 全局样式 + 品牌色 + 动画
│   ├── login/page.tsx          # 登录页面
│   ├── register/page.tsx       # 注册页面
│   ├── scenes/
│   │   ├── page.tsx            # 场景库列表
│   │   ├── [id]/page.tsx       # 场景详情（票根式卡片）
│   │   ├── [id]/play/page.tsx  # 单人角色扮演交互页面
│   │   └── [id]/multiplayer/page.tsx  # 双人实时角色扮演页面
│   ├── stories/
│   │   ├── page.tsx            # 故事集/心理剧记录
│   │   └── [id]/page.tsx       # 故事详情（沉浸式阅读）
│   ├── seeds/page.tsx          # 故事种子（未开发灵感）
│   ├── zhihu/page.tsx          # 知乎搜索页面
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth 认证
│       ├── auth/register/route.ts       # 用户注册
│       ├── sessions/route.ts            # 会话管理
│       ├── sessions/[id]/messages/route.ts  # 消息管理
│       ├── stories/route.ts             # 故事管理
│       ├── ai/catalyst/route.ts         # AI 催化（真实 LLM）
│       └── zhihu/search/route.ts        # 知乎搜索 API
├── components/
│   ├── site-header.tsx         # 顶部导航
│   ├── site-footer.tsx         # 底部信息
│   ├── featured-story.tsx      # 首页精选故事预览
│   ├── scene-detail.tsx        # 场景详情组件（角色切换 + 双人模式入口）
│   ├── story-reader.tsx        # 沉浸式故事阅读器
│   ├── roleplay-session.tsx    # 单人角色扮演交互组件
│   └── providers/session-provider.tsx  # NextAuth Provider
├── hooks/
│   └── use-socket.ts           # Socket.io 客户端 Hook
├── types/
│   └── next-auth.d.ts          # NextAuth 类型扩展
└── lib/
    ├── data.ts                 # 数据层（场景、故事、种子）
    ├── prisma.ts               # Prisma 客户端单例
    ├── socket-server.ts        # Socket.io 服务端
    └── utils.ts                # 工具函数
```
    ├── data.ts                 # 数据层（场景、故事、种子）
    ├── prisma.ts               # Prisma 客户端单例
    └── utils.ts                # 工具函数
prisma/
├── schema.prisma               # 数据库 Schema
└── dev.db                      # SQLite 数据库文件（不入库，本地/服务器自行维护）
```

## 数据库模型
- **User**: 用户（email, username, passwordHash）
- **Conversation**: 对话会话（sceneId, userId, status）
- **ConversationRole**: 会话角色（conversationId, roleId, userId, isAI）
- **Message**: 消息（conversationId, roleId, content, type, isSpark）
- **Story**: 故事（conversationId, userId, title, content）
- **Highlight**: 高光标记（messageId, userId, note）

## API 接口
| 路径 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 用户注册 |
| /api/auth/[...nextauth] | GET/POST | NextAuth 认证 |
| /api/sessions | GET | 获取会话列表 |
| /api/sessions | POST | 创建新会话 |
| /api/sessions/[id]/messages | GET | 获取消息列表 |
| /api/sessions/[id]/messages | POST | 发送消息 |
| /api/stories | GET | 获取故事列表 |
| /api/stories | POST | 创建故事 |
| /api/ai/catalyst | POST | AI 催化（SSE 流式） |
| /api/ai/catalyst | PUT | AI 催化（非流式） |

## 设计规范
- **配色**: 浅蓝白色系（#f0f7ff 背景 + #4a9fd8 品牌蓝 + #7EC8E8 点缀）
- **风格**: 剧场感、电影感、沉浸式阅读
- **动画**: 渐进式淡入、对话逐条出现、票根式入场
- **详见**: DESIGN.md

## 开发命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm ts-check` - TypeScript 类型检查
- `pnpm lint` - ESLint 检查

## 环境变量
- `DATABASE_URL` - SQLite 数据库路径（file:/workspace/projects/prisma/dev.db）
- `AUTH_SECRET` - NextAuth 密钥
- `NEXTAUTH_URL` - 认证回调 URL
