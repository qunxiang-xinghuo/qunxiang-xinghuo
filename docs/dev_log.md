# 群像·星火 开发日志

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
