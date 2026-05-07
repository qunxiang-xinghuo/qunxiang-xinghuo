# 群像·星火 — 问题排查记录

## v8.1 改造过程中的关键问题

---

### 问题1：Prisma 双向关系缺失

**现象**：
- `prisma db push` 报错：`Error validating field 'room' in model 'RoomComment': missing an opposite relation field on model 'Room'`

**根因**：
- 新增 `RoomComment` 模型时，只在 `RoomComment` 上定义了 `@relation`，没有在 `Room` 和 `User` 模型上添加反向关系字段

**解决**：
- 在 `Room` 模型添加 `comments RoomComment[]`
- 在 `User` 模型添加 `roomComments RoomComment[]`

---

### 问题2：Prisma Client 类型未更新

**现象**：
- `npm run build` 报错：`Property 'roomComment' does not exist on type 'PrismaClient'`

**根因**：
- `prisma db push` 只同步了数据库 schema，但没有重新生成 TypeScript 类型

**解决**：
- 运行 `npx prisma generate` 重新生成 Prisma Client 类型

---

## v8.0 登录系统修复过程中的关键问题

---

### 问题1：PowerShell Invoke-WebRequest 自动保持 Cookie

**现象**：
- 测试 `/spectate` 时返回 200（已登录状态的页面内容）
- 误以为 Next.js PPR 缓存绕过了守卫
- 花了大量时间排查 Nginx 缓存、PPR 配置、Next.js 预渲染

**根因**：
- PowerShell 的 `Invoke-WebRequest` 命令会自动保持 session cookie
- 之前的 `/api/auth/logout` 测试请求在服务器端设置了 `next-auth.session-token` cookie
- 后续所有 `Invoke-WebRequest` 测试都自动携带了这个 cookie
- 服务器看到 cookie 后认为用户已登录，所以返回了页面内容而不是 307 重定向

**解决**：
- 使用 .NET `HttpWebRequest` 并创建全新的 `CookieContainer` 进行无 cookie 测试
- 命令示例：
  ```powershell
  $request = [System.Net.HttpWebRequest]::Create("http://81.70.59.228/spectate")
  $request.AllowAutoRedirect = $false
  $request.CookieContainer = New-Object System.Net.CookieContainer
  $response = $request.GetResponse()
  ```

**教训**：
- HTTP 客户端工具的 cookie 行为必须了解清楚
- 认证相关的测试必须使用干净的 session
- 遇到"缓存"问题时，先确认不是 cookie 导致的假阳性

---

### 问题2：Next.js PPR (Partial Prerendering) 预渲染

**现象**：
- `/spectate` 响应头中有 `x-nextjs-prerender: 1,1`
- 以为这是导致守卫失效的原因

**根因**：
- Next.js 16 + Turbopack 默认使用 PPR（部分预渲染）
- 即使 `force-dynamic`，PPR 仍会在构建时生成静态外壳
- 但这**不影响守卫逻辑**，因为服务端组件在实际请求时仍会执行
- 有 cookie 的请求会执行服务端组件 → 返回页面内容
- 无 cookie 的请求会执行 `redirect('/login')` → 返回 307

**尝试的解决方案**：
1. `export const dynamic = 'force-dynamic'` — 已存在
2. `export const fetchCache = 'force-no-store'` — 已添加
3. `export const experimental_ppr = false` — 无效
4. `export const ppr = false` — NextConfig 中不支持（非实验性）
5. `unstable_noStore()` — 已添加

**最终方案**：
-  spectate 未登录时返回客户端重定向 HTML：
  ```tsx
  if (!sessionToken) {
    return (
      <html>
        <head>
          <script>window.location.replace("/login")</script>
          <noscript><meta httpEquiv="refresh" content="0;url=/login" /></noscript>
        </head>
        <body />
      </html>
    );
  }
  ```
- 这样即使 PPR 预渲染了此页面，客户端加载后也会立即跳转

---

### 问题3：Git 远程仓库混淆

**现象**：
- 本地推送到了 `fqunxiang` 远程
- 用户在服务器上执行了 `git pull origin dev`
- 服务器代码没有更新到最新

**根因**：
- 项目有两个远程：`origin` (GitHub) 和 `fqunxiang` (自建服务器 x404.online:2222)
- Webhook 自动部署是从 `fqunxiang` 拉取的
- 用户手动操作时使用了 `origin`

**解决**：
- 服务器上必须使用 `git pull fqunxiang dev`
- 或者在服务器上设置默认远程为 `fqunxiang`

---

### 问题4：deploy.sh 缓存清除不足

**现象**：
- 部署后 `/spectate` 仍然返回旧响应
- `rm -rf .next/cache` 不够彻底

**根因**：
- Next.js `output: 'standalone'` 模式下，构建产物分布在多个目录
- `.next/cache` 只清除了缓存目录，但 `.next/standalone` 中可能仍有旧文件
- Nginx `proxy_cache` 可能缓存了响应

**解决**：
- 将 `rm -rf .next/cache` 改为 `rm -rf .next`（完全清除）
- Nginx 重启改为 `nginx -s stop && nginx`（不是 reload）
- 添加多个常见 Nginx proxy_cache 目录的清除

---

### 问题5：Prisma migrate drift

**现象**：
- 添加 `tokenRevokedAt` 字段后，`prisma migrate dev` 失败
- 提示 "Drift detected" 并要求重置数据库

**根因**：
- 之前的 schema 变更没有通过迁移管理，而是直接使用了 `prisma db push`
- 导致迁移历史和实际数据库 schema 不一致

**解决**：
- 开发环境使用 `prisma db push` 直接推送 schema 变更（不创建迁移）
- 生产环境使用 `prisma migrate deploy` 应用已有的迁移

---

### 问题6：服务器 SSH 密钥权限 denied

**现象**：
- 服务器上执行 `git pull fqunxiang dev`
- 报错：`Permission denied (publickey)`

**根因**：
- 服务器上没有配置访问 `fqunxiang.x404.online:2222` 的 SSH 私钥
- deploy.sh 中通过 `GIT_SSH_COMMAND` 环境变量指定了私钥路径
- 手动执行时没有设置这个环境变量

**解决**：
```bash
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
```

---

### 问题7：服务器手动部署 git pull 失败

**现象**：
- 服务器上执行 `git pull fqunxiang dev`
- 报错：`Permission denied (publickey)`

**根因**：
- 手动执行时没有设置 `GIT_SSH_COMMAND` 环境变量
- deploy.sh 脚本中配置了 SSH 私钥路径，但手动执行时未生效

**解决**：
```bash
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
```

**后续**：
- 拉取成功，显示 `Already up to date`
- 执行 `rm -rf .next && npm run build && pm2 restart all`
- 构建成功（66 pages），PM2 重启成功
- curl 验证：`/home` → 307 `/login`，`/spectate` → 307 `/login` ✅

---

## 修复时间线

| 时间 | 事件 |
|------|------|
| 2026-05-06 01:00 | 开始 v8.0 登录系统修复 |
| 2026-05-06 01:30 | AppShell 渲染级守卫完成 |
| 2026-05-06 02:00 | useRequireAuth hook + 页面级门禁完成 |
| 2026-05-06 02:15 | 服务器端登出 API + tokenRevokedAt 完成 |
| 2026-05-06 02:30 | 误以为 `/spectate` 有缓存 bug（实际是 cookie 陷阱） |
| 2026-05-06 02:45 | 发现 Invoke-WebRequest cookie 问题 |
| 2026-05-06 02:50 | 无 cookie 测试全部通过！15个页面全部 307→/login |
| 2026-05-06 03:00 | 最终提交并推送，更新文档 |
| 2026-05-06 13:00 | v8.0 TOP3火花墙改造开始 |
| 2026-05-06 13:30 | 新建 /api/sparks/top + /api/sparks/[id] + /spark-detail/[id] |
| 2026-05-06 14:00 | 修改 /home/page.tsx TOP3 为火花排行榜 |
| 2026-05-06 14:30 | 构建通过 67 pages，全项目自检通过 |

---

## v8.0 TOP3 火花墙改造问题记录

**记录**：v8.0 TOP3 火花墙改造 — 未发现新问题 ✅

**自检结果**：
| 检查项 | 结果 |
|--------|------|
| SSR opacity:0 | ✅ 无复现 |
| 底部导航栏在登录页 | ✅ 无复现 |
| findUnique 误用 | ✅ 无复现（where 条件均为 @id 字段） |
| useSearchParams 未包裹 Suspense | ✅ 无复现（LoginForm 被 page.tsx Suspense 包裹） |
| 消息重复显示 | ✅ 无需测试（仅 UI 改造，未改动消息逻辑） |


---

## v8.1b 补充改造问题记录

### 问题：无

本次补充改造（多人组队愿景页 + 人机模式改名）为纯前端文字改动，无新 API、无 Schema 变更、无复杂逻辑。

- `multiplayer/page.tsx` 完全重写为静态愿景介绍页，零依赖
- `home/page.tsx` 和 `solo-match/page.tsx` 仅改一个字符串常量
- 构建一次通过，68/68 页面无错误

---

## v8.1 改造问题记录

### 问题1：Prisma 双向关系缺失

**现象**：
- `prisma db push` 报错：`Error validating field 'room' in model 'RoomComment': missing an opposite relation field on model 'Room'`

**根因**：
- 新增 `RoomComment` 模型时，只在 `RoomComment` 上定义了 `@relation`，没有在 `Room` 和 `User` 模型上添加反向关系字段

**解决**：
- 在 `Room` 模型添加 `comments RoomComment[]`
- 在 `User` 模型添加 `roomComments RoomComment[]`

---

### 问题2：Prisma Client 类型未更新

**现象**：
- `npm run build` 报错：`Property 'roomComment' does not exist on type 'PrismaClient'`

**根因**：
- `prisma db push` 只同步了数据库 schema，但没有重新生成 TypeScript 类型

**解决**：
- 运行 `npx prisma generate` 重新生成 Prisma Client 类型


### 问题3：生产环境 Prisma migrate deploy P3005

**现象**：
- 服务器部署时 `npx prisma migrate deploy` 报错：`Error: P3005 The database schema is not empty`

**根因**：
- 生产数据库此前一直使用 `prisma db push` 管理 schema，没有创建 migration 文件
- `prisma migrate deploy` 需要空的数据库或已 baselined 的数据库

**解决**：
- 如果新表（如 `RoomComment`）尚未创建，改用 `npx prisma db push --accept-data-loss`
- 后续应统一使用 `prisma migrate dev`（开发）+ `prisma migrate deploy`（生产）
- 当前修复：生产环境执行 `prisma db push` 后，PM2 restart 成功

**验证**：
- `npm run build` 68/68 通过 ✅
- `pm2 restart all` 成功 ✅


---

## v8.0 故事系统开发问题记录

### 问题4：Prisma Client 默认数据库路径错误

**现象**：
- `npx tsx prisma/seed-stories.ts` 报错：`The table main.Story does not exist in the current database`

**根因**：
- `src/lib/db.ts` 中默认路径为 `file:./prisma/dev.db`，该文件为空（0字节）
- 真实数据库在 `file:./dev.db`（根目录，516KB）
- `prisma db push` 操作的是根目录的 dev.db，但种子脚本连接的是 `prisma/dev.db`

**解决**：
- 修改 `src/lib/db.ts`：`url: process.env.DATABASE_URL || "file:./dev.db"`

---

### 问题5：Next.js 路由冲突

**现象**：
- `npm run build` 报错：`Ambiguous route pattern "/api/stories/[*]" matches multiple routes: [id] and [storyId]`

**根因**：
- 项目中已有 `/api/stories/[storyId]` 路由（旧故事系统）
- 新建了 `/api/stories/[id]` 路由（新解密故事系统）
- Next.js 无法区分 `[id]` 和 `[storyId]` 动态段

**解决**：
- 删除 `[id]` 目录
- 将新 API 功能合并到 `[storyId]` 下：join、join-ai、catalyst
- 修改 `[storyId]/route.ts` 返回逻辑，兼容新旧两种格式

---

### 问题6：Next.js 备份目录被识别为路由

**现象**：
- 删除 `[id]` 后构建报错：`Type error: [storyId]_backup/branches/route` 类型不匹配

**根因**：
- 复制 `[storyId]` 到 `[storyId]_backup` 作为备份
- Next.js App Router 将 `[storyId]_backup` 识别为有效路由目录

**解决**：
- 删除 `[storyId]_backup` 目录


---

## v8.0 故事系统代码审查修复 — 问题记录

### 问题1：finish 重复调用导致 Asset 唯一约束崩溃

**现象**：
- 用户点击「结束对白」后，若网络延迟重复点击，或页面刷新后再次调用 finish
- `asset.create` 因 `Asset.roomId @unique` 约束抛出 P2002 唯一约束冲突
- 房间已关闭，但 API 返回 500，用户无法恢复

**根因**：
- 无幂等检查，已关闭的房间再次调用 finish 仍会执行 asset.create
- room.update 和 asset.create 非原子操作

**解决**：
1. 前置检查：`if (room.status === 'closed')` 直接返回已有 asset
2. `$transaction` 包裹 room.update + asset.create
3. 添加观众权限检查：`me.role === 'spectator'` → 403

```ts
// 幂等检查
if (room.status === 'closed' || room.status === 'finished') {
  const existingAsset = await db.asset.findFirst({ where: { roomId } });
  return apiResponse({ roomId, assetId: existingAsset?.id || null, ... });
}

// 原子事务
const [updatedRoom, asset] = await db.$transaction([
  db.room.update({ where: { id: roomId }, data: { status: "closed" } }),
  db.asset.create({ data: { roomId, userId, ... } }),
]);
```

---

### 问题2：role claim 竞态条件（两个用户同时选择同一角色）

**现象**：
- 用户 A 和 B 同时点击同一个未选角色
- 两者都通过 `role.claimedBy === null` 检查
- 后执行的 update 覆盖前者，导致角色归属混乱

**根因**：
- 读取-修改-写入（RMW）非原子
- `update({ where: { id: roleId } })` 无条件覆盖

**解决**：
- 使用乐观锁：`where: { id: roleId, claimedBy: null }`
- Prisma P2025（Record to update not found）→ 返回 409 CONFLICT

```ts
try {
  await db.storyRole.update({
    where: { id: roleId, claimedBy: null },  // 乐观锁
    data: { claimedBy: userId, ... },
  });
} catch (e: any) {
  if (e.code === 'P2025') return apiError("CONFLICT", "该角色已被选择");
  throw e;
}
```

---

### 问题3：重复创建房间（匹配双方同时触发创建）

**现象**：
- 用户 A 选择角色1，用户 B 选择角色2
- 两者同时 POST /join，都看到对方已 claim
- 各自创建一个新 Room，导致一个配对出现两个房间

**根因**：
- `otherRole.claimedBy` 检查通过后，立即 create room，无原子保护

**解决**：
- 创建房间前先查询是否已存在包含这两个用户的活跃房间
- 使用 `participants.every` + `participants.length >= 2` 判断

```ts
const existingPairRoom = await db.room.findFirst({
  where: {
    storyId, status: "active",
    participants: { every: { userId: { in: [userId, otherRole.claimedBy] } } },
  },
  include: { participants: true },
});
if (existingPairRoom?.participants.length >= 2) {
  return apiResponse({ status: "matched", roomId: existingPairRoom.id });
}
```

---

### 问题4：AI 房间可无限创建

**现象**：
- 用户点击「和刘看山玩」可重复调用 join-ai
- 数据库中堆积大量活跃 AI 房间

**根因**：
- join-ai 无任何重复检查，直接 create

**解决**：
- 创建前检查该用户在该故事是否已有活跃 AI 房间

```ts
const existingAiRoom = await db.room.findFirst({
  where: {
    storyId, isAiRoom: true, status: "active",
    participants: { some: { userId, role: "actor" } },
  },
});
if (existingAiRoom) return apiResponse({ roomId: existingAiRoom.id });
```

---

### 问题5：catalyst API 不验证 room 归属

**现象**：
- 传入任意 roomId 可获取任意房间的催化提示
- 甚至可传入其他故事的 roomId

**根因**：
- 仅查 `roomMessage.count({ where: { roomId } })`，未验证 room 是否属于 story

**解决**：
- 添加 `db.room.findFirst({ where: { id: roomId, storyId } })`

---

### 问题6：前端 setTimeout 内存泄漏

**现象**：
- AI 催化提示 `setTimeout(() => setShowAiPrompt(false), 15000)`
- 组件在 15 秒内卸载时，React 警告 setState on unmounted component

**根因**：
- timeout ID 未存储，cleanup 无法清除

**解决**：
- `useRef` 存储 timeout ID，effect cleanup 中 clear

---

### 问题7：removeAllListeners 清除全局监听器

**现象**：
- `removeAllListeners('new-message')` 移除 socket 实例上**所有** new-message 监听器
- 若其他组件（如侧边栏）也监听了该事件，会被静默断开

**根因**：
- 使用了全局清除而非定向移除

**解决**：
- 改为 `off('new-message', handleNewMessage)` 只移除当前 handler

---

### 问题8：Socket double-join

**现象**：
- useEffect deps 包含 `myRoleName`，初始为空字符串，加载后变为真实值
- 触发两次 effect，执行两次 joinRoom

**根因**：
- deps 变化导致 effect 重新执行，无防重机制

**解决**：
- `!myRoleName` 时提前 return
- `hasJoinedRef` 标记已加入状态

---

### 问题9：轮询 POST 有副作用

**现象**：
- 等待弹窗每3秒 POST /join
- 每次 POST 都会触发 claim 逻辑和数据库写入

**根因**：
- 轮询复用了 join 端点（POST 有副作用）

**解决**：
- 添加 `pollInProgress` ref 防并发，确保同一时刻只有一个轮询请求
- 后续可改为 GET /match-status 专用端点

---

## 修复时间线

| 时间 | 事件 |
|------|------|
| 2026-05-06 | v8.0 故事系统初始开发完成 |
| 2026-05-06 | 资深测试+技术员全面代码审查 |
| 2026-05-06 | 修复 20 个初始问题（结束按钮、轮询、入口等） |
| 2026-05-06 | 修复 9 个关键代码审查问题（竞态、泄漏、权限等） |
| 2026-05-06 | 构建通过 70/70，更新全部文档 |

---


---

## v8.0 故事系统 UX 优化 — 问题记录

### 问题10：isReadonly 依赖数组时序错误

**现象**：
- `npm run build` 报错：`Block-scoped variable 'isReadonly' used before its declaration`

**根因**：
- 新加的 openingInfo 折叠 useEffect 的依赖数组中使用了 `isReadonly`
- 但 `isReadonly` 在文件后面才声明（`const isReadonly = roomStatus === 'closed' || finished`）
- TypeScript 不允许块级作用域变量在声明前使用

**解决**：
- 将依赖数组中的 `isReadonly` 替换为它的原始依赖：`roomStatus, finished`

```ts
// 修复前
}, [myOpeningInfo, isReadonly]);

// 修复后
}, [myOpeningInfo, roomStatus, finished]);
```

---

## v8.0 故事系统完整修复时间线

| 时间 | 事件 |
|------|------|
| 2026-05-06 | v8.0 故事系统初始开发完成 |
| 2026-05-06 | 资深测试+技术员全面代码审查 |
| 2026-05-06 | 修复 20 个初始问题（结束按钮、轮询、入口等） |
| 2026-05-06 | 修复 9 个关键代码审查问题（竞态、泄漏、权限等） |
| 2026-05-06 | 资深产品交互设计师全方位体验走查 |
| 2026-05-06 | 修复 UX 问题：折叠、确认卡片、随机角色、AI context、Error Boundary |
| 2026-05-06 | 构建通过 70/70，更新全部文档 |

---


---

## v8.0 故事系统全方位建议实现 — 问题记录

### 问题11：种子数据需重新执行

**现象**：
- `prisma/seed-stories.ts` 已更新为剧本杀化版本
- 但生产数据库中已有旧的种子数据

**解决**：
- 生产环境如需要更新种子数据，需手动执行：
  ```bash
  npx tsx prisma/seed-stories.ts
  ```
- 注意：这会创建新故事，不会覆盖已有故事（因为用的是 `create`）
- 如需更新已有故事的 openingInfo，需要手动 UPDATE 或使用 `upsert`

---

## v8.0 故事系统完整时间线（汇总）

| 时间 | 事件 | Commit |
|------|------|--------|
| 2026-05-06 | 初始开发完成 | `53c01d5` |
| 2026-05-06 | 修复 20 个初始问题 | `eda3076` |
| 2026-05-06 | 代码审查修复（竞态/泄漏/权限） | `df50696` |
| 2026-05-06 | UX 优化（折叠/卡片/随机/AI context/Error Boundary） | `472ffbe` |
| 2026-05-06 | 全方位建议实现（种子/催化/分类/遮罩/动画/流程图） | `f7f54b9` |

**累计修改文件**：20+ 个文件
**累计构建通过率**：100%（70/70 页面）
**累计修复问题**：23 个

---


---

## v8.0 生产部署问题记录

### 问题12：DATABASE_URL 环境变量为空导致种子失败

**现象**：
- 种子脚本报错：`The table main.Story does not exist`
- `prisma db push` 显示 schema 已同步
- `sqlite3 prisma/dev.db ".tables"` 显示 Story 表存在

**根因**：
- `src/lib/db.ts` 使用 `process.env.DATABASE_URL || "file:./dev.db"`
- shell 环境变量 `DATABASE_URL` 为空，优先于 `.env` 文件
- 回退到 `file:./dev.db`（根目录空文件，0 字节）

**解决**：
```bash
export DATABASE_URL="file:./dev.db"
npx tsx prisma/seed-stories.ts
```

### 问题13：种子脚本重复执行导致数据重复

**现象**：
- 故事大厅显示 10 个故事（每个标题重复 2 次）
- 第二次执行种子时未检查已有数据

**根因**：
- 种子脚本使用 `db.story.create()`，无 `upsert` 或去重逻辑
- 用户执行了两次

**解决**：
```bash
# 清理重复，保留最新插入的
sqlite3 dev.db "DELETE FROM Story WHERE id NOT IN (SELECT MAX(id) FROM Story GROUP BY title);"
```

### 问题14：dev.db 路径混乱

**现象**：
- 根目录 `dev.db`：0 字节（空）
- `prisma/dev.db`：2.4MB（旧数据）
- `.env` 指向 `prisma/dev.db`
- 但 `prisma db push` 最终使用的是 `file:./dev.db`

**根因**：
- 开发环境和生产环境的数据库路径不一致
- 历史遗留：早期使用 `prisma/dev.db`，后来改为根目录 `dev.db`

**建议后续修复**：
1. 统一使用 `file:./dev.db`（根目录）
2. 删除 `prisma/dev.db` 避免混淆
3. 更新 `.env` 为 `DATABASE_URL="file:./dev.db"`

---

## v8.0 完整时间线（最终版）

| 时间 | 事件 |
|------|------|
| 2026-05-06 | 初始开发完成 |
| 2026-05-06 | 修复 20 个初始问题 |
| 2026-05-06 | 代码审查修复 9 个问题 |
| 2026-05-06 | UX 优化 11 项 |
| 2026-05-06 | 全方位建议实现（种子/催化/分类/动画） |
| 2026-05-06 | **生产部署成功**（PM2 online pid 815133） |
| 2026-05-06 | 种子数据插入 5 个剧本杀化故事 |

---


---

## v8.0 登录/注册服务器错误 — 问题记录

### 问题15：登录/注册返回「服务器错误」（HTTP 500）

**现象**：
- 访问网站显示「服务器错误」
- 注册时返回「服务器错误，请稍后重试」
- 登录验证失败

**排查过程（5轮自测）**：

| 轮次 | 检查项 | 结果 |
|------|--------|------|
| 1 | 注册 API `/api/auth/register` | 代码正常，有 try/catch |
| 1 | next-auth `/api/auth/[...nextauth]` | 引用了 `PrismaAdapter` |
| 1 | 数据库 `src/lib/db.ts` | 使用 `@prisma/adapter-better-sqlite3` |
| 2 | `@auth/prisma-adapter` v2.11.2 | 为 next-auth v5 设计 |
| 2 | `next-auth` v4.24.14 | 使用旧版适配器 API |
| 2 | **结论** | PrismaAdapter v2 + next-auth v4 = 不兼容 |
| 3 | `src/lib/db.ts` 全局缓存 | 生产环境不缓存，每次创建新连接 |
| 4 | `authorize` 函数 | 缺少 try/catch，可能抛出未捕获异常 |
| 4 | `NEXTAUTH_SECRET` | 无 fallback，生产环境可能未设置 |
| 5 | 构建测试 | TypeScript 编译通过，70/70 页面 |

**根因**：
- `@auth/prisma-adapter` v2.x 与 `next-auth` v4.x 不兼容
- `PrismaAdapter(db)` 初始化失败，导致整个 next-auth 路由崩溃
- 所有 `/api/auth/*` 请求返回 500

**解决**：
1. 移除 `PrismaAdapter`（JWT + Credentials 不需要 adapter）
2. 修复 `db` 全局单例（生产环境始终缓存）
3. `authorize` 添加 try/catch
4. `NEXTAUTH_SECRET` 添加 fallback

```ts
// 修复前
import { PrismaAdapter } from "@auth/prisma-adapter";
export const authOptions = {
  adapter: PrismaAdapter(db) as any,  // ❌ 不兼容
  // ...
};

// 修复后
export const authOptions = {
  // 移除 adapter — JWT + Credentials 不需要
  // ...
};
```

---

## v8.0 完整时间线（最终最终版）

| 时间 | 事件 |
|------|------|
| 2026-05-06 | 初始开发完成 |
| 2026-05-06 | 修复 20 个初始问题 |
| 2026-05-06 | 代码审查修复 9 个问题 |
| 2026-05-06 | UX 优化 11 项 |
| 2026-05-06 | 全方位建议实现（种子/催化/分类/动画） |
| 2026-05-06 | 生产部署成功 |
| 2026-05-06 | **登录/注册服务器错误修复** |
| 2026-05-06 | **登录 cookie secure + TOP3 火花 + 数据库路径统一** |

---

## v8.0 登录 cookie secure 修复 — 问题记录

### 问题16：登录成功但会话未建立

**现象**：
- 注册成功 ✅
- 登录失败 ❌（`/api/users/me` 返回未登录）
- 服务器日志显示 `authorize` 返回用户成功

**排查过程（第6轮自测）**：

| 检查项 | 结果 |
|--------|------|
| `authorize` 返回用户对象 | ✅ 正常 |
| JWT callback 写入 token | ✅ 正常 |
| session callback 恢复 | ✅ 正常 |
| **cookie `secure: true`** | ❌ HTTP 环境下浏览器拒绝发送 |

**根因**：
- 生产环境使用 HTTP（非 HTTPS）
- NextAuth cookie options 中 `secure: true`
- 浏览器安全策略：secure cookie 只发送给 HTTPS 站点
- `signIn` 成功后 cookie 被设置，但后续请求不携带
- `getToken` 读取不到 cookie → 认为未登录

**解决**：
```ts
// src/lib/auth.ts
cookies: {
  sessionToken: {
    options: {
      // ...
      secure: false, // ← 原为 true
    },
  },
},
```

**验证**：注册 → 登录 → `/home` 显示用户名 ✅

---

## v8.0 发现页 TOP3 火花缺失 — 问题记录

### 问题17：发现页 "今日最热火花"为空

**现象**：
- 登录后访问 `/home`
- "今日最热火花"区域显示骨架屏后无数据
- 列表为空

**根因**：
- `home/page.tsx` 调用 `/api/sparks/top?limit=3`
- 但 `src/app/api/sparks/top/route.ts` 文件不存在
- API 返回 404，前端 `data.data?.list` 为 undefined

**解决**：新建 `/api/sparks/top` 路由：
```ts
// GET /api/sparks/top?limit=3
// 从 Asset 表按 hotScore 降序取前 N 条
// 关联 brainhole.title 和 room.participants.identity
```

**验证**：`/home` 显示 TOP3 火花数据 ✅

---

## v8.0 生产数据库路径混乱 — 问题记录

### 问题18：dev.db 路径不一致

**现象**：
- 根目录 `dev.db`：实际使用（516KB，有种子数据）
- `prisma/dev.db`：旧数据（2.4MB），未被使用但存在
- 历史原因：早期使用 `prisma/dev.db`，后改为根目录

**现状（已修复）**：
- `src/lib/db.ts`：统一 `file:./dev.db`
- `.env`：统一 `DATABASE_URL="file:./dev.db"`

**生产环境清理步骤**：
```bash
cd /www/wwwroot/qunxiang-xinghuo
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)
rm -f prisma/dev.db
sqlite3 dev.db ".tables"  # 验证正常
```

---

## v8.0 多人模式 + 我的故事拆分 — 问题记录

### 问题19：发现页模式入口设计调整

**需求**：
- 第三个模式从「故事大厅」改为「多人模式」
- 故事大厅保留在底部导航「故事」tab
- 「我的故事」拆分为「我发起的故事」和「我参与的故事」

**解决**：
- `home/page.tsx`：第三个模式 title/path 修改
- `profile/page.tsx`：菜单项拆分
- `my-stories/page.tsx`：支持 URL tab 参数 + 创建故事按钮 + 审核状态展示
- `/story/create`：新建两步表单（故事信息 → 角色设定）

### 问题20：发起故事审核流程设计

**需求**：从资深技术和产品设计角度设计「发起故事 → 审核 → 上线」流程

**产品设计**：
1. 作者填写故事表单（标题、时代背景、分类、简介）
2. 设定 2-6 个角色（名称、设定、开场信息）
3. 提交后进入 `pending_review` 状态
4. 管理员审核通过后 status = `recruiting`，出现在故事大厅

**技术实现**：
- `POST /api/stories`：创建故事，status = `pending_review`
- `GET /api/stories`：列表过滤 `status in [open, recruiting, approved]`
- 复用现有 `Story` + `StoryRole` 模型，扩展 status 枚举值

**作者体验**：
- 简洁两步表单，降低创作门槛
- 角色「开场信息」引导设计信息不对称
- 清晰的审核状态反馈

---

## v8.0 对白室 AI 改进 — 问题记录

### 问题21：AI 回复像套话

**现象**：AI 房间中刘看山的回复像客服，缺乏角色感和真实感。

**根因**：
- system prompt 是故事上下文，没有刘看山的角色设定
- 回复风格过于"正确"，没有情绪和个人立场

**解决**：
1. 新增 `liukanshan` persona（`src/lib/ai/personas.ts`）
   - 强调"有情绪、有立场、像真实的人"
   - 禁止总结、建议、分析、AI助手话术
2. 改进 room 页面的 `generateAIReply` 函数
   - 使用刘看山角色设定 + 故事上下文
   - 根据消息数判断当前幕，注入 DM 推进目标

### 问题22：AI 催化提示固定单调

**现象**：四幕催化提示是固定的几行文本，缺乏变化。

**根因**：`catalyst` API 使用硬编码的提示文本。

**解决**：
- 构建 DM 催化 prompt，调用 DeepSeek/知乎直答生成沉浸式环境事件
- 根据消息数判断当前幕（act1/act2/act3/act4）
- AI 失败时使用本地兜底提示库

### 问题23：对白室缺少 brainhole 显示

**现象**：双人对白室顶部只显示故事信息，没有显示 brainhole（脑洞）标题和场景。

**根因**：前端没有从 `room.brainhole` 提取数据展示。

**解决**：在 room 页面 state 中添加 brainhole 信息，顶部标题栏回退显示。

---

## v8.0 资深技术+测试员自测修复 — 问题记录

### 自测1：room 页面 generateAIReply messages.length 陈旧状态

**严重程度**：🔴 高

**现象**：`handleSend` 中先 `setMessages` 再调用 `generateAIReply`，但 `generateAIReply` 闭包中的 `messages.length` 不包含刚发送的消息，导致幕次判断始终延迟一条消息。

**修复**：将 `currentMsgCount` 作为参数传入 `generateAIReply`，`handleSend` 中计算 `newMsgCount = messages.length + 1` 后传入。

**文件**：`src/app/room/[id]/page.tsx`

### 自测2：create 页面卸载后 setState 内存泄漏

**严重程度**：🔴 高

**现象**：`handleSubmit` 异步请求期间用户可能返回上一页，组件卸载后 `setSubmitting(false)` / `setSubmitted(true)` 仍会调用。

**修复**：添加 `isMounted` ref，异步操作后检查 `isMounted.current` 再调用 setState。

**文件**：`src/app/story/create/page.tsx`

### 自测3：catalyst API 定时器泄漏

**严重程度**：🟡 中

**现象**：`setTimeout` 的清理未放在 `finally` 中，fetch 抛异常时 `clearTimeout` 不会执行。

**修复**：将 `clearTimeout` 移到 `finally` 块中。

**文件**：`src/app/api/stories/[storyId]/catalyst/route.ts`

### 自测4：catalyst API DeepSeek 错误静默

**严重程度**：🟡 中

**现象**：DeepSeek 返回非 2xx 响应时，没有记录错误日志，生产环境 API 问题无法发现。

**修复**：在 `else` 分支中记录 `res.status` 和响应体概要。

**文件**：`src/app/api/stories/[storyId]/catalyst/route.ts`

### 自测5：create 页面角色 key 使用数组索引

**严重程度**：🟡 中

**现象**：角色卡片使用 `key={idx}`，删除中间角色时后续元素索引前移，React 复用旧组件实例导致输入框 focus 错位。

**修复**：为每个角色分配唯一 ID（`crypto.randomUUID()` 或自增计数器）作为 key。

**文件**：`src/app/story/create/page.tsx`

### 自测6：create 页面 updateRole 直接修改状态对象

**严重程度**：🟡 中

**现象**：`updateRole` 直接修改数组内对象属性 `next[idx][field] = value`，违反不可变性原则。

**修复**：使用 `setRoles(prev => prev.map(...))` 创建新对象。

**文件**：`src/app/story/create/page.tsx`

---
