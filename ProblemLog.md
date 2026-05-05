# 问题记录与修复日志

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

> **铁律**：每次100% context前，先读 IMPORTANT.md，记录所有 bug 根因+解决+预防措施，犯过的问题不再犯。
