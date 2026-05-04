# 问题记录与修复日志

## v6.2-fix4 全面质量保障——SSR修复+性能优化+代码规范 (2026-05-05)

### 问题1：登录页 SSR 空白/消失（复发根因）

**现象**：`curl /` 中 `animate-spin` 出现1次，`登录` 出现0次，`BAILOUT_TO_CLIENT_SIDE_RENDERING` 出现1次

**三层根因链（v6.2-fix2 修复不彻底）**：
```
AppShell 移除 useSession（✅ 已完成）
  → 但 LoginForm 仍使用 useSearchParams()（❌ 未修复）
  → useSearchParams() 在 SSR 期间触发 bailout
  → page.tsx 的 Suspense fallback（spinner）成为唯一 SSR 输出
  → LoginForm 完全不参与 SSR
  → 用户看到空白/转圈
```

**根因1（直接）**：`LoginForm.tsx` 使用 `useSearchParams()` 读取 URL 参数
**根因2（深层）**：`LoginForm.tsx` 中 `motion.div` 的 `animate` 属性直接引用 `window?.innerHeight`，SSR 期间 `window` 不存在导致 `ReferenceError`
**根因3（修复遗漏）**：v6.2-fix2 只修复了 AppShell 的 `useSession`，没检查 LoginForm 的 `useSearchParams`

**修复方案：**
1. **移除 `useSearchParams`**：改用 `window.location.search` 在 `useEffect` 中读取 URL 参数
2. **移除 `window` 直接引用**：将 `window.innerHeight` 改为 `useState` + `useEffect` 模式
3. **验证**：编译后检查 `.next/server/app/index.html`，确认包含 `<form>` 和 `<input>` 标签

**文件变更：**
- `src/app/LoginForm.tsx`：移除 `useSearchParams` import，改用 `window.location.search`；`windowHeight` 改为 state

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
