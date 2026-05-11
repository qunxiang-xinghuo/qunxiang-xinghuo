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


---

## 2026-04-29 — v9.1 Agent 阶段2：刘看山思维升级

### 概述
为刘看山 `companion` 角色注入 Agent 能力，使其具备"主动调用工具"的思维框架，为后续阶段3（流程串联）铺垫。

### 变更内容

**新增 Agent 工具注册 (`src/lib/ai/agent-tools.ts`)**
- `search_stories(keyword?, era?)` — 搜索公开解密故事
- `search_brainholes(keyword?, category?)` — 搜索公开脑洞话题
- `find_online_user(storyId?)` — 查找等待匹配的在线用户
- `create_room(type, participants, storyId?, brainholeId?)` — 创建对白房间
- 类型定义：`ToolCall` / `ToolResult`
- 辅助函数：`renderToolsAsMarkdown()` — 将工具列表转为提示词 Markdown

**改造 companion 角色 (`src/lib/ai/personas.ts`)**
- 注入 Agent 核心规则："你不再是只能动嘴的AI。当用户提出要求时，必须判断是否能通过调用工具来更高效地完成，而不是用语言去搪塞。"
- 注入工具说明 Markdown（通过 `renderToolsAsMarkdown()`）
- 注入任务规划示例：选故事 → 配真人 → 兜底陪聊的 5 步流程

### 构建验证
- `npm run build` — ✅ 81/81 页面成功
- 已推送 `fqunxiang dev`

### 下一步
- ~~阶段3（流程串联）~~ ✅ 已完成，见下文

---

## 2026-04-29 — v9.1 Agent 阶段3：任务规划指南

### 概述
将阶段2的简单任务示例扩展为覆盖"选故事 → 配真人 → 兜底陪聊"完整决策链的多场景任务规划指南。

### 变更内容

**`src/lib/ai/agent-tools.ts` — `AGENT_TASK_EXAMPLE` 升级**
- 新增**核心决策原则**：3 层判断（必须调用工具 / 推荐话题 / 正常聊天）
- 新增**4 个场景示例**：
  - 场景1："我想玩故事" — 搜索故事 → 用户选择 → 匹配真人 / AI兜底
  - 场景2："帮我找个人一起玩" — 澄清意图 → 分流到场景1或场景3
  - 场景3："随便聊聊" — 推荐热门话题 → 创建AI房间
  - 场景4："开始吧/匹配一下" — 直接执行匹配（用户已选好）
- 新增**工具调用格式示例**：3 个带真实参数的 JSON 示例
- 新增**兜底规则**：工具失败自然过渡、尊重用户"算了"等意愿

### 构建验证
- `npm run build` — ✅ 81/81 页面成功
- 已推送 `fqunxiang dev`

### 下一步
- ~~阶段4（执行层）~~ ✅ 已完成，见下文

---

## 2026-04-29 — v9.1 Agent 阶段4：工具执行层闭环

### 概述
在 AI Chat API 中实现完整的工具调用闭环：解析 AI 回复中的 JSON 工具调用意图 → 执行对应的数据库操作 → 将结果回传给 AI 生成最终回复。

### 变更内容

**`src/lib/ai/agent-tools.ts` — 新增执行层**
- `parseToolCall(content)` — 从 AI 回复末尾解析 `{"tool": "xxx", "params": {...}}` JSON
- `stripToolCall(content)` — 移除工具调用 JSON，保留自然语言部分
- `executeToolCall(toolCall, context)` — 根据工具名分发到具体执行函数
- `execSearchStories(keyword?)` — Prisma 查询 `Story`（状态 open/recruiting），返回标题/时代/简介/难度/角色数
- `execSearchBrainholes(category?, limit?)` — Prisma 查询 `Brainhole`（状态 approved），按热度排序
- `execFindOnlineUser(brainholeId?)` — Prisma 查询 `MatchRequest`（状态 waiting），返回等待中用户信息
- `execCreateRoom(type, brainholeId?, storyId?, identity?)` — Prisma `$transaction` 创建 `Room` + `RoomParticipant`（AI 房间）
- 补充丢失的 `ToolCall` / `ToolResult` 类型定义

**`src/app/api/ai/chat/route.ts` — 集成闭环**
- 导入 `getToken` 获取当前用户 ID（工具调用需要 userId）
- DeepSeek 成功后，仅对 `companion` 角色启用工具调用检测
- 检测到工具调用时：
  1. 执行工具（`executeToolCall`）
  2. 将工具结果追加到对话历史
  3. 二次调用 DeepSeek，让 AI 基于工具结果生成最终回复
  4. 响应中增加 `toolCalls` 和 `toolResults` 字段（供前端消费）
- 二次调用失败时优雅降级：保留第一次 AI 回复

### 技术细节
- 仅对 `companion` 角色启用工具调用，其他角色不受影响
- 未登录用户（无 userId）跳过工具调用，正常返回 AI 回复
- 每次请求最多一次工具调用 + 一次二次 AI 调用（防止循环）
- 工具执行层直接操作 Prisma，不依赖外部 API 路由

### 构建验证
- `npm run build` — ✅ 81/81 页面成功
- 已推送 `fqunxiang dev`

### 下一步
- ~~前端适配~~ / ~~多轮工具调用~~ / ~~真人匹配集成~~ — 这些已在阶段5中以检查点工作流的形式部分解决

---

## 2026-04-29 — v9.1 Agent 阶段5：带检查点的工作流

### 概述
为刘看山 Agent 引入"检查点"机制，确保每个工具执行后都经过验证，失败时自动回退重试，而不是硬着头皮继续。

### 变更内容

**`src/lib/ai/agent-tools.ts` — 提示词层升级**
- `AGENT_TASK_EXAMPLE` 新增**检查点规则**章节，明确告诉 AI：
  - 每次工具执行后后端会自动运行检查点
  - 检查点A（搜索故事后）：结果非空？相关性？失败则自动重试
  - 检查点B（查找匹配后）：有无真人？无则启动兜底陪聊
  - 检查点C（创建房间后）：房间是否创建成功？

**`src/lib/ai/agent-tools.ts` — 执行层升级**
- 新增 `CheckpointResult` 类型（tool/pass/checks/retried/retryCount）
- 新增 `runCheckpoint()` 函数：为4个工具配置检查点逻辑
  - `search_stories`：检查 `data.length > 0` + 关键词相关性
  - `search_brainholes`：检查 `data.length > 0`
  - `find_online_user`：检查 `data.length > 0`（不阻断，仅提示 AI 启动兜底）
  - `create_room`：检查 `success && data.roomId`
- 新增 `RETRY_CONFIG`：配置可重试工具的重试策略
  - `search_stories`：失败时清空关键词扩大搜索，最多重试1次
  - `search_brainholes`：失败时去掉分类限制，最多重试1次
- `executeToolCall()` 升级为循环执行：执行 → 检查 → 重试（如配置允许）→ 返回最终结果

**`src/app/api/ai/chat/route.ts` — 二次调用升级**
- 二次调用时，将检查点结果（每个检查的 pass/fail + 消息）格式化为 Markdown 列表传给 AI
- AI 收到的是"已验证"的结论，只需自然地回复用户，不需要暴露技术细节

### 工作流示例（"我想玩明朝故事"）

```
Step 1: AI 调用 search_stories(keyword="明朝")
        → 检查点A：搜到0个结果 → 自动重试（keyword=""）
        → 重试后搜到3个故事 → 检查点A通过
Step 2: AI 展示故事列表，用户选择
Step 3: AI 调用 find_online_user(storyId=xxx)
        → 检查点B：找到0个匹配 → 不重试（匹配是实时的）
        → AI 启动兜底：调用 create_room 创建 AI 房间
Step 4: AI 调用 create_room
        → 检查点C：房间创建成功 → 告诉用户"房间已创建"
```

### 构建验证
- `npm run build` — ✅ 81/81 页面成功
- 已推送 `fqunxiang dev`

### 下一步
- **前端适配**：消费 `toolCalls`/`toolResults`/`checkpoint`，实现"展示故事列表→跳转房间"的交互流
- **多轮工具调用**：当前每次请求最多1个工具+1次二次调用，需支持链式多工具（如搜索→匹配→创建房间在一个工作流中完成）

---

## 2026-04-29 — v9.1 Agent 检查点工作流：全角色自检注入

### 概述
为全部 12 个角色（含兼容角色 liukanshan）注入"自检检查点"，让每个角色在每次回复前都执行自检，确保输出质量。

### 变更内容

**`src/lib/ai/personas.ts` — 全角色自检检查点**

| 角色 | 检查点1 | 检查点2 | 检查点3 |
|------|---------|---------|---------|
| **companion** | 偏离话题检测 | 结束信号识别 | 套话过滤 |
| **dungeon_master** | 剧透检测 | 氛围性/细节抛出 | 悬念感维护 |
| **story_fallback** | 角色融入度 | 字数控制(30-60) | 角色决策自由度 |
| **assistant_director** | 决策越权检测 | 建议语气检查 | 尊重导演决定权 |
| **catalyst** | 僵局判断 | 问题质量(画面感) | 避免评判 |
| **healer** | 过度共情检测 | 急于建议检测 | 被分析感检测 |
| **reviewer** | 审核范围控制 | 通过标准检查 | JSON格式检查 |
| **summarizer** | 字数控制(≤30) | 瞬间vs概括 | 画面感检查 |
| **knowledge_feeder** | 核心矛盾指向 | 画面感/代入感 | 字数控制(≤30) |
| **mediator** | 中立性检查 | 冷落回收检测 | 情绪降温检查 |
| **creative** | 替做决定检测 | 选项质量(画面感) | 避免标准答案 |
| **liukanshan** | 同 assistant_director | 同 assistant_director | 同 assistant_director |

### 设计原则
- **提示词层面**：每个角色的 systemPrompt 末尾追加 `## 自检检查点` 段落
- **后端层面**：companion 的 Agent 工具调用已配置自动检查点 + 重试（阶段5）
- **双重保险**：后端自动修正数据错误，提示词引导 AI 自我修正表达错误

### 构建验证
- `npm run build` — ✅ 81/81 页面成功
- 已推送 `fqunxiang dev`

### 下一步
- **前端适配**：消费 `toolCalls`/`toolResults`/`checkpoint`，实现"展示故事列表→跳转房间"交互流
- **多轮工具调用**：当前每次请求最多1个工具+1次二次调用，需支持链式多工具
- **效果验证**：上线后观察各角色回复质量是否因自检检查点而提升
