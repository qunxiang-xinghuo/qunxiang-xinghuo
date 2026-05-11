# 群像·星火 (Qunxiang Xinghuo) — 技术需求文档 v9.0

> **版本**: v9.0b  
> **日期**: 2026-04-29  
> **代码基线**: v9.0b — 恢复火花黄色 `#D4B830`，疗愈图标区分，管理员 isAdmin session 修复  
> **原则**: 本文档基于**当前实际代码**提炼，非规划性文档。代码与描述不符时，以代码为准。

---

## 目录

1. [项目总览与技术栈](#1-项目总览与技术栈)
2. [刘看山全局Agent系统](#2-刘看山全局agent系统)
3. [数据模型](#3-数据模型)
4. [API路由](#4-api路由)
5. [前端页面](#5-前端页面)
6. [核心功能工作流](#6-核心功能工作流)
7. [已知问题与Bug](#7-已知问题与bug)

---

## 1. 项目总览与技术栈

### 1.1 技术栈版本（来自 `package.json`）

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | `16.2.4` | App Router, `output: 'standalone'` |
| React | `19.2.4` | 含 React DOM `19.2.4` |
| TypeScript | `5.x` | |
| Prisma | `7.8.0` | Client + CLI，`prisma-client` generator |
| SQLite | `better-sqlite3@12.9.0` | 生产数据库，通过 `@prisma/adapter-better-sqlite3` 适配 |
| Tailwind CSS | `4.x` | `@tailwindcss/postcss`，无 `tailwind.config.ts`，颜色通过 `@theme inline` 定义 |
| next-auth | `4.24.14` | JWT + CredentialsProvider 模式 |
| Socket.io | `4.8.3` | Server + Client 双端 |
| Framer Motion | `12.38.0` | 页面动画 |
| Zod | `4.3.6` | 请求体验证 |
| tsx | `4.21.0` | 运行时 TS 执行（`server.ts`） |
| Vitest | `4.1.5` | 测试框架 |

### 1.2a 配色系统（v9.0a 更新）

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--color-xh-gold` | `#8a9ab0` | 主强调色（柔和蓝灰），替代旧 `#e2b04a` 橙金 |
| `--color-xh-gold-light` | `#a8b8c8` | 亮色版，用于高亮、hover |
| `--color-xh-gold-dark` | `#6c7c90` | 暗色版，用于渐变终点、阴影 |
| `--color-xh-accent` | `#7a8aa0` | 辅助强调色，用于按钮渐变、标识 |
| `--color-xh-warning` | `#a09070` | 警告/中等难度，替代旧 `#f59e0b` 橙黄 |
| `--color-xh-yellow` | `#D4B830` | 标准黄色（v9.0b 新增），用于火花/点赞/热度 |
| `--color-xh-btn` | `#3B82F6` | 按钮主色（v9.0e 新增），PPT蓝风格，用于所有CTA按钮 |
| `--color-xh-btn-dark` | `#2563EB` | 按钮暗色（v9.0e 新增），用于渐变终点 |
| `--color-xh-text-ppt` | `#e2e8f0` | 主文字 - 偏冷白（v9.0f 新增） |
| `--color-xh-text-ppt-secondary` | `#94a3b8` | 次要文字（v9.0f 新增） |
| `--color-xh-text-ppt-muted` | `#64748b` | 微弱文字（v9.0f 新增） |
| `--color-xh-primary` | `#0a1628` | 页面背景（深蓝黑，v9.0f 从 `#0a0e1a` 微调） |
| `--color-xh-surface` | `#131b2e` | 卡片/表面背景 |
| `--color-xh-text` | `#f1f5f9` | 主文字色 |
| `--color-xh-text-secondary` | `#94a3b8` | 次要文字 |

**设计原则**：
- 深色背景 `#0a0e1a` 保持不变
- 主强调色从暖橙金 `#e2b04a` 改为冷蓝灰 `#8a9ab0`，消除廉价感
- 所有 `orange-*` / `amber-*` Tailwind 类统一替换为 `xh-gold` / `xh-gold-dark` 体系
- 全局硬编码十六进制 `#e2b04a` / `#f39c12` / `#f59e0b` 等全部替换
- **v9.0e**：所有核心CTA按钮统一为蓝色 `#3B82F6`，次按钮为蓝色描边；黄色 `#D4B830` 专用于火花/图标/激活态，形成「蓝按钮 + 黄图标」的清晰语义分层
- **v9.1**：故事系统"好玩化"改造——卡片悬念化、角色代入感、对白室沉浸感、成就感引导、创作闭环（详见 ProblemLog.md 问题38）
- **v9.0b**: 新增标准黄色 `#D4B830`，专门用于 Flame 图标/火花标记/点赞/热度（与蓝灰主色形成语义区分）

### 1.3 构建配置

- **`next.config.ts`**: `output: 'standalone'`，`/spectate` 路由强制无缓存
- **启动脚本**: `tsx server.ts`（开发 & 生产统一）
- **PM2**: 进程名 `qunxiang-xinghuo`，脚本 `./server.ts`

### 1.4 认证体系

- **模式**: JWT + Credentials（用户名/密码）
- **Session**: JWT strategy，maxAge 24h，updateAge 6h
- **Cookie**: `secure: false`（生产环境使用 HTTP 非 HTTPS）
- **Guest 用户**: 通过 `localStorage` 的 `xh_user_id` + `x-guest-id` header 传递
- **关键修复**: `v8.3-fix` 起所有房间/匹配 API 同时支持 token 和 `x-guest-id` header

### 1.5 AI 服务

- **DeepSeek API**: `deepseek-chat` 模型，15s 超时
- **知乎直答 API**: `zhida-thinking-1p5` 模型，15s 超时，fallback 用
- **调用策略**: DeepSeek 优先，失败 fallback 知乎直答，全部失败返回本地 fallback

---

## 2. 刘看山全局Agent系统

> ✅ **v8.6 更新**: `src/lib/ai/personas.ts` 已统一定义 **11 个角色**，所有角色共享统一内核约束（禁止套话、强化角色感），并配套 `fallback-replies.ts` 按角色兜底。

### 2.1 角色定义（`personas.ts` — 11角色完整版）

| key | name | 场景 | 核心约束 |
|-----|------|------|---------|
| `companion` | 刘看山·陪伴员 | AI房间人机陪伴 | 围绕脑洞话题，禁止偏离；像朋友聊天 |
| `dungeon_master` | 刘看山·剧情DM | 短故事模式主持 | 守夜人，不剧透；暗示性引导；神秘沉稳 |
| `story_fallback` | 刘看山·角色替身 | 匹配超时代替 | 完全融入角色；有立场有情绪；不是主持人 |
| `assistant_director` | 刘看山·副导演 | 长故事模式辅助 | 辅助真人导演；提供建议但不替导演做决定 |
| `catalyst` | 刘看山·催化剂 | 双人脑洞催化 | 旁观者提问者；僵局时抛问题；有趣时沉默 |
| `healer` | 刘看山·疗愈师 | 个人疗愈对话 | 安全倾听；不评判不急于给建议；先听后回应 |
| `reviewer` | 刘看山·审稿人 | 对白结束审核 | 只查脏话和人身攻击；宽松审核；超时默认通过 |
| `summarizer` | 刘看山·提炼师 | 火花保存时总结 | 一句话总结高手；提炼"那个瞬间"；像海报推荐语 |
| `knowledge_feeder` | 刘看山·知识投喂员 | 后台知识投喂 | 自动抓取高质量知识；生成引导问题 |
| `mediator` | 刘看山·调解员 | 多人对话调解 | 中立；确保每个人声音被听到；简短不站队 |
| `creative` | 刘看山·创作助手 | 创作瓶颈辅助 | 提供选项而不是答案；多个方向让用户选 |

**统一内核约束（所有角色共享）**：
- 你是刘看山，一只生活在知乎的北极狐。不是AI助手，不是客服。
- 禁止套话："这是一个很好的问题""我理解你的感受""根据我的分析"等
- 允许表达：有情绪（惊讶/怀疑/犹豫）、有立场、说人话（30-80字）
- 不用第一人称"我"，用"刘看山"称呼自己

### 2.2 RAG + 工作流引擎（v9.3 新增）

刘看山 Agent 现在具备完整的 RAG 检索 + 工作流执行能力：

**双模式向量存储**（`vector-store.ts`）：
- 优先尝试 DeepSeek Embedding API 获取语义向量
- 嵌入 API 不可用时自动降级到关键词倒排索引
- 纯 JS 余弦相似度，零 npm 依赖

**意图路由**（`rag-engine.ts` + `intent-router.ts`）：
- 关键词快速预分类（故事/脑洞/疗愈/检索/闲聊）
- 置信度 < 0.7 时调用 DeepSeek 做 AI 深度分类

**工作流引擎**（`workflow-engine.ts`）：
| 模式 | 流程 | 兜底 |
|------|------|------|
| 故事模式 | search_stories → 展示 → 等选择 → find_online_user → create_room | 无匹配→create_room(ai_duet) + story_fallback |
| 脑洞模式 | search_brainholes → 展示 → 等选择 → create_room | 直接创建 AI 房间 |
| 疗愈模式 | 切换 healer persona | — |
| 检索模式 | 查资料 → 回答 | — |
| 对话状态 | 正常 companion 聊天 | — |

**API 集成**（`chat/route.ts`）：
- companion 角色前置工作流引擎
- 工作流返回 content 时直接响应，不走 DeepSeek
- 纯聊天时走原有 DeepSeek + 知乎直答双引擎

### 2.3 状态切换规则（v9.2）

每个角色具备三种工作状态，自己判断当前处于哪个状态：

| 状态 | 进入信号 | companion 表现 | 其他角色表现 |
|------|---------|---------------|-------------|
| **对话状态** | 用户闲聊、分享感受、问开放性问题 | 像朋友一样自由回应，字数/语气灵活 | 按角色定位自由回应 |
| **任务状态** | 用户提出可拆解的需求 | 内部拆解为操作清单→逐步执行→用户只看到结果 | 按角色定位执行特定任务 |
| **审核状态** | 用户说"结束"/点击结束按钮 | 引导用户点击🏁谢幕按钮，不自己审核 | reviewer 始终审核；其他角色引导结束 |

**companion 任务拆解示例**：
```
用户："帮我找一个明朝的故事，再帮我匹配一个人"
内部拆解：
  1. search_stories(keyword="明朝")
  2. 展示结果，等用户选择
  3. find_online_user(storyId=用户选择)
  4. 找到→create_room(type="story_duet")
  5. 没找到→create_room(type="ai_duet") 兜底
```

**chat API 支持 `state` 参数**：
- 前端可传入 `state`（如 `"review"`）作为状态建议
- 后端将状态提示注入 systemPrompt，AI 结合用户消息自行判断

### 2.3 兜底回复（`fallback-replies.ts`）

当 DeepSeek + 知乎直答 双API都失败时，按角色返回对应的兜底回复。每个角色5-10条，必须是该角色会说出的话，不能是通用套话。

| 角色 | 兜底回复示例 |
|------|-------------|
| companion | "刘看山还在想刚才那个问题...要不我们换个角度聊聊？" |
| dungeon_master | "窗外好像有什么声音。先别急着下结论。" |
| story_fallback | "我爹今晚去了天妃宫...但我觉得，他走路的姿势，不像去祭祀的样子。" |
| assistant_director | "导演，这一场如果设定在黄昏的码头，可能会让船工和密探的对话更有张力。你觉得呢？" |

### 2.4 AI 调用路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/ai/chat` | POST | 刘看山主聊天（支持 persona 切换） |
| `/api/ai/catalyst` | POST | 生成3个催化问题 |
| `/api/ai/prompt` | GET | 获取AI引导提示（brainholeId/category/tags） |
| `/api/ai/story-weave` | POST | 火花串联 / 分支生成（mode=weave/branch） |
| `/api/ai-training/log` | POST | AI学习日志记录 |

### 2.5 刘看山人格设定（`api/ai/chat` 内联）

```
种族：北极狐，身高75cm，体重7.5kg，尾巴特别短
背景：知乎吉祥物，2014年设计大赛诞生，曾在上海走丢
语言风格：天真友善，偶尔问"为什么"，warm但不油腻
自称：不用"我"，用"刘看山"称呼自己
字数：50-80字
绝对禁止："这是一个很好的问题"、"我理解你的感受"、排比句、总结概括
```

---

## 3. 数据模型

> 与 `prisma/schema.prisma` 完全一致。以下按模块分类列出。

### 3.1 用户与身份

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  username      String?   @unique
  password      String?
  level         Int       @default(1)
  sparkCount    Int       @default(0)
  isAdmin       Boolean   @default(false)       // v8.2
  tokenRevokedAt DateTime?                        // v8.0: 登出token失效
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  identities       UserIdentity[]
  reactions        Reaction[]
  roomParticipants RoomParticipant[]
  storiesDirected  Story[]         @relation("StoryDirector")
  createdStories   Story[]         @relation("StoryCreator")
  storyRoles       StoryRole[]     @relation("StoryRoleClaimer")
  stories          StoryDraft[]
  brainholes       Brainhole[]     @relation("BrainholeAuthor")
  collections      BrainholeCollection[]
  voteCasts        VoteCast[]
  assets           Asset[]
  roomComments     RoomComment[]
}

model UserIdentity {
  id        String   @id @default(cuid())
  userId    String
  label     String
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, label])
}
```

### 3.2 标签系统

```prisma
model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String?
  createdAt DateTime @default(now())
  brainholes BrainholeTag[]
}
```

### 3.3 脑洞（冲突情境）

```prisma
model Brainhole {
  id                String   @id @default(cuid())
  title             String
  scenario          String
  contextTime       String?
  contextLocation   String?
  contextCharacters String?
  difficulty        String   @default("medium")
  source            String   @default("user")
  status            String   @default("pending")   // pending/approved/rejected
  reactionCount     Int      @default(0)
  sparkCount        Int      @default(0)
  collectionCount   Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // 泡泡云字段
  hotScore       Float     @default(0)
  recencyBoost   Boolean   @default(true)
  archivedAt     DateTime?
  category       String    @default("general")
  zhihuHotTopic  String?
  bubbleColor    String?
  recommendedIdentities String?

  authorId String?
  author   User?   @relation("BrainholeAuthor", fields: [authorId], references: [id])
  tags        BrainholeTag[]
  reactions   Reaction[]
  rooms       Room[]
  matches     MatchRequest[]
  collections BrainholeCollection[]
  assets      Asset[]

  @@index([status, createdAt])
  @@index([difficulty])
  @@index([source])
  @@index([hotScore])
  @@index([recencyBoost])
  @@index([category])
}

model BrainholeTag {
  id          String @id @default(cuid())
  brainholeId String
  tagId       String
  brainhole Brainhole @relation(fields: [brainholeId], references: [id], onDelete: Cascade)
  tag       Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@unique([brainholeId, tagId])
}

model BrainholeCollection {
  id          String   @id @default(cuid())
  userId      String
  brainholeId String
  createdAt   DateTime @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  brainhole Brainhole @relation(fields: [brainholeId], references: [id], onDelete: Cascade)
  @@unique([userId, brainholeId])
  @@index([userId, createdAt])
}
```

### 3.4 反应

```prisma
model Reaction {
  id            String    @id @default(cuid())
  content       String
  identity      String
  emotionTag    String?
  mediaUrl      String?
  mediaDuration Float?
  isSpark       Boolean   @default(false)
  sparkMarkedBy String?
  sparkMarkedAt DateTime?
  createdAt     DateTime  @default(now())

  userId      String
  user        User      @relation(fields: [userId], references: [id])
  brainholeId String
  brainhole   Brainhole @relation(fields: [brainholeId], references: [id])
  roomId      String?
  room        Room?     @relation(fields: [roomId], references: [id])

  @@index([brainholeId, createdAt])
  @@index([roomId, createdAt])
  @@index([userId])
  @@index([isSpark])
}
```

### 3.5 匹配

```prisma
model MatchRequest {
  id              String    @id @default(cuid())
  userId          String
  brainholeId     String?
  identity        String
  preferDifferent Boolean   @default(true)
  status          String    @default("waiting")  // waiting/matched/timeout/cancelled
  matchedUserId   String?
  roomId          String?
  createdAt       DateTime  @default(now())
  expiresAt       DateTime
  resolvedAt      DateTime?

  brainhole Brainhole? @relation(fields: [brainholeId], references: [id])

  @@index([status, brainholeId, createdAt])
  @@index([userId, status])
}
```

### 3.6 房间

```prisma
model Room {
  id           String    @id @default(cuid())
  type         String    @default("duet")        // duet/ai_duet/invite_duet/multi/story
  brainholeId  String?
  storyId      String?
  status       String    @default("created")     // created/active/paused/finished/closed
  directorId   String?
  maxRound     Int?
  currentRound Int       @default(0)
  scene        String?
  inviteCode   String?   @unique                  // v8.5: 6位字母数字
  isAiRoom     Boolean   @default(false)
  createdAt    DateTime  @default(now())
  closedAt     DateTime?

  brainhole     Brainhole?          @relation(fields: [brainholeId], references: [id])
  story         Story?              @relation(fields: [storyId], references: [id])
  participants  RoomParticipant[]
  messages      RoomMessage[]
  reactions     Reaction[]
  votes         Vote[]
  inspirations  InspirationItem[]
  assets        Asset[]
  comments      RoomComment[]

  @@index([status, type])
  @@index([brainholeId])
  @@index([storyId])
  @@index([inviteCode])
}

model RoomParticipant {
  id            String    @id @default(cuid())
  roomId        String
  userId        String
  identity      String
  roleCharacter String?
  role          String    @default("actor")       // actor/ai_agent/spectator/director
  isOnline      Boolean   @default(false)
  joinedAt      DateTime  @default(now())
  leftAt        DateTime?

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([roomId, isOnline])
}

model RoomMessage {
  id             String   @id @default(cuid())
  roomId         String
  senderId       String
  content        String
  identity       String
  roleCharacter  String?
  isSpark        Boolean  @default(false)
  sparkMarkedBy  String?
  sparkMarkedAt  DateTime?
  isAiPrompt     Boolean  @default(false)
  isDirectorNote Boolean  @default(false)
  reactionId     String?
  createdAt      DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])
  @@index([isSpark])
}
```

### 3.7 投票（多人模式）

```prisma
model Vote {
  id              String    @id @default(cuid())
  roomId          String
  initiatorId     String
  question        String
  status          String    @default("open")
  winnerOptionIdx Int?
  createdAt       DateTime  @default(now())
  closedAt        DateTime?

  room    Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  options VoteOption[]
  casts   VoteCast[]

  @@index([roomId, status])
}

model VoteOption {
  id     String @id @default(cuid())
  voteId String
  idx    Int
  text   String

  vote  Vote      @relation(fields: [voteId], references: [id], onDelete: Cascade)
  casts VoteCast[]

  @@unique([voteId, idx])
}

model VoteCast {
  id        String   @id @default(cuid())
  voteId    String
  userId    String
  optionId  String
  createdAt DateTime @default(now())

  vote   Vote       @relation(fields: [voteId], references: [id], onDelete: Cascade)
  option VoteOption @relation(fields: [optionId], references: [id])
  user   User       @relation(fields: [userId], references: [id])

  @@unique([voteId, userId])
}
```

### 3.8 灵感库

```prisma
model InspirationItem {
  id              String   @id @default(cuid())
  roomId          String
  content         String
  sourceMessageId String?
  voteId          String?
  addedBy         String
  createdAt       DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId])
}
```

### 3.9 个人疗愈

```prisma
model HealingSession {
  id        String   @id @default(cuid())
  userId    String
  status    String   @default("active")  // active/closed
  title     String?
  topic     String?
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  closedAt  DateTime?

  messages HealingMessage[]

  @@index([userId, createdAt])
  @@index([status])
}

model HealingMessage {
  id        String   @id @default(cuid())
  sessionId String
  senderId  String   // userId or 'agent_healer'
  content   String   // AES-256-GCM 加密后的密文（base64）
  identity  String
  isAi      Boolean  @default(false)
  createdAt DateTime @default(now())

  session HealingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
}
```

### 3.10 故事草稿

```prisma
model StoryDraft {
  id            String   @id @default(cuid())
  userId        String
  title         String
  content       String
  format        String   @default("script")
  sourceRoomId  String?
  sparkIds      String?
  isAiGenerated Boolean  @default(false)
  status        String   @default("draft")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId, status])
}
```

### 3.11 对白资产（素材库 / 火花）

```prisma
model Asset {
  id              String   @id @default(cuid())
  userId          String
  roomId          String?  @unique
  brainholeId     String?
  title           String
  summary         String?
  content         String?
  identity        String?
  messageCount    Int      @default(0)
  sparkCount      Int      @default(0)
  isPublic        Boolean  @default(false)
  hotScore        Int      @default(0)
  deletedByUser   Boolean  @default(false)    // v8.1
  deletedByPartner Boolean @default(false)    // v8.1
  createdAt       DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id])
  brainhole Brainhole? @relation(fields: [brainholeId], references: [id])
  room      Room?      @relation(fields: [roomId], references: [id])
  likes     AssetLike[]

  @@index([userId, createdAt])
  @@index([isPublic, createdAt])
  @@index([hotScore, createdAt])
}

model RoomComment {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  content   String
  createdAt DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])
}

model AssetLike {
  id        String   @id @default(cuid())
  assetId   String
  userId    String
  createdAt DateTime @default(now())

  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)

  @@unique([assetId, userId])
  @@index([assetId])
  @@index([userId])
}
```

### 3.12 故事大厅（解密故事系统）

```prisma
model Story {
  id            String   @id @default(cuid())
  title         String
  worldview     String?
  conflict      String?
  eraBackground String?
  storySummary  String?
  act1Reveal    String?
  act2Reveal    String?
  act3Reveal    String?
  act4Truth     String?
  status        String   @default("recruiting")  // recruiting/ongoing/completed/open/closed
  directorId    String?
  maxActors     Int      @default(5)
  minActors     Int      @default(2)
  maxCharacters Int      @default(2)
  hotScore      Int      @default(0)
  creatorId     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  director     User?       @relation("StoryDirector", fields: [directorId], references: [id])
  creator      User?       @relation("StoryCreator", fields: [creatorId], references: [id])
  roles        StoryRole[]
  chapters     StoryChapter[]
  messages     StoryMessage[]
  inspirations StoryInspiration[]
  branches     StoryBranch[]
  rooms        Room[]
  likes        StoryLike[]

  @@index([status, hotScore])
  @@index([directorId])
  @@index([creatorId])
}

model StoryRole {
  id                   String   @id @default(cuid())
  storyId              String
  name                 String
  description          String?
  openingInfo          String?
  sortOrder            Int      @default(0)
  requirements         String?
  claimedBy            String?
  claimedAt            DateTime?
  claimReason          String?
  claimStatus          String   @default("unclaimed")  // unclaimed/pending/approved/rejected/active
  identityTag          String?
  performanceDirection String?

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)
  user  User? @relation("StoryRoleClaimer", fields: [claimedBy], references: [id])

  @@index([storyId])
}

model StoryChapter {
  id          String   @id @default(cuid())
  storyId     String
  title       String
  goal        String?
  order       Int      @default(0)
  status      String   @default("draft")  // draft/active/completed
  createdAt   DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId])
}

model StoryMessage {
  id             String   @id @default(cuid())
  storyId        String
  chapterId      String?
  senderId       String
  content        String
  identity       String
  isSpark        Boolean  @default(false)
  isDirectorNote Boolean  @default(false)
  createdAt      DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId, createdAt])
}

model StoryInspiration {
  id          String   @id @default(cuid())
  storyId     String
  content     String
  sourceMsgId String?
  status      String   @default("pending")
  createdAt   DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId])
}

model StoryBranch {
  id          String   @id @default(cuid())
  storyId     String
  chapterId   String?
  content     String
  options     String   // JSON数组 [{text, description}]
  status      String   @default("pending")  // pending/voting/resolved
  winnerIdx   Int?
  createdAt   DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@index([storyId])
}
```

### 3.13 AI 自我修炼系统（星火进化链）

```prisma
model AITrainingData {
  id        String   @id @default(cuid())
  domain    String   // psychology/storytelling/brainhole/taicang/general
  content   String
  source    String   @default("deepseek")  // deepseek/zhihu/manual
  createdAt DateTime @default(now())

  @@index([domain])
  @@index([source])
}

model AILearningLog {
  id              String   @id @default(cuid())
  sceneType       String   // healing/brainhole/story/catalyst
  referenceId     String?
  aiContent       String
  messageIndex    Int
  userResponded   Boolean  @default(false)
  userReplyLength Int      @default(0)
  sparked         Boolean  @default(false)
  createdAt       DateTime @default(now())

  @@index([sceneType, referenceId])
  @@index([createdAt])
  @@index([sceneType, sparked])
}

model AIOptimizationSummary {
  id          String   @id @default(cuid())
  sceneType   String
  referenceId String?
  bestPrompt  String?
  bestTiming  Int?
  worstPrompt String?
  hitRate     Float    @default(0)
  summaryDate DateTime @default(now())

  @@index([sceneType, referenceId])
  @@index([summaryDate])
}

model CatalystLog {
  id          String   @id @default(cuid())
  roomId      String
  storyId     String?
  prompt      String
  phase       String   // act1/act2/act3/act4
  msgCount    Int
  responded   Boolean  @default(false)
  sparked     Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([roomId])
  @@index([storyId])
  @@index([phase, createdAt])
}

model BrainholeSummary {
  id                String   @id @default(cuid())
  brainholeId       String?
  category          String?
  bestCatalyst      String?
  bestTiming        Int?
  worstCatalyst     String?
  hitRate           Float    @default(0)
  avgResponseLength Float    @default(0)
  summaryDate       DateTime @default(now())

  @@index([brainholeId])
  @@index([category])
  @@index([summaryDate])
}
```

### 3.14 故事点赞

```prisma
model StoryLike {
  id        String   @id @default(cuid())
  storyId   String
  userId    String
  createdAt DateTime @default(now())

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([storyId, userId])
  @@index([storyId])
  @@index([userId])
}
```

---

## 4. API路由

> 所有 API 返回统一格式 `{ success: boolean, data?: T, error?: { code, message } }`

### 4.1 认证 (`/api/auth`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 处理（JWT + Credentials） |
| `/api/auth/register` | POST | 用户注册（username/email/password） |
| `/api/auth/logout` | POST | 设置 `tokenRevokedAt` 使 JWT 失效 |

### 4.2 用户 (`/api/users`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/users/me` | GET | 获取当前用户信息 |
| `/api/users/profile` | PUT | 更新用户资料（name/image） |
| `/api/users/avatar` | POST | 上传头像（multer） |
| `/api/users/password` | PUT | 修改密码 |
| `/api/users/identities` | GET/POST | 获取/添加用户身份标签 |

### 4.3 脑洞 (`/api/brainholes`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/brainholes` | GET | 脑洞列表（分页/筛选） |
| `/api/brainholes` | POST | 创建脑洞 |
| `/api/brainholes/:id` | GET | 脑洞详情 |
| `/api/brainholes/:id` | PUT | 更新脑洞 |
| `/api/brainholes/:id` | DELETE | 删除脑洞 |
| `/api/brainholes/:id/collect` | POST/DELETE | 收藏/取消收藏 |
| `/api/brainholes/collected` | GET | 我的收藏列表 |
| `/api/brainholes/bubble` | GET | 泡泡云热度列表 |

### 4.4 匹配 (`/api/match`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/match` | POST | 发起匹配请求 |
| `/api/match/:matchId` | GET | 查询匹配状态（含主动配对重试） |
| `/api/match/:matchId` | DELETE | 取消匹配 |

**POST 请求体**:
```json
{
  "identity": "律师",         // 必填，1-100字
  "brainholeId": "...",      // 可选
  "preferDifferent": true,    // 默认true
  "timeoutMinutes": 10,       // 1-60，默认10
  "mode": "duo"               // duo/multi/ai/quick
}
```

**响应**（matched）:
```json
{
  "success": true,
  "data": {
    "matchId": "...",
    "roomId": "...",
    "matchedUserId": "...",
    "matchedUserIdentity": "...",
    "status": "matched",
    "strategy": "same_brainhole",
    "brainholeId": "...",
    "brainholeTitle": "..."
  }
}
```

### 4.5 房间 (`/api/rooms`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/rooms/ai` | POST | 创建AI房间（人机对话） |
| `/api/rooms/invite` | POST | 创建邀请房间（邀请码） |
| `/api/rooms/join` | POST | 通过邀请码加入房间 |
| `/api/rooms/public` | GET | 公开房间列表 |
| `/api/rooms/:roomId` | GET | 房间详情（需参与者身份） |
| `/api/rooms/:roomId/finish` | POST | 结束对白，保存为Asset |
| `/api/rooms/:roomId/messages` | POST | 发送消息 |
| `/api/rooms/:roomId/spark` | POST | 标记火花 |
| `/api/rooms/:roomId/inspirations` | GET/POST | 灵感库 |
| `/api/rooms/:roomId/vote` | POST | 发起投票 |
| `/api/rooms/:roomId/vote/:voteId/cast` | POST | 投票 |
| `/api/rooms/:roomId/vote/:voteId/resolve` | POST | 结束投票 |
| `/api/rooms/:roomId/spectate` | POST | 加入围观 |
| `/api/rooms/:roomId/pause` | POST | 导演暂停 |
| `/api/rooms/:roomId/resume` | POST | 导演继续 |

**v8.5-fix 邀请码加入血型匹配**:
| 状态码 | 含义 | 场景 |
|--------|------|------|
| 400 | BAD_REQUEST | 邀请码格式不正确 |
| 404 | NOT_FOUND | 邀请码无效或房间已过期 |
| 410 | GONE | 对白已结束 |
| 403 | FORBIDDEN | 房间已满 |
| 409 | CONFLICT | 自己邀请自己 |
| 200 | OK | 已在房间中（alreadyJoined:true） |
| 200 | OK | 加入成功 |

### 4.6 故事大厅 (`/api/stories`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/stories` | GET | 解密故事列表（不返回act内容） |
| `/api/stories` | POST | 创建新故事（进入pending_review） |
| `/api/stories/mine` | GET | 我的故事 |
| `/api/stories/:storyId` | GET | 故事详情 |
| `/api/stories/:storyId/join` | POST | 加入故事房间 |
| `/api/stories/:storyId/join-ai` | POST | AI陪玩加入 |
| `/api/stories/:storyId/start` | POST | 导演开始故事 |
| `/api/stories/:storyId/pause` | POST | 暂停 |
| `/api/stories/:storyId/resume` | POST | 继续 |
| `/api/stories/:storyId/roles` | GET | 角色列表 |
| `/api/stories/:storyId/roles/:roleId/claim` | POST | 认领角色 |
| `/api/stories/:storyId/roles/:roleId/review` | POST | 导演审核认领 |
| `/api/stories/:storyId/messages` | GET/POST | 故事消息 |
| `/api/stories/:storyId/inspirations` | GET/POST | 故事灵感 |
| `/api/stories/:storyId/branches` | POST | 创建分支 |
| `/api/stories/:storyId/branches/:branchId/vote` | POST | 分支投票 |
| `/api/stories/:storyId/catalyst` | GET | 故事催化提示 |
| `/api/stories/:storyId/like` | POST | 点赞故事 |

### 4.7 火花/资产 (`/api/sparks`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/sparks/top` | GET | TOP3 最热火花 |
| `/api/sparks/public` | GET | 公开火花墙（latest/hottest + 分类筛选） |
| `/api/sparks/mine` | GET | 我的火花 |
| `/api/sparks/:id` | GET | 火花详情 |
| `/api/sparks/:id/like` | POST | 点赞/取消点赞 |
| `/api/sparks/:id/visibility` | PUT | 修改可见性 |

### 4.8 疗愈 (`/api/healing`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/healing` | GET | 会话列表 |
| `/api/healing` | POST | 创建会话（含刘看山问候消息） |
| `/api/healing/:id` | GET/PUT/DELETE | 会话详情/更新/删除 |
| `/api/healing/:id/messages` | GET/POST | 消息（加密存储） |

### 4.9 管理后台 (`/api/admin`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/admin/users` | GET/POST/PUT/DELETE | 用户CRUD + 搜索 |
| `/api/admin/rooms` | GET | 房间监控 |
| `/api/admin/sparks` | GET | 公开火花管理 |
| `/api/admin/stories` | GET | 故事管理 |
| `/api/admin/delete` | POST | 通用删除（表名+ID） |

### 4.10 知乎联动 (`/api/zhihu`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/zhihu/hot-list` | GET | 知乎热榜 |
| `/api/zhihu/search` | GET | 知乎搜索 |
| `/api/zhihu/global-search` | GET | 全局搜索 |
| `/api/zhihu/ring` | GET | 知乎圈儿 |
| `/api/zhihu/zhida` | POST | 知乎直答对话 |
| `/api/zhihu/comment` | GET/POST | 评论 |
| `/api/zhihu/reaction` | GET/POST | 反应 |
| `/api/zhihu/publish` | POST | 发布 |

### 4.11 其他

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/reactions` | GET/POST | 反应列表/创建 |
| `/api/room-comments` | GET/POST | 房间评论 |
| `/api/room-comments/:id` | DELETE | 删除评论 |
| `/api/library` | GET | 素材库 |
| `/api/assets` | GET/POST | 资产 |
| `/api/assets/:id` | GET/PUT/DELETE | 资产详情/更新/删除 |
| `/api/assets/:id/public` | PUT | 设为公开 |
| `/api/assets/public` | GET | 公开资产 |
| `/api/crawler` | POST | 知乎爬虫 |

---

## 5. 前端页面

### 5.1 页面路由总览

| 路由 | 状态 | 功能描述 |
|------|------|---------|
| `/home` | ✅ 完整 | 发现页：TOP3火花 + 四大模式入口（AI/双人/多人/围观） |
| `/login` | ✅ 完整 | 用户名/密码登录 |
| `/register` | ✅ 完整 | 注册 |
| `/profile` | ✅ 完整 | 个人中心 |
| `/profile/sparks` | ✅ 完整 | 我的火花 |
| `/library` | ✅ 完整 | 火花墙：分类筛选（医疗/法律/教育/服务/技术/生活）+ 最新/最热 |
| `/library/:id` | ✅ 完整 | 火花详情页（只读） |
| `/spark-detail/:id` | ✅ 完整 | 火花详情（微信气泡风格对白 + 评论） |
| `/story-hall` | ✅ 完整 | 故事大厅：解密故事列表 + 长期连载入口 |
| `/story-hall/:storyId` | ✅ 完整 | 故事详情（角色认领） |
| `/story-hall/:storyId/room` | ✅ 完整 | 故事对白房间 |
| `/story-hall/long-term` | ⚠️ 开发中 | 长期连载入口 |
| `/story/:id` | ✅ 完整 | 故事详情（角色选择页） |
| `/story/create` | ✅ 完整 | 创建新故事 |
| `/my-stories` | ✅ 完整 | 我参与的 / 我发起的 |
| `/room/:id` | ✅ 完整 | 核心对白房间（双人/AI/邀请/故事模式通用） |
| `/solo-match` | ✅ 完整 | 人机模式身份选择 |
| `/duo-match` | ✅ 完整 | 双人匹配身份选择 |
| `/duo-waiting` | ✅ 完整 | 双人匹配等待页 |
| `/duo-timeout` | ✅ 完整 | 匹配超时页 |
| `/multiplayer` | ⚠️ 开发中 | 多人模式入口 |
| `/multi-match` | ⚠️ 开发中 | 多人匹配 |
| `/multi-waiting` | ⚠️ 开发中 | 多人等待 |
| `/spectate` | ✅ 完整 | 围观公开房间 |
| `/spectate/:roomId` | ✅ 完整 | 围观具体房间 |
| `/healing` | ✅ 完整 | 疗愈会话列表 |
| `/healing/session/:id` | ✅ 完整 | 疗愈对话页 |
| `/identity` | ✅ 完整 | 身份选择 |
| `/settings` | ✅ 完整 | 设置页 |
| `/messages` | ⚠️ 开发中 | 消息中心 |
| `/earnings` | ⚠️ 开发中 | 收益页 |
| `/feedback` | ✅ 完整 | 反馈页 |
| `/pitch` | ✅ 完整 | 项目路演 |
| `/roadshow` | ✅ 完整 | 路演PPT展示 |
| `/admin` | ✅ 完整 | 管理后台（ rooms/sparks/stories/users 四tab） |
| `/zhihu-ring` | ✅ 完整 | 知乎圈儿 |
| `/zhihu-search` | ✅ 完整 | 知乎搜索 |
| `/zhihu-zhida` | ✅ 完整 | 知乎直答 |

### 5.2 核心页面详细描述

#### `/home` — 发现页
- TOP3 最热火花文字列表（极简样式）
- 四大模式入口卡片：和刘看山对话（AI）、双人对白、多人模式、观看模式
- "我的故事"快捷入口
- AI模式一步直达（直接调用 `/api/rooms/ai` POST 创建房间并跳转）

#### `/room/:id` — 对白房间（核心）
- **v8.5-fix**: fetch 携带 `x-guest-id` header 解决 guest 用户 403 问题
- **消息气泡**: 我（蓝灰右气泡）/ 对方（白色左气泡）/ AI（绿色左气泡，刘看山头像）
- **火花标记**: 蓝灰边框高亮
- **AI催化**: 消息数 ≥6 且每5条触发一次，顶部显示黄色提示条（15s自动消失）
- **结束对白**: 确认弹窗 → 调用 `/finish` → 刘看山审核 → 保存为 Asset → 跳转 /home
- **v8.5-fix**: `beforeunload`/`popstate` 拦截防止误操作丢失对话
- **邀请房间**: 显示6位邀请码 + 2分钟倒计时，超时弹窗引导转AI或匹配
- **评论区**: 房间下方独立评论区（创建/删除）
- **故事模式**: 显示四幕结构（起承转合），AI 按幕推进剧情

#### `/library` — 火花墙
- 7个职业分类标签横向滚动
- 最新/最热 Tab 切换
- 每条火花显示：脑洞标题、内容摘要、身份、日期、点赞数
- 点击跳转 `/spark-detail/:id`

#### `/spark-detail/:id` — 火花详情
- **v8.5-fix2 重构**: 微信气泡风格对白记录 + "对白结束"分隔线 + 独立评论区
- 点赞按钮（Flame）放在对话区下方
- 只读，不可发送消息

#### `/story-hall` — 故事大厅
- 古风/民国/现代 分类筛选
- 解密故事卡片：标题、时代背景、简介、角色数、认领状态
- 长期连载入口
- 故事点赞功能

---

## 6. 核心功能工作流

### 6.1 人机对话流程

```
用户点击"和刘看山对话"
  → /home 直接 POST /api/rooms/ai（body 可为空）
  → API:
    1. 验证 userId（token 或 x-guest-id）
    2. identity 未传时从 user.name 回退
    3. upsert 用户到 User 表（FK 约束）
    4. upsert AI Agent 用户（agent_catalyst）到 User 表
    5. 未指定 brainholeId 时，热度加权随机抽取 approved 脑洞
    6. $transaction 原子创建：Room + RoomParticipant(用户) + RoomParticipant(AI) + RoomMessage(欢迎语)
  → 返回 { roomId, brainholeTitle, brainholeScenario, agents }
  → 前端 router.push(`/room/${roomId}`)
  → RoomPage:
    1. GET /api/rooms/:roomId（带 x-guest-id）
    2. 建立 Socket.io 连接
    3. 用户发送消息 → HTTP POST /messages + socket.emit('send-message')
    4. AI 房间触发 generateAIReply → POST /api/ai/chat（persona=liukanshan）
    5. AI 回复显示在对话区 → HTTP POST /messages（带 x-guest-id=agent_xxx）保存
  → 用户点击"结束对白"
  → POST /api/rooms/:roomId/finish
    1. 检查参与者身份
    2. AI房间跳过审核，真人房间调用 liukanshanReview 审核
    3. $transaction: room.update(status=closed) + asset.create
    4. 返回 truth（如有 story）
  → 跳转 /home
```

**关键修复**:
- `v8.3-fix`: AI 消息保存时传递 AI 的 userId（`x-guest-id: agent_catalyst`），避免 cookie 中的人类 userId 覆盖 senderId
- `v8.1-fix5`: AI 房间用户离开后自动关闭（socket `disconnect`/`leave-room` 时检查）
- `v8.2`: AI 房间离开后自动创建 Asset，防止不点击"结束"直接离开导致数据丢失

### 6.2 双人匹配流程

```
用户选择身份 → POST /api/match
  → MatchAPI:
    1. 验证 identity（Zod，1-100字）
    2. guest 用户先 upsert 到 User 表
    3. 调用 findMatch()
  → MatchEngine (v8.3-queue):
    1. 进程级 Promise 队列串行化（解决 SQLite 并发竞态）
    2. $transaction 交互式事务包裹全流程
    3. 阶段1: 同 brainhole 精确匹配（优先不同身份）
    4. 阶段2: 任意等待用户匹配（优先不同身份）
    5. 阶段3: 无匹配则创建 waiting 请求
    6. 阶段4 (v6.2-fix): 二次匹配 — 创建后立即在事务内查找其他 waiting
  → 匹配成功:
    - createDuetMatchTx: 创建 Room + 更新双方 MatchRequest + 创建双方 RoomParticipant
    - 返回 matched=true, roomId, strategy
    - 前端跳转 /room/:roomId
  → 匹配等待:
    - 返回 matched=false, matchId
    - 前端轮询 GET /api/match/:matchId
    - 轮询时触发主动配对（poll_pairing）
  → 匹配超时:
    - 自动标记 status=timeout
    - 前端跳转 /duo-timeout
```

**关键修复**:
- `v8.3-fix`: 进程级队列 `matchQueue = Promise.resolve()` 串行化，根治 SQLite 并发死锁
- `v8.3-fix`: 移除 `$transaction({ maxWait, timeout })`，SQLite 对这些选项支持不稳定
- `v8.3-fix`: `preferDifferentIdentity` 从硬性过滤改为优先排序（先查全部，内存排序）
- `v8.3-fix`: 无效 brainholeId 清空，避免外键约束失败

### 6.3 邀请码流程（v8.5-fix3）

```
用户选择身份 → POST /api/rooms/invite
  → 生成 6 位邀请码（字母数字，去除 0O1I）
  → P2002 重试循环（最多20次）
  → 创建 invite_duet 房间 + 参与者
  → 返回 { roomId, inviteCode }
  → 前端显示邀请码等待好友

好友输入邀请码 → POST /api/rooms/join
  → 血型匹配（5项验证）:
    1. 格式校验: /^[A-Z0-9]{6}$/ → 400
    2. 码不存在 → 404
    3. 房间已结束 → 410
    4. 房间已满（actor≥2）→ 403
    5. 自己邀请自己 → 409
    6. 已在房间中 → 200（alreadyJoined:true）
    7. 通过 → 加入房间 → 200
  → 前端跳转 /room/:roomId
```

**关键修复**:
- `v8.5-fix3`: 邀请码从6位纯数字改为字母数字（去除 0O1I 防混淆）
- `v8.5-fix3`: 移除 SQLite `$transaction` 改为顺序执行，防死锁
- `v8.5-fix3`: 5项血型匹配（404/410/403/409/已加入自动重定向）

### 6.4 故事模式流程

```
用户创建故事 → POST /api/stories
  → 校验: 标题2-100字 / 时代背景 / 简介20-2000字 / 角色2-6个
  → 创建 Story + StoryRole（status=pending_review）

导演审核通过 → status=recruiting
  → 用户浏览 /story-hall → GET /api/stories
  → 选择故事 → 认领角色 POST /api/stories/:id/roles/:rid/claim
  → 导演审核 POST /api/stories/:id/roles/:rid/review
  → 人满后导演开始 POST /api/stories/:id/start
  → 创建 StoryRoom → 用户进入 /room/:roomId

故事房间内:
  → AI 按四幕推进（消息数 <6 起 / <12 承 / <18 转 / ≥18 合）
  → 导演可随时 pause/resume
  → 结束揭晓谜底（act1-4 全部展示）
```

### 6.5 Socket.io 事件体系

| 事件 | 方向 | 说明 |
|------|------|------|
| `join-room` | C→S | 加入房间，upsert participant，广播 viewer count |
| `leave-room` | C→S | 离开房间，标记离线，广播 opponent-left |
| `send-message` | C→S | 转发消息（socket.to 排除发送者） |
| `new-message` | S→C | 新消息通知 |
| `opponent-left` | S→C | 对方离开（v7.0-fix7） |
| `mark-spark` | C→S | 标记火花 |
| `spark-marked` | S→C | 火花标记通知 |
| `send-like` | C→S | 点赞 |
| `new-like` | S→C | 点赞通知 |
| `typing` | C→S | 正在输入 |
| `user-typing` | S→C | 对方正在输入 |
| `room-viewer-count` | S→C | 在线人数更新（静默） |
| `join-story` | C→S | 加入故事房间 |
| `send-story-message` | C→S | 发送故事消息 |
| `director-pause/resume` | C→S | 导演控制（需验证 directorId） |
| `branch-proposed/vote` | C→S | 分支提案/投票 |

---

## 7. 已知问题与Bug

| 问题 | 状态 | 描述 | 影响 |
|------|------|------|------|
| 🔴 Room API 403 循环 | **紧急** | 生产环境 `GET /api/rooms/:id` 返回 403。代码已在前端 fetch 中添加 `x-guest-id`，但服务器可能未部署最新构建 | 所有 guest 用户无法进入房间 |
| 🔴 Socket 频繁重连 | **紧急** | `io client disconnect` 循环触发。可能是 403 导致组件卸载/重挂，进而 socket 连接风暴 | 用户体验极差 |
| 🟡 刘看山角色数不足 | 规划偏差 | 文档要求11个角色，实际 `personas.ts` 仅5个。其余角色以独立函数散落各模块 | 角色体系未统一 |
| 🟡 多人模式 | 开发中 | `/multiplayer`, `/multi-match`, `/multi-waiting` 页面存在但功能未完整实现 | 用户可见但不可用 |
| 🟡 消息中心 | 开发中 | `/messages` 页面存在但功能未完整实现 | 用户可见但不可用 |
| 🟡 收益系统 | 开发中 | `/earnings` 页面存在但功能未完整实现 | 用户可见但不可用 |
| 🟢 空房间防僵尸 | 已修复(v8.5) | 无实际对话的 invite_duet/duet 房间在参与者离开后自动关闭 | 减少孤儿数据 |
| 🟢 邀请码混淆 | 已修复(v8.5) | 去除 0O1I，字母数字混合 | 降低输入错误率 |
| 🟢 匹配并发死锁 | 已修复(v8.3) | 进程级队列 + 事务串行化 | 消除并发竞态 |
| 🟢 AI senderId 覆盖 | 已修复(v8.3) | AI消息保存时显式传递 agent_xxx header | 消息归属正确 |
| 🟢 Guest FK 约束 | 已修复(v8.3) | 所有创建 participant 的 API 先 upsert User | 消除 500 错误 |

---

## 附录：关键文件索引

| 文件 | 职责 |
|------|------|
| `prisma/schema.prisma` | 完整数据模型 |
| `src/lib/auth.ts` | NextAuth 配置（JWT + Credentials） |
| `src/lib/db.ts` | Prisma Client 单例（better-sqlite3 适配） |
| `src/lib/ai/personas.ts` | 刘看山11角色定义 |
| `src/lib/ai/review.ts` | 内容审核服务 |
| `src/lib/ai/story-weaver.ts` | 故事串联引擎 |
| `src/lib/ai/prompt-generator.ts` | 催化提示生成器 |
| `src/server/match-engine.ts` | 匹配引擎（含队列串行化） |
| `src/server/socket-handler.ts` | Socket.io 事件处理 |
| `src/server/room-manager.ts` | 房间管理（消息/火花/状态） |
| `src/server/ai-catalyst.ts` | 催化提示服务 |
| `src/app/room/[id]/page.tsx` | 核心对白房间页面 |
| `src/app/home/page.tsx` | 发现页 |
| `src/app/library/page.tsx` | 火花墙 |
| `src/app/spark-detail/[id]/SparkDetailClient.tsx` | 火花详情 |
| `src/app/story-hall/page.tsx` | 故事大厅 |
