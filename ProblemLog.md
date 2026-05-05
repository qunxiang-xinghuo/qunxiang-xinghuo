# 问题记录与修复日志

## v6.3-fix1 「我的」页面 + 「设置」页面全面重构 (2026-05-05)

### 任务清单

| # | 任务 | 状态 | 文件 |
|---|------|------|------|
| 1 | "我的"页面标题居中 | ✅ | profile/page.tsx |
| 2 | 用户信息区域整体居中，头像左+用户名右，间距12px | ✅ | profile/page.tsx |
| 3 | 设置页简化为列表形式（修改头像、修改用户名、修改密码） | ✅ | settings/page.tsx |
| 4 | 用户名/密码修改各自独立弹窗 | ✅ | settings/page.tsx |
| 5 | API `/api/users/profile` 改为 PATCH，支持 username 唯一性检查 | ✅ | api/users/profile/route.ts |
| 6 | API `/api/users/avatar` 使用 Multer 处理文件上传 | ✅ | api/users/avatar/route.ts |
| 7 | 安装 multer + @types/multer | ✅ | package.json |

### 关键设计决策

1. **头像存储**：从 base64 直存数据库 → Multer `memoryStorage` + 文件保存到 `public/avatars/`，数据库存储相对路径 `/avatars/{filename}`
2. **用户名唯一性**：`PATCH /api/users/profile` 接收 `{ username }`，数据库 `username` 字段有 `@unique` 约束，修改前排除当前用户做唯一性检查
3. **操作分离**：用户名修改和密码修改完全分离，各自独立入口、独立弹窗、独立 API
4. **Multer 适配**：Next.js App Router 的 `NextRequest` 需通过 `arrayBuffer()` 读取原始 body，构造 `FakeRequest extends Readable` 供 multer 处理

### 文件变更

- **修改**：`src/app/profile/page.tsx` — 标题居中、用户信息整体居中
- **修改**：`src/app/settings/page.tsx` — 简化为列表+独立弹窗
- **修改**：`src/app/api/users/profile/route.ts` — PUT→PATCH，username 唯一性检查
- **修改**：`src/app/api/users/avatar/route.ts` — 使用 Multer 处理 multipart 上传
- **新增目录**：`public/avatars/` — 头像文件存储目录

### 编译结果：64/64 路由全部通过 ✅

---

## v6.3 观看模式完整实现 (2026-05-05)

### 功能实现

| # | 功能 | 文件 |
|---|------|------|
| 1 | 发现页模式入口更新为四大模式 | home/page.tsx |
| 2 | 新增 `/spectate` 公开房间列表页 | spectate/page.tsx |
| 3 | 新增 `/spectate/[roomId]` 纯围观房间页 | spectate/[roomId]/page.tsx |
| 4 | Socket.IO 移除文字广播，静默推送 viewer count | server/socket-handler.ts |
| 5 | disconnect 自动标记 participant 离线 | server/socket-handler.ts |
| 6 | room/[id] 新增 👁 在线人数显示 | room/[id]/page.tsx |

---

## v6.2-fix4 全面质量保障——SSR修复+性能优化+代码规范 (2026-05-05)

### 问题1：登录页 SSR 空白/消失（复发根因——最终根因：framer-motion initial opacity:0 + MobileContainer）

**现象**：部署后用户反馈"登录页面消失了"——页面加载后内容不可见/空白

**五层根因链（从表象到本质）**：
```
用户看到空白页面
  → SSR HTML 包含完整内容（<form>、<input>都存在）
  → 但所有内容 style="opacity:0;transform:translateY(...)"
  → framer-motion 将 initial={{ opacity: 0 }} 写入 SSR HTML
  → MobileContainer 包裹所有页面，initial={{ opacity: 0, y: 10 }}
  → LoginForm 也有多处 initial={{ opacity: 0 }}
  → 客户端 JS 加载前，内容完全透明不可见
  → 如果 JS 加载慢/出错，用户永远看到空白
```

**根因1（表象）**：页面加载后内容不可见
**根因2（直接）**：SSR 输出中所有 motion 元素都有 `style="opacity:0"`
**根因3（深层）**：`MobileContainer` 组件（包裹所有页面）`initial={{ opacity: 0, y: 10 }}`
**根因4（深层）**：`LoginForm` 中多处 `motion.div/motion.p/motion.form` 使用 `initial={{ opacity: 0 }}`
**根因5（历史遗留）**：v6.2-fix2/fix3 修复了 `useSession`/`useSearchParams` 问题，但没意识到 framer-motion 的 `initial` 才是导致"消失"的真正原因

**自检失败原因**：之前只检查了 `<form>` 和 `<input>` 是否存在，没检查内容是否可见（`opacity:0` 会让内容存在但不可见）

**修复方案：**
1. **MobileContainer**：添加 `mounted` state，`initial={mounted ? { opacity: 0, y: 10 } : false}`
2. **LoginForm**：所有 `motion` 组件改为 `initial={mounted ? ... : false}`
3. **page.tsx**：从 `'use client'` + `Suspense` 改为纯服务端组件
4. **LoginForm**：移除 `useSearchParams`，改用 `window.location.search`（`useEffect` 内）
5. **LoginForm**：`window.innerHeight` 改为 `useState` + `useEffect`

**验证铁律（新增）**：
- 检查 SSR HTML 是否包含 `<form>` ✅
- **新增**：检查 body 中是否没有 `opacity:0` ✅
- **新增**：检查 `animate-spin` 是否不在 body 中 ✅

**文件变更：**
- `src/components/layout/MobileContainer.tsx`：添加 `mounted` state，条件 `initial`
- `src/app/LoginForm.tsx`：所有 motion 组件条件 `initial`；移除 `useSearchParams`；`windowHeight` 改为 state
- `src/app/page.tsx`：从 `'use client'` + `Suspense` 改为服务端组件

---

### 问题2：组件顶层直接访问浏览器 API（最佳实践违规）

**现象**：代码检查中发现 2 处组件函数体顶层直接访问 `localStorage`

**根因**：`'use client'` 组件中，虽然 `typeof window !== 'undefined'` 可以避免 SSR `ReferenceError`，但不符合 Next.js App Router 最佳实践。在 hydration 期间可能导致不一致。

**涉及文件：**
1. `src/app/healing/session/[id]/page.tsx` 第33行：`const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('xh_user_id') : null;`
2. `src/app/room/[id]/page.tsx` 第32-33行：同样模式访问 `xh_duo_identity` 和 `xh_user_id`

**修复方案：**
- 将 `localStorage` 读取移入 `useEffect`，通过 `useState` 存储结果
- 初始值设为安全默认值（`null`/`'guest'`）

**文件变更：**
- `src/app/healing/session/[id]/page.tsx`：`savedUserId` → `useState('guest')` + `useEffect`
- `src/app/room/[id]/page.tsx`：`savedIdentity`/`savedUserId` → `useState(null)` + `useEffect`

---

### 问题3：library 页面重复 API 请求（性能浪费）

**现象**：`library/page.tsx` 的 `init()` 中连续调用两次 `/api/sparks/public`（`limit=50` 和 `limit=6`）

**根因**：为"公开火花墙"和"最新火花"分别发起请求，但数据来源完全相同

**修复方案：**
- 只调用一次 `/api/sparks/public?limit=50`
- `sparks` 使用完整列表
- `latestSparks` 使用 `list.slice(0, 6)`
- 减少一次不必要的网络请求

**文件变更：**
- `src/app/library/page.tsx`：合并两次 API 请求为一次

---

### 自检结论

| 检查项 | 结果 | 说明 |
|--------|------|------|
| useSearchParams 包裹 Suspense | ✅ 通过 | 7个页面全部正确 |
| window/document SSR 安全 | ✅ 通过 | 71个客户端组件检查完毕，无 ReferenceError 风险 |
| API 路由完整性 | ✅ 通过 | 58个路由全部存在且导出正确 |
| 登录页 SSR | ✅ 修复 | `index.html` 包含 `<form>` + `<input>` |
| 57/57 路由编译 | ✅ 通过 | 零错误 |
| 服务器 API 测试 | ✅ 通过 | 火花/脑洞/AI催化/AI房间/匹配/疗愈/故事 全部正常 |

---

## v6.2-fix3 登录页SSR空白+人机按钮遮挡+首页火花迁移 (2026-05-04)

### 问题1：登录页 SSR 空白
- **根因**：`AppShell` 使用 `useSession()` → 触发 `BAILOUT_TO_CLIENT_SIDE_RENDERING`
- **修复**：`AppShell` 移除 `useSession`，改用 `localStorage` 认证守卫
- **文件**：`src/components/layout/AppShell.tsx`

### 问题2：人机模式按钮遮挡
- **根因**：`BottomNav` `fixed bottom-0 h-14` (56px)，`solo-match` 底部 `pb-6` (24px)
- **修复**：`pb-6` → `pb-20`
- **文件**：`src/app/solo-match/page.tsx`

### 问题3：首页火花迁移
- **根因**：用户要求"发现页面不要最新火花，这些都放在火花页面"
- **修复**：`home` 移除最新火花区块；`library` 新增顶部最新火花展示
- **文件**：`src/app/home/page.tsx`、`src/app/library/page.tsx`

---

## v6.2-fix2 登录页导航栏彻底修复 + 全局认证守卫 (2026-05-04)

### 问题1：登录页底部导航栏删不掉
- **根因**：`usePathname()` 初始返回 `null`，`layout.tsx` 直接包含 `BottomNav`
- **修复**：新建 `AppShell` 组件，`pathname === '/'` 绝对不渲染导航栏
- **文件**：`src/components/layout/AppShell.tsx`、`src/app/layout.tsx`

### 问题2：我的页面一直转圈
- **根因**：未登录时 `user` 永远是 `null`，`if (!user)` 永远返回 loading
- **修复**：新增 `pageLoading` state，未登录显示"请先登录"UI
- **文件**：`src/app/profile/page.tsx`

---

## v6.2 邀请好友 + 个人疗愈私密模式 (2026-05-04)

### 部署问题：GitHub fetch 超时
- **解决**：本地 `git bundle` + `scp` + 服务器 `git fetch bundle` 方案
- **教训**：GitHub 不可靠时必须保留备用同步通道

### 任务一：双人模式「邀请好友」
- Room模型新增 `inviteCode String? @unique` 字段
- API：`POST /api/rooms/invite`、`POST /api/rooms/join`

### 任务二：个人疗愈私密模式
- 独立表 `HealingSession` + `HealingMessage`
- AES-256-GCM加密
- API：`GET/POST /api/healing`、`GET/POST /api/healing/[id]/messages`

---

## v6.1 P0紧急Bug修复 + P1功能扩展 (2026-05-04)

### 变更清单
1. **P0 Bug修复**：match-engine事务化、socket消息持久化、messages API支持guest
2. **P1 功能**：Coming Soon标记、earnings页面、AI角色系统、观众模式
3. **P2 多Agent协作**：rooms/ai API支持agents数组、room page轮流回复

---

## v6.0-fix2 泡泡彻底修复 (2026-05-02)

### 根因：点击泡泡显示"脑洞不存在"
- **修复**：泡泡API使用稳定id持久化 + 点击直接匹配

---

## v6.2-fix5 「我的」页面设置功能完整实现 + 头部布局重构 (2026-05-05)

### 功能实现清单

| # | 功能 | 实现 | 文件 |
|---|------|------|------|
| 1 | **修改头像** | `<input type="file" accept="image/*" capture="environment">` + FileReader base64 + POST `/api/users/avatar` | settings/page.tsx |
| 2 | **修改昵称** | Inline edit：点击显示输入框，Enter/Esc/Blur 保存/取消，PUT `/api/users/profile` | settings/page.tsx |
| 3 | **修改密码** | 旧密码+新密码+确认密码，bcrypt 哈希，PUT `/api/users/password` | settings/page.tsx |
| 4 | **默认头像** | 首字母彩色头像组件，根据用户名首字母自动生成 | profile/page.tsx, settings/page.tsx |
| 5 | **头部布局** | 头像48px圆形 + 昵称水平排列，间距12px | profile/page.tsx |
| 6 | **数据刷新** | 从 `/api/users/me` 获取最新数据，同步更新 localStorage | profile/page.tsx, settings/page.tsx |

### 后端 API（新增4个）

| API | 方法 | 说明 |
|-----|------|------|
| `/api/users/me` | GET | 获取当前用户信息（支持 guestId header） |
| `/api/users/profile` | PUT | 修改昵称（zod 校验，1-30字符） |
| `/api/users/avatar` | POST | 上传头像（base64 数据，限制 5MB） |
| `/api/users/password` | PUT | 修改密码（旧密码 bcrypt 校验 + 新密码 bcrypt hash(10)） |

### 关键设计决策

1. **头像存储**：base64 直接存数据库，不依赖服务器文件系统权限
2. **昵称唯一性**：只修改 `name`（显示昵称），不修改 `username`（登录用户名）
3. **密码安全**：bcrypt hash(10) 加密，旧密码必须 bcrypt.compare 验证通过
4. **数据同步**：每次修改后同步更新 localStorage `xh_user`

### 文件变更

- **新增**：`src/app/settings/page.tsx`
- **新增**：`src/app/api/users/me/route.ts`
- **新增**：`src/app/api/users/profile/route.ts`
- **新增**：`src/app/api/users/avatar/route.ts`
- **新增**：`src/app/api/users/password/route.ts`
- **修改**：`src/app/profile/page.tsx`

### 编译结果：62/62 路由全部通过 ✅

---

## v6.0 全面重构 (2026-05-03)

### 11项硬性要求落地
- 登录页增加项目简介
- 发现页重构：TOP3排行榜+火花展示+4模式入口
- 底部导航改为4Tab
- 火花页（原素材库）→ 公开火花墙
- 故事页重构
- 我的页重构
- 对白室极简化
- AI催化升级
- 双人匹配修复
- 脑洞降低门槛
- 新增API

---

## v6.3-fix2 认证系统紧急修复（老用户跳过登录 + 新用户注册失败） (2026-05-05)

### 问题1：老用户可能跳过登录表单直接进入主页面

**现象**：未登录或 session 已过期的用户，因为 localStorage 中残留 `xh_user` 数据，可以绕过登录页直接访问 `/home` 等页面

**根因链**：
```
用户关闭浏览器后重新打开
  → next-auth session/JWT 已过期
  → 但 localStorage 中 xh_user 仍然存在
  → AppShell.tsx 只检查 localStorage，不验证 session
  → useAuth.ts 优先从 localStorage 读取，session 状态被忽略
  → 用户"看起来"已登录，可以访问所有页面
  → 但访问需要真实用户ID的API时全部失败
```

**根因1**：`AppShell.tsx` 认证守卫只检查 `localStorage.getItem('xh_user')`，不验证 next-auth session 有效性
**根因2**：`useAuth.ts` 优先从 localStorage 读取用户数据，session 状态为 `unauthenticated` 时仍认为用户已登录
**根因3**：项目没有 `middleware.ts` 全局认证中间件，所有认证判断分散在前端组件中
**根因4**：`LoginForm.tsx` 登录成功后写入 localStorage 的是假数据（`id: 'user-' + Date.now()`），不是服务器真实用户ID

**修复方案**：
1. **新增 `middleware.ts`**：全局边缘认证中间件，基于 next-auth JWT token 判断登录状态
   - 未登录访问非公开页 → 重定向到 `/`
   - 已登录访问 `/` 或 `/register` → 重定向到 `/home`
2. **修复 `AppShell.tsx`**：引入 `useSession()`，双重认证守卫（session + localStorage）
3. **修复 `useAuth.ts`**：session 状态为 `unauthenticated` 时，主动清除 localStorage 残留数据
4. **修复 `LoginForm.tsx`**：登录成功后调用 `/api/users/me` 获取真实用户数据，再写入 localStorage

### 问题2：新用户注册后无法正常登录

**现象**：用户注册成功后需要手动回到登录页再次输入用户名密码登录

**根因**：`register/page.tsx` 注册成功后只是 `router.push('/?username=...&password=...')`，没有自动完成登录流程

**修复方案**：
1. **修复 `register/page.tsx`**：注册成功后自动调用 `signIn('credentials', ...)` 完成登录
2. **注册API添加详细日志**：在请求接收、参数校验、数据库查询、用户创建等关键步骤添加 `console.log`
3. **错误反馈增强**：API 返回的 `message` 直接显示给用户（如"用户名已被注册，请更换后重试"）

### 问题3：登录后 localStorage 存储假数据

**现象**：登录成功后 `xh_user` 的 `id` 是 `'user-' + Date.now()`，不是数据库真实ID，导致后续API调用失败

**根因**：`LoginForm.tsx` 登录成功后自己构造了一个 `userData` 对象，没有从服务器获取真实数据

**修复方案**：
- `LoginForm.tsx` 登录成功后 → `signIn` 返回成功 → 调用 `fetch('/api/users/me')` → 获取真实用户数据 → 写入 localStorage
- 如果 `/api/users/me` 获取失败，使用基本数据兜底并记录警告日志

### 文件变更

| 文件 | 变更 |
|------|------|
| `middleware.ts`（新增） | 全局边缘认证中间件，JWT token 验证 |
| `src/app/LoginForm.tsx` | 登录成功后获取真实用户数据；清除旧session残留 |
| `src/app/register/page.tsx` | 注册成功后自动登录 |
| `src/app/api/auth/register/route.ts` | 添加详细 console.log 日志；增强错误处理 |
| `src/hooks/useAuth.ts` | session 失效时清除 localStorage |
| `src/components/layout/AppShell.tsx` | 引入 useSession，双重认证守卫 |

### 编译结果：64/64 路由全部通过 ✅（含 Middleware）

---

## v6.3-fix3 登录页恢复 + 强制登录墙 + 导航栏控制 (2026-05-05)

### 问题1：未登录用户打开网站后直接跳过登录页进入发现页

**现象**：用户打开 `/`，但页面直接显示 `/home` 的内容，看不到登录表单

**根因链**：
```
用户打开网站
  → middleware.ts 的 matcher 正则 `.*\.` 不被 path-to-regexp 正确解析
  → middleware 对 `/home` 等路径完全不执行
  → AppShell.tsx 中 useEffect 重定向有延迟
  → 页面先渲染 `/home` 的内容（包括 BottomNav）
  → 用户看到的是发现页而不是登录页
```

**根因1**：`middleware.ts` 的 `matcher` 使用了 `.*\.` 负向前瞻，Next.js 的 `path-to-regexp` 无法正确解析，导致 middleware 对大部分路径不生效
**根因2**：`auth.ts` 中 JWT 默认 `maxAge: 30 * 24 * 60 * 60`（30天），关闭浏览器后 cookie 仍然存在
**根因3**：`AppShell.tsx` 中 session `loading` 状态时，如果 localStorage 有 `xh_user` 残留，不做任何处理，页面继续渲染
**根因4**：`useAuth.ts` 中 session `unauthenticated` 时，只有当 `savedUser` 存在才清除 localStorage，逻辑不够严格

### 问题2：未登录状态下底部导航栏显示并可点击

**现象**：未登录用户可以看到底部导航栏（发现、火花、故事、我的）

**根因**：`BottomNav.tsx` 虽然检查了 `status === 'unauthenticated'`，但 `AppShell.tsx` 渲染 BottomNav 的时机在 session 状态确定之前，加上 middleware 失效，导致未登录用户一度能看到导航栏

### 修复方案

1. **修复 `middleware.ts`**：将 `matcher` 从复杂的正则改为**显式路径列表**，确保每个需要保护的页面都被匹配
2. **修复 `auth.ts`**：显式设置 `secret: process.env.NEXTAUTH_SECRET`，JWT `maxAge` 从 30 天缩短为 **24 小时**
3. **修复 `AppShell.tsx`**：session `unauthenticated` 时**无条件清除**所有 localStorage 残留，无论是否存在 `xh_user`
4. **修复 `LoginForm.tsx`**：加载时如果 `status === 'unauthenticated'`，主动清除所有 localStorage 数据
5. **修复 `useAuth.ts`**：session `unauthenticated` 时**无条件清除**所有残留数据（`xh_user` + `xh_user_id` + `xh_identity`）

### 文件变更

| 文件 | 变更 |
|------|------|
| `middleware.ts` | matcher 从正则改为显式路径列表，确保所有页面被拦截 |
| `src/lib/auth.ts` | 显式设置 secret，JWT maxAge 30天→24小时 |
| `src/components/layout/AppShell.tsx` | session unauthenticated 时无条件清除残留 |
| `src/app/LoginForm.tsx` | 加载时清除本地残留数据 |
| `src/hooks/useAuth.ts` | session 失效时无条件清除所有残留 |

### 编译结果：64/64 路由全部通过 ✅（含 Middleware）

---

## v6.4 火花点赞互动 + 双重排序 (2026-05-05)

### 功能清单

| # | 功能 | 文件 |
|---|------|------|
| 1 | **火花点赞** — POST /api/sparks/:id/like | `api/sparks/[id]/like/route.ts` |
| 2 | **不能给自己点赞** — 后端校验 asset.userId !== currentUserId | `api/sparks/[id]/like/route.ts` |
| 3 | **热度 = 点赞数** — Asset.hotScore 随点赞增减 | `api/sparks/[id]/like/route.ts` |
| 4 | **重复点赞防护** — 前端 likedByMe 状态 + 后端唯一索引 | `library/page.tsx` + `prisma schema` |
| 5 | **最新火花排序** — 按 createdAt desc | `api/sparks/public/route.ts` |
| 6 | **最热火花排序** — 按 hotScore desc | `api/sparks/public/route.ts` |
| 7 | **默认最新** — 用户进入默认展示最新火花 | `library/page.tsx` |
| 8 | **点赞按钮 UI** — Flame/Heart 图标 + 热度数字 | `library/page.tsx` |
| 9 | **点击跳转详情** — 点击火花卡片跳转到 room 页面 | `library/page.tsx` |

### 数据模型变更

新增 `AssetLike` 模型：
```prisma
model AssetLike {
  id        String   @id @default(cuid())
  assetId   String
  userId    String
  createdAt DateTime @default(now())
  asset     Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  @@unique([assetId, userId])
}
```

### API 设计

| 接口 | 方法 | 说明 |
|------|------|------|
| `POST /api/sparks/:id/like` | 点赞/取消点赞 | 事务操作：创建/删除 AssetLike + 更新 Asset.hotScore |
| `GET /api/sparks/public?sort=latest\|hottest` | 公开火花 | 支持排序，返回 likedByMe + isMySpark |
| `GET /api/sparks/mine?sort=latest\|hottest` | 我的火花 | 支持排序 |

### 编译结果：64/64 路由全部通过 ✅（含 Middleware）

---

## v7.0 火花墙重构：个人火花移至【我的】+ 点赞图标统一 (2026-05-05)

### 功能清单

| # | 功能 | 文件 |
|---|------|------|
| 1 | **火花墙纯公开化** — 移除 library 页面"我的火花"Tab | `library/page.tsx` |
| 2 | **新建我的火花页** — `/profile/sparks` 独立页面 | `profile/sparks/page.tsx`（新增） |
| 3 | **个人火花排序** — 支持最新/最热排序 | `profile/sparks/page.tsx` |
| 4 | **公开/私密切换** — 每条火花独立开关 | `profile/sparks/page.tsx` |
| 5 | **点赞图标统一** — Heart → Flame（火花） | `library/page.tsx` |
| 6 | **已点赞状态** — Flame 图标变红+实心 | `library/page.tsx` |
| 7 | **路由更新** — profile 菜单"我的火花"指向 `/profile/sparks` | `profile/page.tsx` |
| 8 | **Middleware 更新** — 新增 `/profile/sparks` 路径 | `middleware.ts` |

### 设计决策

1. **页面分离**：公开火花墙与个人火花管理分离，符合"关注点分离"原则
   - `/library`：纯消费场景（浏览、点赞）
   - `/profile/sparks`：纯管理场景（查看全部、切换公开状态）
2. **图标统一**：所有与"火花"相关的图标统一使用 Flame，保持产品概念一致性
3. **排序复用**：两个页面共用同一套排序逻辑（latest/hottest），减少用户学习成本

### 编译结果：65/65 路由全部通过 ✅（含 Middleware）

---

## v7.0 完整版 — 根据修改后 TDD 7.0 重构 (2026-05-05)

### 需求变更点

1. **火花墙UI重构**：顶部"最新火花"2x2网格 → 移除，改为纯 Tab 切换（最新火花/最热火花）
2. **修改用户名同步**：修改用户名后需同步更新历次火花记录里的 identity 字段
3. **发现页确认**：四个模式入口（人机/双人/多人即将开放/观看）

### 第1轮自检

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 火花墙 Tab 切换 | ✅ | 最新火花/最热火花两个Tab，默认最新 |
| 点赞 Flame 图标 | ✅ | 已点赞红色实心，未点赞灰色空心 |
| 不能给自己点赞 | ✅ | 自己的火花只显示热度数字 |
| 个人火花页面 | ✅ | `/profile/sparks` 独立页面，有公开/私密切换 |
| 发现页四个模式 | ✅ | 人机/双人/多人(即将开放)/观看 |
| 登录流程 | ✅ | middleware + AppShell + BottomNav 三层守卫 |

**发现问题1**：settings/page.tsx 修改用户名成功后未同步更新 localStorage
- **修复**：saveUsername 成功后同步更新 localStorage.xh_user 的 name 和 username

**发现问题2**：api/users/profile 只更新 username，未更新 name 和 Asset.identity
- **修复**：API 中同时更新 `name: username`，并查询旧 name 同步更新 Asset 表的 identity 字段

### 第2轮自检

| 检查项 | 结果 | 说明 |
|--------|------|------|
| library guestId SSR | ⚠️ | 组件顶层直接访问 localStorage |
| profile/sparks guestId | ⚠️ | 同样问题 |

**发现问题3**：`typeof window !== 'undefined'` 在 App Router 客户端组件中仍可能导致 hydration 不一致
- **修复**：`library/page.tsx` 和 `profile/sparks/page.tsx` 中 guestId 改为 `useState` + `useEffect`

### 第3轮自检

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 构建测试 | ✅ | 65/65 路由通过 |
| 火花墙 Tab 样式 | ✅ | 居中排列，选中高亮 |
| 空状态文案 | ✅ | 最新/最热各自有对应提示 |
| 点击跳转详情 | ✅ | 点击内容区域跳转 room 页面 |

### 第4轮自检（最终确认）

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 登录页无导航栏 | ✅ | BottomNav pathname === '/' return null |
| 未登录强制跳转 | ✅ | middleware 重定向到 / |
| 已登录跳发现页 | ✅ | middleware 重定向到 /home |
| 火花墙公开 only | ✅ | library 无个人火花Tab |
| 个人火花在【我的】 | ✅ | `/profile/sparks` 入口 |
| 头像上传 | ✅ | capture="environment" 支持拍照 |
| 用户名唯一性 | ✅ | API 排除当前用户检查 |
| 旧密码验证 | ✅ | PUT /api/users/password bcrypt.compare |
| 修改密码哈希 | ✅ | bcrypt.hash(10) |

### 编译结果：65/65 路由全部通过 ✅（含 Middleware）

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/app/library/page.tsx` | 移除顶部网格，改为 Tab 切换；guestId 改为 useState |
| `src/app/profile/sparks/page.tsx` | guestId 改为 useState |
| `src/app/settings/page.tsx` | 修改用户名成功后同步更新 localStorage |
| `src/app/api/users/profile/route.ts` | 同步更新 User.name 和 Asset.identity |
| `docs/qunxiangxinhuo-TDD-v7.0.md` | 按修改后需求重写 |
| `IMPORTANT.md` | 新增 v7.0 规范章节 |

---

## v7.0-fix1 登录页显示修复 + 页面标题居中 + 退出登录修复 (2026-05-05)

### 问题1：退出登录后无法看到登录页面

**现象**：用户点击"退出登录"后，页面没有跳转到登录页，而是继续显示发现页或不断重定向

**根因链**：
```
用户点击退出登录
  → profile/page.tsx 只清除了 localStorage
  → 但 next-auth session cookie 仍然存在
  → middleware 检查到 cookie → 认为用户已登录
  → 访问 / 时被重定向到 /home
  → 用户永远看不到登录页
```

**根因**：退出登录只清除了 localStorage，没有调用 `signOut()` 清除 next-auth session cookie

**修复方案**：
1. profile/page.tsx 退出登录时 `await signOut({ redirect: false })`
2. 然后清除 localStorage
3. 最后 `router.push('/')` + `router.refresh()`

### 问题2：页面标题未统一居中

**现象**：发现页、火花页、故事页等页面标题左对齐，不统一

**根因**：PageHeader 组件和 TopBar 组件未设置 `text-center`

**修复方案**：
1. PageHeader 组件添加 `text-center`
2. TopBar 组件改为左-中-右三等分布局，标题 `flex-1 text-center`
3. profile/sparks 子页面标题使用 `flex-1 text-center pr-10` 保持绝对居中

### 问题3：火花页面内容位置偏下

**现象**：火花页面顶部空白区域过大，内容偏下

**根因**：Tab 切换区域上方有 `pt-4` (16px) 和 `mb-5` (20px) 的间距

**修复方案**：`pt-4` → `pt-2`，`mb-5` → `mb-4`

### 4轮自检结果

| 轮次 | 发现问题 | 状态 |
|------|---------|------|
| 第1轮 | 构建通过，确认 signOut 修复 | ✅ |
| 第2轮 | TopBar 测试通过，无 title 情况检查 | ✅ |
| 第3轮 | 检查所有 TopBar 使用情况，均传 title | ✅ |
| 第4轮 | 版本号更新 v6.3→v7.0，最终构建通过 | ✅ |

### 编译结果：65/65 路由全部通过 ✅（含 Middleware）

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/app/profile/page.tsx` | 退出登录调用 signOut + 导入 signOut |
| `src/components/layout/PageHeader.tsx` | 添加 `text-center` |
| `src/components/layout/TopBar.tsx` | 左-中-右三等分布局，标题绝对居中 |
| `src/app/profile/sparks/page.tsx` | 标题 `flex-1 text-center pr-10` |
| `src/app/library/page.tsx` | `pt-4`→`pt-2`, `mb-5`→`mb-4` |
| `src/app/LoginForm.tsx` | 版本号 v6.3→v7.0 |
| `src/app/settings/page.tsx` | 版本号 v6.3→v7.0 |
| `IMPORTANT.md` | 新增退出登录规范 + 标题居中规范 |

---

> **铁律**：每次100% context前，先读 IMPORTANT.md，记录所有 bug 根因+解决+预防措施，犯过的问题不再犯。
