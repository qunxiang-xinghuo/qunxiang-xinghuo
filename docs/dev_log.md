# 群像·星火 开发日志

---

## 2026-04-29 — v9.1 故事系统后端数据增强

### 概述
为 v9.1 "好玩化"前端改造补齐数据层支撑，新增难度、内心独白、剧情节点推进、高光火花四个核心字段。

### 变更内容

**Prisma Schema（3 个新字段）**
- `Story.difficulty: Int @default(1)` — 难度星级 1-3
- `StoryRole.innerMonologue: String?` — 角色内心独白
- `Room.actProgress: Int @default(0)` — 剧情阶段 0-3

**API 路由（4 个增强）**
- `GET /api/stories` — 响应新增 `difficulty`
- `GET /api/stories/[storyId]` — 响应新增 `difficulty`，roles 新增 `innerMonologue`
- `GET /api/stories/mine?type=participated` — 响应新增 `bestSpark`（查询该用户在相关 room 中的最新 `isSpark=true` 消息）
- `POST /api/rooms/[roomId]/messages` (`sendMessage` in `room-manager.ts`) — 发送普通消息后根据 `currentRound` 阈值自动推进 `actProgress`，并插入系统提示消息

**前端页面（4 个消费）**
- `story-hall/page.tsx` — 卡片显示难度星星 🌟
- `story/[id]/page.tsx` — 角色展开显示内心独白 💭
- `room/[id]/page.tsx` — 顶部剧情阶段标签 + 系统提示消息居中渲染
- `my-stories/page.tsx` — participated tab 显示"高光时刻"和最佳火花预览

**技术细节**
- 使用 `prisma db push` 同步 SQLite schema（开发环境）
- 剧情节点推进基于 `currentRound` 阈值（3/6/9），仅在 `room.type === "duet"` 且非 AI/导演消息时触发
- 系统提示消息通过 `senderId: "system"` + `identity: "剧情提示"` 标记，前端特殊渲染为居中金色提示框

---

## 2026-04-30 — 知乎直答与搜索页面集成 (Phase 5)

### 概述
新增两个知乎测试页面，实现知乎直答对话界面和知乎搜索/热榜页面，并修复知乎开发者 API 环境变量配置问题。

### 变更内容

**环境变量修复**
- `src/lib/zhihu-dev-api.ts` — 将 `process.env.ZHIHU_APP_KEY` 更改为 `process.env.ZHIHU_API_KEY`，与 `.env.local` 中的配置键名一致

**前端页面 (2 个新增)**
- `/src/app/zhihu-zhida/page.tsx` — 知乎直答聊天界面，支持快速回答(zhida-fast-1p5)和深度思考(zhida-thinking-1p5)两种模型切换，带思考过程展示和加载动画
- `/src/app/zhihu-search/page.tsx` — 知乎搜索与热榜页面，3 标签页设计(站内搜索/全网搜索/热榜)，搜索结果展示文章标题/摘要/作者/点赞数

**TDD 测试 (2 个新增)**
- `src/test/pages/zhihu-zhida.test.tsx` — 9 个测试用例，覆盖页面渲染、模型选择、API 调用、加载状态、错误处理
- `src/test/pages/zhihu-search.test.tsx` — 6 个测试用例，覆盖页面渲染、标签切换、搜索功能、热榜展示

**测试结果**
- 新增 15 个测试全部通过
- 全量测试 236 个通过（1 个 transform 错误为 socket.io-parser 预存问题）

### 技术细节

**知乎直答页面 (`zhihu-zhida`)**
- 消息历史：用户消息右对齐(xh-accent背景)、AI回复左对齐(white/5背景)
- 模型选择：快速回答(红色)/深度思考(金色)toggle按钮
- 思考过程：AI回复中 `reasoningContent` 字段以 💭 前缀展示
- 加载状态：`思考中...` 动态文字动画
- API：`POST /api/zhihu/zhida`，body 格式 `{ messages, model }`

**知乎搜索页面 (`zhihu-search`)**
- 3 标签页：站内搜索(调用`/api/zhihu/search`)/全网搜索(调用`/api/zhihu/global-search`)/热榜(调用`/api/zhihu/hot-list`)
- 搜索结果卡片：标题 + 摘要 + 作者 + 点赞数 + 评论数
- 热榜卡片：标题 + 缩略图(如存在) + 摘要
- 加载骨架屏：3 个占位卡片动画

---

## 2026-04-28 — 全栈迁移完成 (Express+Vite → Next.js 16)

### 概述
将群像·星火从 Express + Vite React SPA 架构完整迁移至 Next.js 16 App Router，覆盖后端 API、前端组件/页面/Hooks、数据库 Schema、测试、CI/CD 全链路。

### 变更内容

**项目架构重构**
- Express + raw sqlite3 + ws → Next.js 16 + Prisma v7 + Socket.io
- React 18 Vite SPA (JavaScript) → Next.js App Router (TypeScript, 'use client' 指令)
- 17 个 Prisma 模型完整定义 (Account, Session, User, UserIdentity, Tag, Brainhole, BrainholeTag, BrainholeCollection, Reaction, MatchRequest, Room, RoomParticipant, RoomMessage, Vote, VoteOption, VoteCast, InspirationItem, StoryDraft)
- Prisma v7 适配器模式 (`@prisma/adapter-better-sqlite3`) 替代传统 datasource URL

**后端 API 路由 (22 个)**
- 认证: `/api/auth/[...nextauth]` (NextAuth v4 + Credentials Provider)
- 用户: `/api/users/identities`
- 脑洞: `/api/brainholes`, `/api/brainholes/[id]`, `/api/brainholes/[id]/collect`, `/api/brainholes/collected`
- 反应: `/api/reactions`
- 匹配: `/api/match`, `/api/match/[matchId]`
- 房间: `/api/rooms/[roomId]`, messages, spark, pause, resume, finish, inspirations
- 投票: vote, vote/[voteId]/cast, vote/[voteId]/resolve
- AI: `/api/ai/prompt`, `/api/ai/story-weave`
- 素材库: `/api/library`

**前端组件 (28 个)**
- 脑洞: BrainholeCard, BrainholeStack, CollectionDrawer, ScenarioReader, TagFilter
- 身份: IdentityBadge, IdentitySelector, IdentitySetupModal
- 布局: TopBar, BottomNav, MobileContainer
- 素材库: SparkCollection, StoryCard, StoryWeaver
- 匹配: MatchCard, MatchSuccessModal, MatchTimer
- 个人: LevelBadge, PlaceholderEntry, UserStats
- 反应: ReactionInput, ReactionList, SparkButton, VoiceRecorder
- 房间: AIPromptBanner, ChatRoom, MessageBubble, SparkWall

**前端页面 (13 个)**
- 首页, 登录, 注册, 身份选择, 脑洞详情, 匹配, 双人匹配, 双人等待, 多人, 消息, 素材库, 反馈, 个人

**自定义 Hooks (8 个)**
- useAuth (含 login/register/updateIdentity), useBrainhole, useCollection, useMatch, useReaction, useRoom, useSwipe, useVoiceRecorder

**核心基础设施**
- `src/lib/db.ts` — Prisma v7 SQLite 适配器单例
- `src/lib/auth.ts` — NextAuth v4 配置
- `src/lib/utils.ts` — cn(), apiResponse(), apiError()
- `src/lib/ai/` — AI 催化剂系统 (fallback-prompts + prompt-generator + story-weaver)
- `src/lib/validators/` — Zod v4 验证器 (brainhole, match, reaction, vote)
- `src/server/` — match-engine, room-manager, ai-catalyst, rate-limiter
- `src/types/` — api, models, enums, components 类型定义

**关键修复**
- Next.js 16 `params` 改为 `Promise` — 全部 API 路由已适配 `await params`
- Prisma v7 不支持 schema `url` — 改用 `@prisma/adapter-better-sqlite3` 运行时适配器
- Zod v4 `.errors` → `.issues` — 5 个 API 路由已修正
- `useSearchParams()` 需要 Suspense 包裹 — identity 页面已修复
- React 19 `Link` 类型不兼容 — TopBar 改用 `<a>` 标签
- Web Speech API 类型声明 — 添加 `src/types/speech-recognition.d.ts`
- `MobileContainer` 使用未导入的 `location.pathname` — 改用 `usePathname()`
- Tailwind v4 自定义颜色 — 通过 `@theme inline` 块定义 xh-accent/xh-gold/xh-primary/xh-dark/xh-light

### 技术栈
| 层 | 旧 | 新 |
|---|---|---|
| 框架 | Express 4 + Vite | Next.js 16 (Turbopack) |
| 语言 | JavaScript | TypeScript |
| 数据库 | raw sqlite3 | Prisma v7 + SQLite |
| 认证 | 无 | NextAuth v4 + Credentials |
| WebSocket | ws | Socket.io |
| 实时 | 无 | Socket.io Client |
| 验证 | 无 | Zod v4 |
| 样式 | CSS Modules | Tailwind v4 |
| 动画 | CSS | Framer Motion |
| 图标 | SVG inline | lucide-react |
| 测试 | 无 | Vitest + RTL + MSW |

### 构建验证
| 检查项 | 状态 |
|--------|------|
| `npx tsc --noEmit` | ✅ 零错误 |
| `npm run build` | ✅ 23 路由 + 37 页面成功 |
| Prisma 迁移 | ✅ init 迁移已应用 |
| Prisma 生成 | ✅ 客户端已生成 |
