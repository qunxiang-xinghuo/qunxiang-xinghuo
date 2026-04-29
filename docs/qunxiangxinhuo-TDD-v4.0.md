# 群像·星火 (Qunxiang Xinghuo) 技术设计文档 — v4.0

**项目名称：** 群像·星火  
**版本：** v4.0（基于实际代码状态归档，覆盖 Phase 1~4 全部实现）  
**日期：** 2026年4月29日  
**目标：** 基于真实职业经验的多人协同创作平台 MVP — 完整工程化交付  
**技术栈：** Next.js 16.2.4 + App Router + TypeScript 5.x + Tailwind CSS v4 + shadcn/ui + Prisma 7.8.0 + SQLite + Socket.io 4.8.3 + DeepSeek API  
**测试框架：** Vitest 4.1.5 + React Testing Library + jsdom + v8 coverage  
**测试状态：** 216 tests passed，23 个测试文件，0 failed  
**代码仓库：** https://github.com/qunxiang-xinghuo/qunxiang-xinghuo（dev 分支）

---

## 修订说明（v1.2 → v4.0）

| 编号 | 修订内容 | 状态 |
|------|----------|------|
| R-15 | **技术栈升级到 Next.js 16 + React 19**：从 v1.2 的 Next.js 15 升级到 16.2.4，React 19.2.4。 | ✅ 已完成 |
| R-16 | **Tailwind CSS v4 迁移**：移除传统 `tailwind.config.js`，改用 `@tailwindcss/postcss` + `globals.css` 内联主题配置。 | ✅ 已完成 |
| R-17 | **Prisma 7 升级**：从 Prisma 5.x 升级到 7.8.0，使用 `@prisma/adapter-better-sqlite3`。 | ✅ 已完成 |
| R-18 | **Socket.io 实时通信从零搭建**：自定义 `server.ts` 同时挂载 Next.js handler 和 Socket.io，CORS 已配置。 | ✅ 已完成 |
| R-19 | **前端 Hooks 对接真实 API**：useBrainhole / useReaction / useCollection 从 localStorage mock 改为真实 fetch。 | ✅ 已完成 |
| R-20 | **AI 故事串联真实接入**：`story-weaver.ts` 从 mock 改为真实 DeepSeek 调用 + fallback 本地生成。 | ✅ 已完成 |
| R-21 | **AI 催化提示生成器实现**：`prompt-generator.ts` 完成 DeepSeek 集成 + fallback-prompts 兜底。 | ✅ 已完成 |
| R-22 | **TDD 测试覆盖补齐**：从 v1.2 的规划状态到 216 个实际通过的测试，覆盖全部 API + Hooks + 组件。 | ✅ 已完成 |
| R-23 | **投票系统完整实现**：创建/投票/结算三端 API + 灵感库自动归档。 | ✅ 已完成 |
| R-24 | **三级降级策略**：DeepSeek 余额不足/网络失败/格式错误时自动 fallback，确保 Demo 可用。 | ✅ 已完成 |

---

## 目录

1. [项目总览](#一项目总览)
2. [技术架构与实现](#二技术架构与实现)
3. [已实现功能清单](#三已实现功能清单)
4. [API 接口设计](#四api-接口设计)
5. [数据模型设计](#五数据模型设计)
6. [TDD 测试策略与覆盖报告](#六tdd-测试策略与覆盖报告)
7. [项目目录结构](#七项目目录结构)
8. [CI/CD 与部署](#八cicd-与部署)
9. [开发里程碑（实际完成）](#九开发里程碑实际完成)
10. [风险与应对](#十风险与应对)
11. [总结与下一步](#十一总结与下一步)

---

## 一、项目总览

### 1.1 项目背景

**创作痛点：**
- 创作者写剧本/小说时，经常卡在专业细节的真实性上（如急诊科抢救流程、律师质证技巧）
- 单人创作的视角单一，难以写出真实的"群像感"
- 有真实职业经验的普通人（退休阿姨、急诊护士、程序员）有故事但缺乏表达渠道

**市场机会：**
- 微短剧、互动小说市场快速增长，对真实职业细节的需求旺盛
- UGC 创作平台多但缺少"职业身份驱动"的协同创作机制

### 1.2 项目简介

《群像·星火》是一个基于**真实职业经验**的多人协同创作平台。让不同职业背景的普通人，被同时扔进同一个冲突情境，用各自的职业本能碰撞出火花，共同完成一部一个人永远写不出的故事。

### 1.3 核心价值主张

- **真实反应资产化**：记录带时间戳和身份标签的真实反应，确权为可追溯的数字资产
- **即兴思想碰撞**：随机匹配不同职业的用户进行即时对白，产出不可预测的创作火花
- **群像共创导演机制**：多人组队围绕同一故事进行角色化共创，由导演控场推进剧情
- **低门槛表达**：语音输入为主，无需写作能力
- **游戏化体验**：左滑右滑、随机匹配、火花标记等交互降低创作压力

### 1.4 核心业务流程

```
单人模式：
1. 选择身份标签 → 2. 浏览脑洞卡片（左滑跳过/右滑收藏）→ 3. 从收藏夹进入脑洞
→ 4. AI 催化引导提问 → 5. 语音/文字反应 → 6. 存入个人素材库

双人模式：
1. 选择身份标签 → 2. 浏览脑洞，右滑收藏 → 3. 进入匹配池（基于右滑同一脑洞）
→ 4. 匹配成功进入对白室 → 5. 即时对白（手动标记火花）→ 6. 对话结束查看火花墙
→ 7. AI 辅助串联故事

多人模式：
1. 浏览故事广场（副本列表）→ 2. 认领角色 → 3. 导演开场，按回合发言
→ 4. 导演控场（暂停/继续/发起投票）→ 5. 导演喊杀青 → 6. 查看共创者署名墙
→ 7. AI 辅助串联成群像故事
```

### 1.5 功能范围边界（MVP v4.0）

**本版本已实现：**
- ✅ 产品首页 + 三个模式入口
- ✅ 单人模式：身份选择 → 脑洞匹配（左滑/右滑/收藏夹）→ AI 催化 → 反应记录
- ✅ 双人模式：身份选择 → 匹配等待（60秒超时）→ 对白室（WebSocket 实时）→ 火花标记 → 火花墙
- ✅ 多人模式：故事广场 → 副本详情/角色认领 → 对戏剧场（导演控场 pause/resume/finish）→ 投票系统 → 灵感库
- ✅ 个人素材库（我的反应、火花合集、故事草稿）
- ✅ AI 催化提示生成（DeepSeek API + fallback-prompts 兜底）
- ✅ AI 故事串联（DeepSeek API + fallback 本地生成）
- ✅ 三级降级策略（DeepSeek → fallback → 基础提示）
- ✅ 完整的 TDD 测试覆盖（216 tests）

**本版本暂不实现（后续迭代）：**
- AI 情绪分析标签（API 已预留，未接入）
- AI 场景图（"灵感视界"/"场景共鸣"背景板）
- 长期连载模式
- 情侣/密友模式
- 知乎 API 自动抓取脑洞（待 5月9-12 号获取 key）

---

## 二、技术架构与实现

### 2.1 系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                      用户层 (移动端优先)                        │
│  Next.js 16 App Router + React 19 + Tailwind CSS v4          │
│  Framer Motion (动画) + react-swipeable (手势) + lucide-react │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API 路由层                                │
│  Next.js API Routes (/app/api/*)                             │
│  Zod 参数校验 + 统一响应格式 (apiResponse/apiError)           │
│  NextAuth.js 4 (CredentialsProvider + JWT session)           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层                                │
│  match-engine.ts (内存匹配池 + 优先级算法 + 超时检测)          │
│  room-manager.ts (房间生命周期 + 消息 + 火花 + 投票)           │
│  socket-handler.ts (Socket.io 事件处理)                       │
│  story-weaver.ts (AI 故事串联)                                │
│  prompt-generator.ts (AI 催化提示)                            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      数据持久层                                │
│  Prisma 7.8.0 + SQLite (better-sqlite3)                      │
│  开发/测试/生产 统一使用 SQLite（文件级隔离）                  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      外部服务                                  │
│  DeepSeek API (AI 故事串联 + AI 催化提示)                      │
│  Socket.io (WebSocket 实时通信，路径 /api/socket)              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 前端框架 | Next.js | 16.2.4 | App Router + React Server Components |
| UI 框架 | React | 19.2.4 | 配合 Next.js 16 |
| 样式 | Tailwind CSS | v4 | `@tailwindcss/postcss`，无传统 config 文件 |
| 动画 | Framer Motion | 12.38.0 | 页面过渡、手势动画 |
| 组件库 | shadcn/ui | - | Radix UI + Tailwind 封装 |
| 认证 | NextAuth.js | 4.24.14 | CredentialsProvider + JWT |
| 数据库 ORM | Prisma | 7.8.0 | `@prisma/adapter-better-sqlite3` |
| 数据库 | SQLite | 3.x | 单文件，适合 MVP 和 Demo |
| 实时通信 | Socket.io | 4.8.3 | 自定义 server.ts 集成 |
| AI 服务 | DeepSeek API | v1 | chat completions，模型 deepseek-chat |
| 校验 | Zod | 4.3.6 | API 参数校验 + TypeScript 类型推导 |
| 测试 | Vitest | 4.1.5 | jsdom + React Testing Library |
| 覆盖率 | v8 | - | `@vitest/coverage-v8` |

### 2.3 关键技术决策

**1. 自定义 server.ts 而非 Next.js 内置 Socket.io**

使用 `server.ts` 同时挂载 Next.js handler 和 Socket.io，解决 Next.js API Routes 无法持久化 WebSocket 连接的问题。

```typescript
// server.ts
const server = createServer((req, res) => handle(req, res))
const io = new Server(server, { path: '/api/socket', cors: { origin: '*' } })
initSocketHandler(io)
server.listen(port, '0.0.0.0')
```

**2. SQLite 作为唯一数据库**

MVP 阶段使用 SQLite 降低部署复杂度：
- 无需额外数据库服务
- 单文件便于备份和迁移
- 通过 `fileParallelism: false` 解决 Vitest 并行测试时的数据库锁冲突

**3. 三级降级策略**

DeepSeek API 可能因余额不足/网络故障/格式错误而失败，系统实现三级自动降级：

| 级别 | 触发条件 | 行为 |
|------|---------|------|
| L1 | DeepSeek API 正常返回 | 使用 AI 生成的高质量内容 |
| L2 | API 返回非 2xx 或超时 | fallback-prompts 本地题库匹配 |
| L3 | 本地题库无匹配 | 通用基础提示兜底 |

**4. TDD 开发节奏**

每完成一个 Phase 执行 6 项自检清单：
1. 依赖缺失检查
2. 导入路径检查
3. TypeScript 类型错误检查
4. 重复代码检查
5. 端口占用检查
6. 跨域错误检查

---

## 三、已实现功能清单

### 3.1 前端页面

| 页面 | 路径 | 状态 |
|------|------|------|
| 首页 | `/` | ✅ 三种模式入口卡片 |
| 登录 | `/login` | ✅ CredentialsProvider |
| 注册 | `/register` | ✅ 自动创建用户 |
| 身份选择 | `/identity` | ✅ 创建/管理身份标签 |
| 脑洞浏览 | `/brainhole/[id]` | ✅ 左滑/右滑/收藏 |
| 匹配页 | `/match` | ✅ 发起匹配请求 |
| 等待匹配 | `/duo-waiting` | ✅ 60秒倒计时 + 取消 |
| 双人匹配 | `/duo-match` | ✅ 匹配成功弹窗 |
| 对白室 | `/messages` | ✅ WebSocket 实时消息 |
| 多人剧场 | `/multiplayer` | ✅ 导演控场 + 投票 |
| 个人素材库 | `/library` | ✅ 反应/火花/草稿 |
| 用户反馈 | `/feedback` | ✅ 提交体验反馈 |
| 个人中心 | `/profile` | ✅ 等级/统计/设置 |

### 3.2 API 端点（全部已测试）

| 端点 | 方法 | 功能 | 测试文件 |
|------|------|------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 | (NextAuth 内置) |
| `/api/ai/prompt` | GET | AI 催化提示 | `ai-prompt.test.ts` |
| `/api/ai/story-weave` | POST | AI 故事串联 | `story-weave.test.ts` |
| `/api/brainholes` | GET/POST | 脑洞列表/创建 | `brainholes.test.ts` |
| `/api/brainholes/:id` | GET | 脑洞详情 | `brainholes.test.ts` |
| `/api/brainholes/:id/collect` | POST | 收藏脑洞 | `brainholes.test.ts` |
| `/api/brainholes/collected` | GET | 收藏列表 | `collected.test.ts` |
| `/api/library` | GET | 个人素材库 | `library.test.ts` |
| `/api/match` | POST | 请求匹配 | `match.test.ts` |
| `/api/match/:matchId` | GET/DELETE | 查询/取消匹配 | `match.test.ts` |
| `/api/reactions` | GET/POST | 反应列表/提交 | `reactions.test.ts` |
| `/api/rooms/:roomId` | GET | 房间详情 | `room-detail.test.ts` |
| `/api/rooms/:roomId/messages` | POST | 发送消息 | `rooms.test.ts` |
| `/api/rooms/:roomId/spark` | POST | 标记火花 | `rooms.test.ts` |
| `/api/rooms/:roomId/pause` | POST | 暂停房间 | `rooms.test.ts` |
| `/api/rooms/:roomId/resume` | POST | 恢复房间 | `rooms.test.ts` |
| `/api/rooms/:roomId/finish` | POST | 结束房间 | `rooms.test.ts` |
| `/api/rooms/:roomId/vote` | POST | 创建投票 | `vote.test.ts` |
| `/api/rooms/:roomId/vote/:voteId/cast` | POST | 投票 | `vote.test.ts` |
| `/api/rooms/:roomId/vote/:voteId/resolve` | POST | 结束投票 | `vote.test.ts` |
| `/api/rooms/:roomId/inspirations` | GET | 灵感库 | `inspirations.test.ts` |
| `/api/users/identities` | GET/POST | 用户身份 | `identities.test.ts` |

### 3.3 WebSocket 事件

| 事件 | 方向 | 功能 |
|------|------|------|
| `join-room` | Client → Server | 加入房间，广播 `user-joined` |
| `leave-room` | Client → Server | 离开房间，广播 `user-left` |
| `send-message` | Client → Server | 发送消息，广播 `new-message` |
| `mark-spark` | Client → Server | 标记火花，广播 `spark-marked` |
| `new-message` | Server → Client | 新消息通知 |
| `user-joined` | Server → Client | 用户加入通知 |
| `user-left` | Server → Client | 用户离开通知 |
| `spark-marked` | Server → Client | 火花标记通知 |

### 3.4 AI 功能

| 功能 | 实现 | 降级策略 |
|------|------|---------|
| AI 催化提示 | `prompt-generator.ts` → DeepSeek API | fallback-prompts 分类题库 |
| AI 故事串联 | `story-weaver.ts` → DeepSeek API | 本地基于火花内容拼接 |
| AI 情绪分析 | `index.ts` 占位 | 返回 ["neutral"] |
| AI 场景图 | 未实现 | - |

---

## 四、API 接口设计

### 4.1 接口规范

- **基础路径：** `http://localhost:3000/api`
- **认证方式：** Cookie-based session（NextAuth.js）
- **请求格式：** JSON
- **响应格式：**

```typescript
// 成功响应
{
  "success": true,
  "data": { ... }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息"
  }
}
```

### 4.2 关键接口示例

#### POST /api/match — 请求匹配

**请求：**
```json
{
  "brainholeId": "cl123456789012345678901234",
  "identity": "急诊科医生",
  "preferDifferent": true,
  "timeoutMinutes": 1
}
```

**响应（匹配成功 201）：**
```json
{
  "success": true,
  "data": {
    "matchId": "match_1",
    "roomId": "room_1",
    "matchedUserId": "user2",
    "matchedUserIdentity": "导演",
    "status": "matched"
  }
}
```

**响应（等待中 202）：**
```json
{
  "success": true,
  "data": {
    "matchId": "match_1",
    "status": "waiting",
    "message": "已加入匹配队列"
  }
}
```

#### POST /api/rooms/:roomId/vote — 创建投票

**请求：**
```json
{
  "question": "应该先救谁？",
  "options": ["救孕妇", "救老人", "救孩子"],
  "targetMessageId": "msg_1"
}
```

**响应（200）：**
```json
{
  "success": true,
  "data": {
    "id": "vote1",
    "roomId": "room1",
    "question": "应该先救谁？",
    "status": "open",
    "options": [
      { "id": "opt1", "idx": 0, "text": "救孕妇" },
      { "id": "opt2", "idx": 1, "text": "救老人" },
      { "id": "opt3", "idx": 2, "text": "救孩子" }
    ]
  }
}
```

#### POST /api/ai/story-weave — AI 故事串联

**请求：**
```json
{
  "sparks": [
    { "content": "先推肾上腺素！", "identity": "急诊科医生" },
    { "content": "导演喊咔，要求重拍", "identity": "导演" }
  ],
  "format": "script",
  "tone": "dramatic",
  "length": "short"
}
```

**响应（200）：**
```json
{
  "success": true,
  "data": {
    "title": "急诊室风云",
    "story": "场景：深夜急诊室...",
    "summary": "一场抢救中的职业碰撞",
    "characterProfiles": [...],
    "estimatedReadingTime": 3
  }
}
```

---

## 五、数据模型设计

### 5.1 Prisma Schema 核心模型

```prisma
// 用户与认证
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String?   // bcrypt 哈希
  image         String?
  level         Int       @default(1)
  reactionCount Int       @default(0)
  sparkCount    Int       @default(0)
  identities    UserIdentity[]
  reactions     Reaction[]
  collections   BrainholeCollection[]
  rooms         RoomParticipant[]
  storyDrafts   StoryDraft[]
}

model UserIdentity {
  id        String   @id @default(cuid())
  userId    String
  label     String   // 身份标签，如"导演"
  verified  Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, label])
}

// 脑洞
model Brainhole {
  id             String    @id @default(cuid())
  title          String
  scenario       String    @db.Text
  source         String    @default("user")
  status         String    @default("approved")
  difficulty     String    @default("medium")
  reactionCount  Int       @default(0)
  collectionCount Int      @default(0)
  authorId       String?
  tags           BrainholeTag[]
  reactions      Reaction[]
  collections    BrainholeCollection[]
}

model BrainholeCollection {
  id          String     @id @default(cuid())
  userId      String
  brainholeId String
  user        User       @relation(fields: [userId], references: [id])
  brainhole   Brainhole  @relation(fields: [brainholeId], references: [id])
  @@unique([userId, brainholeId])
}

// 反应
model Reaction {
  id           String    @id @default(cuid())
  content      String    @db.Text
  identity     String
  emotionTag   String?
  isSpark      Boolean   @default(false)
  sparkMarkedBy String?
  userId       String
  brainholeId  String
  roomId       String?
  user         User      @relation(fields: [userId], references: [id])
  brainhole    Brainhole @relation(fields: [brainholeId], references: [id])
}

// 房间
model Room {
  id            String            @id @default(cuid())
  brainholeId   String
  status        String            @default("created") // created|active|paused|voting|finished|closed
  directorId    String
  currentRound  Int               @default(1)
  participants  RoomParticipant[]
  messages      RoomMessage[]
  votes         Vote[]
  inspirations  InspirationItem[]
}

model RoomParticipant {
  id         String   @id @default(cuid())
  roomId     String
  userId     String
  identity   String
  isOnline   Boolean  @default(true)
  isDirector Boolean  @default(false)
  room       Room     @relation(fields: [roomId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
}

model RoomMessage {
  id        String   @id @default(cuid())
  roomId    String
  senderId  String
  content   String   @db.Text
  isSpark   Boolean  @default(false)
  sparkMarkedBy String?
  createdAt DateTime @default(now())
  room      Room     @relation(fields: [roomId], references: [id])
}

// 匹配
model MatchRequest {
  id         String   @id @default(cuid())
  userId     String
  brainholeId String
  identity   String
  status     String   @default("waiting") // waiting|matched|timeout|cancelled
  createdAt  DateTime @default(now())
}

// 投票
model Vote {
  id              String       @id @default(cuid())
  roomId          String
  initiatorId     String
  question        String
  status          String       @default("open") // open|closed
  winnerOptionIdx Int?
  closedAt        DateTime?
  options         VoteOption[]
  casts           VoteCast[]
  room            Room         @relation(fields: [roomId], references: [id])
}

model VoteOption {
  id       String   @id @default(cuid())
  voteId   String
  idx      Int
  text     String
  vote     Vote     @relation(fields: [voteId], references: [id])
}

model VoteCast {
  id       String   @id @default(cuid())
  voteId   String
  userId   String
  optionId String
  vote     Vote     @relation(fields: [voteId], references: [id])
}

// 灵感库
model InspirationItem {
  id        String   @id @default(cuid())
  roomId    String
  content   String
  voteId    String?
  addedBy   String
  createdAt DateTime @default(now())
  room      Room     @relation(fields: [roomId], references: [id])
}

// 故事草稿
model StoryDraft {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  content   String   @db.Text
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## 六、TDD 测试策略与覆盖报告

### 6.1 测试工具链

| 工具 | 用途 | 版本 |
|------|------|------|
| Vitest | 单元/集成测试运行器 | 4.1.5 |
| React Testing Library | 组件和 Hooks 测试 | 16.3.2 |
| jsdom | 浏览器环境模拟 | 29.1.0 |
| @vitest/coverage-v8 | 代码覆盖率报告 | 4.1.5 |
| msw | API Mock（可选） | 2.13.6 |

### 6.2 测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    fileParallelism: false, // SQLite 并行冲突修复
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

### 6.3 测试覆盖报告（截至 v4.0）

| 模块 | 测试文件 | 数量 | 关键覆盖 |
|------|---------|------|---------|
| API - 匹配 | `match.test.ts` | 9 | 创建/查询/取消，401/400/500/202/201 |
| API - 房间 | `rooms.test.ts` | 16 | 消息/火花/暂停/恢复/结束，401/403/404 |
| API - 房间详情 | `room-detail.test.ts` | 4 | GET，401/403/404 |
| API - 脑洞 | `brainholes.test.ts` | 12 | 列表/详情/创建/收藏，分页/验证/错误 |
| API - 收藏 | `collected.test.ts` | 3 | GET，401/数据库错误 |
| API - 反应 | `reactions.test.ts` | 6 | GET/POST，分页/过滤/404/201 |
| API - 投票 | `vote.test.ts` | 19 | 创建/投票/结算，完整边界 + happy path |
| API - 灵感库 | `inspirations.test.ts` | 4 | GET，401/403/404 |
| API - 素材库 | `library.test.ts` | 3 | GET，401/数据库错误 |
| API - 身份 | `identities.test.ts` | 7 | GET/POST，401/400/重复检测 |
| API - AI 提示 | `ai-prompt.test.ts` | 4 | GET，401/参数传递/错误处理 |
| API - AI 故事 | `story-weave.test.ts` | 5 | POST，401/400/默认参数 |
| WebSocket | `socket-handler.test.ts` | 4 | join/leave/send-message/mark-spark |
| Hooks | `hooks/*.test.ts` | 21 | useBrainhole/useReaction/useCollection |
| 组件 | `components/*.test.tsx` | 39 | MessageBubble/BottomNav/TopBar |
| 工具/验证器 | `lib/*.test.ts` | ~52 | utils + validators |
| AI 生成器 | `lib/ai/*.test.ts` | 8 | prompt-generator 全部函数 |

**总计：23 个测试文件，216 个测试用例，全部通过。**

### 6.4 待提升覆盖区域

| 文件 | 当前覆盖率 | 缺口 |
|------|-----------|------|
| `lib/ai/story-weaver.ts` | 58% | fallback 路径和错误处理 |
| `app/api/rooms/[roomId]/messages/route.ts` | 64% | 边界分支（room 状态校验） |
| `app/api/rooms/[roomId]/spark/route.ts` | 65% | 边界分支 |
| `app/api/rooms/[roomId]/resume/route.ts` | 77% | error catch 分支 |

---

## 七、项目目录结构

```
qunxiang-xinghuo/
├── docs/                          # 文档目录
│   ├── qunxiangxinhuo-TDD-v4.0.md  # 本文档
│   ├── qunxiangxinhuo-TDD-v1.2.md  # 历史版本
│   ├── deploy-zh.md               # 部署说明
│   ├── dev_log.md                 # 开发日志
│   └── migration-report.md        # 迁移报告
├── prisma/
│   ├── schema.prisma              # Prisma 数据模型
│   └── seed.ts                    # 种子数据
├── public/                        # 静态资源
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # 认证路由组
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── api/                   # API 路由
│   │   │   ├── ai/
│   │   │   │   ├── prompt/route.ts
│   │   │   │   └── story-weave/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── brainholes/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── [id]/collect/route.ts
│   │   │   │   └── collected/route.ts
│   │   │   ├── library/route.ts
│   │   │   ├── match/
│   │   │   │   ├── route.ts
│   │   │   │   └── [matchId]/route.ts
│   │   │   ├── reactions/route.ts
│   │   │   ├── rooms/
│   │   │   │   └── [roomId]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── finish/route.ts
│   │   │   │       ├── inspirations/route.ts
│   │   │   │       ├── messages/route.ts
│   │   │   │       ├── pause/route.ts
│   │   │   │       ├── resume/route.ts
│   │   │   │       ├── spark/route.ts
│   │   │   │       └── vote/
│   │   │   │           ├── route.ts
│   │   │   │           └── [voteId]/
│   │   │   │               ├── cast/route.ts
│   │   │   │               └── resolve/route.ts
│   │   │   └── users/identities/route.ts
│   │   ├── brainhole/[id]/page.tsx
│   │   ├── duo-match/page.tsx
│   │   ├── duo-waiting/page.tsx
│   │   ├── feedback/page.tsx
│   │   ├── identity/page.tsx
│   │   ├── library/page.tsx
│   │   ├── match/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── multiplayer/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── providers.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── brainhole/          # 脑洞相关组件
│   │   ├── identity/           # 身份相关组件
│   │   ├── layout/             # 布局组件
│   │   ├── library/            # 素材库组件
│   │   ├── match/              # 匹配组件
│   │   ├── profile/            # 个人中心组件
│   │   ├── reaction/           # 反应组件
│   │   └── room/               # 房间组件
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBrainhole.ts
│   │   ├── useCollection.ts
│   │   ├── useReaction.ts
│   │   ├── useSocket.ts
│   │   └── useVoiceRecorder.ts
│   ├── lib/
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── db.ts               # Prisma Client
│   │   ├── utils.ts            # 工具函数
│   │   ├── ai/                 # AI 模块
│   │   │   ├── fallback-prompts.ts
│   │   │   ├── index.ts
│   │   │   ├── prompt-generator.ts
│   │   │   └── story-weaver.ts
│   │   └── validators/         # Zod 校验 Schema
│   │       ├── brainhole.ts
│   │       ├── match.ts
│   │       ├── reaction.ts
│   │       └── vote.ts
│   ├── server/
│   │   ├── ai-catalyst.ts
│   │   ├── io.ts               # Socket.io 初始化
│   │   ├── match-engine.ts     # 匹配引擎
│   │   ├── room-manager.ts     # 房间管理
│   │   └── socket-handler.ts   # WebSocket 事件处理
│   ├── test/                   # 测试目录
│   │   ├── api/                # API 路由测试
│   │   ├── components/         # 组件测试
│   │   ├── hooks/              # Hooks 测试
│   │   └── lib/                # 工具/AI 测试
│   └── __tests__/
│       └── server/
│           └── socket-handler.test.ts
├── server.ts                   # 自定义服务器入口
├── next.config.ts
├── vitest.config.ts
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env / .env.example
└── .github/workflows/ci.yml
```

---

## 八、CI/CD 与部署

### 8.1 GitHub Actions CI 流水线

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx prisma generate
      - run: npx prisma db push
      - run: npm run test:coverage
```

### 8.2 本地开发启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY=sk-...

# 3. 初始化数据库
npx prisma db push
npx prisma db seed

# 4. 启动开发服务器（同时启动 Next.js + Socket.io）
npm run dev
# 访问 http://localhost:3000

# 5. 运行测试
npm test
npm run test:coverage
```

### 8.3 Docker 部署

```bash
# 构建镜像
docker build -t qunxiang-xinghuo .

# 运行容器
docker run -p 3000:3000 --env-file .env qunxiang-xinghuo
```

---

## 九、开发里程碑（实际完成）

### Phase 1：匹配引擎 + TDD 基础（✅ 已完成）

- [x] `match-engine.ts` 内存匹配池 + 优先级算法 + 60秒超时检测
- [x] `POST /api/match` 创建匹配请求
- [x] `GET /api/match/:matchId` 查询匹配状态
- [x] `DELETE /api/match/:matchId` 取消匹配
- [x] 9 个测试全部通过
- [x] 自检清单 6 项通过

### Phase 2：房间管理 API（✅ 已完成）

- [x] `POST /api/rooms/:roomId/messages` 发送消息
- [x] `POST /api/rooms/:roomId/spark` 标记火花
- [x] `POST /api/rooms/:roomId/pause` 暂停房间
- [x] `POST /api/rooms/:roomId/resume` 恢复房间
- [x] `POST /api/rooms/:roomId/finish` 结束房间
- [x] 16 个测试全部通过
- [x] 自检清单 6 项通过

### Phase 3：WebSocket + 前端对接 + AI 故事串联（✅ 已完成）

- [x] `server.ts` 自定义服务器同时挂载 Next.js + Socket.io
- [x] `socket-handler.ts` 事件处理（join/leave/send-message/mark-spark）
- [x] `useSocket.ts` 前端 Hook
- [x] `useBrainhole.ts` / `useReaction.ts` / `useCollection.ts` 对接真实 API
- [x] `story-weaver.ts` 从 mock 改为真实 DeepSeek 调用 + fallback
- [x] WebSocket 4 个集成测试全部通过
- [x] story-weave 5 个测试全部通过
- [x] 自检清单 6 项通过

### Phase 4：补齐 TDD 测试覆盖 + AI 催化（✅ 已完成）

- [x] 投票系统 API 测试（19 tests）
- [x] 脑洞 API 测试（12 tests）
- [x] 素材库/身份/灵感库 API 测试
- [x] 前端 Hooks 测试（21 tests）
- [x] AI prompt-generator 实现 + 测试（8 tests）
- [x] 房间详情 API 测试
- [x] 反应/收藏 API 测试
- [x] **总计：216 tests passed，23 个测试文件**

---

## 十、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 | 状态 |
|------|--------|------|---------|------|
| DeepSeek API 余额不足 | 中 | 高 | 三级降级策略：API → fallback-prompts → 通用提示 | ✅ 已实现 |
| SQLite 并发性能瓶颈 | 低 | 中 | 单文件数据库，MVP 阶段够用；后续迁移 PostgreSQL | 监控中 |
| WebSocket 生产环境稳定性 | 中 | 高 | 使用 Socket.io 自动重连；后续考虑 Redis Adapter | 监控中 |
| 知乎 API 未获取 | 高 | 中 | 已准备 Mock 数据 + fallback-prompts 兜底 | 待 5/9-12 |
| 评审时间紧迫 | 中 | 高 | 核心功能优先，AI 场景图等延后 | 进行中 |

---

## 十一、总结与下一步

### v4.0 完成总结

《群像·星火》MVP 已完成全部 Phase 1~4 开发：
- **216 个测试**全部通过，覆盖全部 22 个 API 路由、WebSocket、前端 Hooks、UI 组件
- **AI 双引擎**就位：story-weaver（故事串联）+ prompt-generator（催化提示），均接入 DeepSeek API 并配备三级降级
- **实时通信**：Socket.io 完整实现房间消息广播
- **三级模式**：单人/双人/多人玩法流程全部打通

### 下一步（评审前）

1. **知乎 API 接入**（5月9-12号获取 key 后）：替换脑洞内容的 Mock 标志
2. **路演 PPT 制作**：产品亮点 + 技术架构 + Demo 录屏
3. **网页版路演展示**：基于 Next.js 的路由动画演示页
4. **覆盖率补齐**：story-weaver.ts 等低覆盖模块补充测试

---

*文档版本：v4.0 | 最后更新：2026-04-29 | 分支：dev | 测试状态：216/216 passed*
