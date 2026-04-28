# 群像·星火 迁移报告

## 项目概述

群像·星火 — 一个多角色叙事创作平台，用户以不同身份对"脑洞"（冲突情境）进行反应，通过火花标记、投票、故事串联等机制共创群像故事。

## 迁移目标

将项目从 **Express + Vite React SPA** 架构迁移至 **Next.js 16 App Router**，按照 TDD v1.2 规范完成全栈重构。

## 架构对比

### 旧架构 (Legacy)
```
backend/           Express 4 + raw sqlite3 + ws
frontend/          React 18 + Vite SPA + JavaScript
demo.html          UI/UX 原型 (HTML + 内联CSS/JS)
```

### 新架构 (Next.js)
```
src/app/api/       Next.js API Routes (22 endpoints)
src/app/           App Router Pages (13 pages)
src/components/    React Components (28 components)
src/hooks/         Custom Hooks (8 hooks)
src/lib/           Core Libraries (db, auth, utils, ai, validators)
src/server/        Server Logic (match-engine, room-manager, ai-catalyst, rate-limiter)
src/types/         TypeScript Types (api, models, enums, components)
prisma/            Prisma Schema + Migrations + Seed
```

## 数据模型

17 个 Prisma 模型覆盖完整业务域：

| 模块 | 模型 |
|------|------|
| 用户与身份 | Account, Session, User, UserIdentity |
| 标签系统 | Tag |
| 脑洞 | Brainhole, BrainholeTag, BrainholeCollection |
| 反应 | Reaction |
| 匹配 | MatchRequest |
| 房间 | Room, RoomParticipant, RoomMessage |
| 投票 | Vote, VoteOption, VoteCast |
| 灵感库 | InspirationItem |
| 故事 | StoryDraft |

## API 端点清单

| 模块 | Method | Endpoint | 说明 |
|------|--------|----------|------|
| 认证 | * | `/api/auth/[...nextauth]` | NextAuth v4 |
| 用户 | GET | `/api/users/identities` | 获取用户身份列表 |
| 脑洞 | GET | `/api/brainholes` | 脑洞列表 |
| 脑洞 | GET | `/api/brainholes/[id]` | 脑洞详情 |
| 脑洞 | POST | `/api/brainholes` | 创建脑洞 |
| 脑洞 | POST | `/api/brainholes/[id]/collect` | 收藏脑洞 |
| 脑洞 | DELETE | `/api/brainholes/[id]/collect` | 取消收藏 |
| 脑洞 | GET | `/api/brainholes/collected` | 已收藏列表 |
| 反应 | POST | `/api/reactions` | 提交反应 |
| 匹配 | POST | `/api/match` | 创建匹配请求 |
| 匹配 | GET | `/api/match/[matchId]` | 查询匹配状态 |
| 匹配 | DELETE | `/api/match/[matchId]` | 取消匹配 |
| 房间 | GET | `/api/rooms/[roomId]` | 房间信息 |
| 房间 | POST | `/api/rooms/[roomId]/messages` | 发送消息 |
| 房间 | POST | `/api/rooms/[roomId]/spark` | 标记火花 |
| 房间 | POST | `/api/rooms/[roomId]/pause` | 暂停房间 |
| 房间 | POST | `/api/rooms/[roomId]/resume` | 恢复房间 |
| 房间 | POST | `/api/rooms/[roomId]/finish` | 结束房间 |
| 房间 | GET | `/api/rooms/[roomId]/inspirations` | 灵感列表 |
| 投票 | POST | `/api/rooms/[roomId]/vote` | 创建投票 |
| 投票 | POST | `/api/rooms/[roomId]/vote/[voteId]/cast` | 投票 |
| 投票 | POST | `/api/rooms/[roomId]/vote/[voteId]/resolve` | 结束投票 |
| AI | POST | `/api/ai/prompt` | 获取催化剂提示 |
| AI | POST | `/api/ai/story-weave` | 故事串联 |
| 素材库 | GET | `/api/library` | 获取素材库 |

## 前端页面与组件

### 页面 (13)
| 路由 | 页面 | 类型 |
|------|------|------|
| `/` | 首页 (模式选择) | 静态 |
| `/login` | 登录 | 静态 |
| `/register` | 注册 | 静态 |
| `/identity` | 身份选择 | 静态 (Suspense) |
| `/match` | 单人匹配 | 静态 |
| `/duo-match` | 双人匹配 | 静态 |
| `/duo-waiting` | 匹配等待 | 静态 |
| `/brainhole/[id]` | 脑洞详情 | 动态 |
| `/library` | 素材库 | 静态 |
| `/messages` | 消息 | 静态 |
| `/multiplayer` | 多人组队 | 静态 |
| `/profile` | 个人中心 | 静态 |
| `/feedback` | 反馈 | 静态 |

### 组件分类 (28)
- **脑洞**: BrainholeCard, BrainholeStack, CollectionDrawer, ScenarioReader, TagFilter
- **身份**: IdentityBadge, IdentitySelector, IdentitySetupModal
- **布局**: TopBar, BottomNav, MobileContainer
- **素材库**: SparkCollection, StoryCard, StoryWeaver
- **匹配**: MatchCard, MatchSuccessModal, MatchTimer
- **个人**: LevelBadge, PlaceholderEntry, UserStats
- **反应**: ReactionInput, ReactionList, SparkButton, VoiceRecorder
- **房间**: AIPromptBanner, ChatRoom, MessageBubble, SparkWall

## 关键技术决策

### 1. Prisma v7 适配器模式
Prisma v7 移除了 schema 中的 `url` 属性和 `new PrismaClient()` 无参构造。运行时必须使用驱动适配器：
```typescript
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
export const db = new PrismaClient({ adapter });
```
迁移 CLI 仍通过 `prisma.config.ts` 的 `defineConfig({ datasource: { url } })` 获取数据库 URL。

### 2. Next.js 16 Async Params
Next.js 16 将所有动态路由的 `params` 改为 `Promise`，API 路由和页面必须 `await params`：
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
}
```

### 3. Zod v4 API 变更
Zod v4 将 `ZodError.errors` 重命名为 `ZodError.issues`。所有验证错误访问已更新。

### 4. Tailwind v4 主题系统
自定义颜色通过 CSS `@theme inline` 块定义，不再使用 `tailwind.config.js`：
```css
@theme inline {
  --color-xh-accent: #e8424e;
  --color-xh-gold: #f5a623;
  --color-xh-primary: #0d0d0d;
  --color-xh-dark: #1a1a1a;
  --color-xh-light: #f0f0f0;
}
```

### 5. AI 服务抽象
AI 催化剂系统通过 `src/lib/ai/` 抽象，Phase 1-3 使用本地 fallback 提示词（20+ 中文催化剂），Phase 4 可无缝切换到真实 AI 服务。

## 遇到的问题与解决

| 问题 | 解决方案 |
|------|----------|
| Prisma v7 不支持 schema `url` | 使用 `@prisma/adapter-better-sqlite3` 运行时适配器 |
| Next.js 16 `params` 类型变更 | 全部 API 路由改用 `await params` 解构 |
| Zod v4 `.errors` 不存在 | 改为 `.issues`（5 个文件） |
| `useSearchParams()` 无 Suspense | 包裹 `<Suspense>` 边界 |
| React 19 `Link` 类型不兼容 | TopBar 改用 `<a>` 标签 |
| `MobileContainer` 使用全局 `location` | 改用 `usePathname()` hook |
| Web Speech API 无类型声明 | 创建 `speech-recognition.d.ts` 类型声明 |
| 前端文件错误放置在 `frontend/src/` | 复制到 `src/`，tsconfig.json 排除 `frontend/` |
| `tsconfig.json` 包含旧 `frontend/` 目录 | 添加 `"frontend"` 到 exclude |

## 构建验证

```
✓ TypeScript 类型检查通过 (零错误)
✓ Next.js 生产构建成功 (23 路由 + 37 页面)
✓ Prisma 迁移已应用
✓ Prisma 客户端已生成
```

## 部署配置

- `.env.example` — 环境变量模板
- `prisma.config.ts` — Prisma v7 CLI 配置
- `vitest.config.ts` — 测试配置
- `.github/workflows/ci.yml` — CI 流水线
- `Dockerfile` + `docker-compose.yml` — 容器化部署

## 遗留项 (Phase 4)

- [ ] 真实 AI 服务接入 (OpenAI/Anthropic/Google AI)
- [ ] Socket.io 实时房间功能联调
- [ ] 文件上传 (Uploadthing)
- [ ] 邮件服务
- [ ] Sentry 监控
- [ ] E2E 测试 (Playwright)
