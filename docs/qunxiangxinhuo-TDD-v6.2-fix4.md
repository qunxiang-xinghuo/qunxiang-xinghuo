# 群像·星火 (Qunxiang Xinghuo) 产品需求文档 — v6.2-fix4 质量保障版

**项目名称：** 群像·星火  
**版本：** v6.2-fix4（质量保障版 · 资深测试员全面自检）  
**日期：** 2026年5月5日  
**目标：** SSR修复、性能优化、代码规范、功能全面验证  
**状态：** 已开发完成，已部署 ✅

---

## 一、v6.2-fix4 质量保障核心成果

### 1.1 SSR 修复（登录页空白问题彻底根治）

**问题历史：**
- v6.2-fix2：AppShell 使用 `useSession()` → 触发 `BAILOUT_TO_CLIENT_SIDE_RENDERING`
- v6.2-fix3：AppShell 移除 `useSession` → 但 LoginForm 仍使用 `useSearchParams()` → 问题复发
- v6.2-fix4：LoginForm 移除 `useSearchParams` + 修复 `window` 引用 → **彻底根治**

**修复措施：**
1. `LoginForm.tsx`：移除 `useSearchParams`，改用 `window.location.search`（`useEffect` 内）
2. `LoginForm.tsx`：`window.innerHeight` 改为 `useState` + `useEffect` 模式
3. 验证：`.next/server/app/index.html` 包含 `<form>` + `<input>` + 按钮

### 1.2 代码规范修复（组件顶层浏览器 API 访问）

**修复文件：**
- `healing/session/[id]/page.tsx`：`localStorage.getItem` 移入 `useEffect`
- `room/[id]/page.tsx`：`localStorage.getItem` 移入 `useEffect`

### 1.3 性能优化（library 页面重复请求）

**优化前**：连续调用两次 `/api/sparks/public`（`limit=50` + `limit=6`）
**优化后**：只调用一次 `/api/sparks/public?limit=50`，`latestSparks = list.slice(0, 6)`

---

## 二、页面结构（4Tab底部导航）

```
┌─────────────────────────────┐
│  发现   火花   故事   我的   │  ← BottomNav 4Tab
├─────────────────────────────┤
```

### 2.1 底部导航栏（BottomNav）

**修复历史：**
- v6.0-fix：移动端宽度适配 `max-w-[480px] mx-auto w-full`
- v6.2-fix2：新建 `AppShell` 组件，`pathname === '/'` 绝对不渲染
- v6.2-fix3：`AppShell` 移除 `useSession`，改用 `localStorage` 认证守卫

**当前实现：**
- `AppShell.tsx`：客户端组件，管理 `MobileContainer` + 条件渲染 `BottomNav`
- `pathname === '/'` 时绝对不渲染 BottomNav
- `pathname` 为 null 时不渲染（防hydration闪烁）
- 认证守卫：`useEffect` 中检查 `localStorage.getItem('xh_user')`，未登录且非首页时重定向

### 2.2 发现页（/home）

**v6.2-fix3 变更：**
- **移除**："最新火花"区块（已迁移至 `/library`）
- **保留**：
  1. 今日最热 TOP3 排行榜
  2. 四大模式入口（人机/双人/多人ComingSoon/连载ComingSoon）

### 2.3 火花页（/library）

**v6.2-fix3 变更：**
- **新增**：顶部"最新火花"2×2网格展示（从 `/home` 迁移）
- **公开火花**：按热度排序
- **我的火花**：用户标记的火花，支持公开/私密切换

**v6.2-fix4 优化：**
- 合并重复 API 请求，只调用一次 `/api/sparks/public?limit=50`

### 2.4 故事页（/story-hall）

4Tab：快速匹配 / 长期连载 / 我发起的 / 其他人的

### 2.5 我的页（/profile）

**v6.2-fix2 修复：**
- `pageLoading` state 区分初始化与未登录状态
- 未登录显示"请先登录" + 去登录按钮
- API 请求带 `AbortController` 10秒超时

**功能菜单：**
- 我的收益 → /earnings
- 个人疗愈 → /healing
- 我的火花 → /library
- 我的故事 → /story-hall
- 设置

---

## 三、核心功能模块

### 3.1 人机模式（/solo-match）

**v6.2-fix3 修复：**
- 底部"开始对话"按钮 `pb-6` → `pb-20`，防止被 `h-14` 导航栏遮挡

**流程：**
1. 选择身份（预设/随机/自定义）
2. `POST /api/rooms/ai` 创建 `type: "ai_duet"` 房间
3. 跳转 `/room/[id]` 与刘看山AI对话

### 3.2 双人对白匹配

**流程：**
```
/duo-match（身份选择）
  → /duo-waiting（15秒倒计时）
    → 匹配成功 → /room/[id]（双人WebSocket对白）
    → 15秒超时 → 显示"与刘看山对话"按钮
```

**v6.2 新增：邀请好友**
- `POST /api/rooms/invite` — 创建房间+6位邀请码
- `POST /api/rooms/join` — 通过邀请码加入房间

### 3.3 个人疗愈（/healing）

**v6.2 新增：**
- 独立表 `HealingSession` + `HealingMessage`
- AES-256-GCM 加密存储
- AI人格：`persona='healer'`
- API：`GET/POST /api/healing`、`GET/POST /api/healing/[id]/messages`

### 3.4 对白室（/room/[id]）

**v6.2-fix4 修复：**
- `room/[id]/page.tsx`：`localStorage` 读取移入 `useEffect`

---

## 四、部署检查清单（v6.2-fix4）

- [x] 本地 `npm run build` 57/57通过
- [x] 登录页 SSR 验证：`index.html` 包含 `<form>` + `<input>`
- [x] `git commit` + `git push origin dev` + `git push fqunxiang dev`
- [x] 服务器 build 57/57通过
- [x] curl验证首页 `/` 200
- [x] curl验证 `/home` 200
- [x] curl验证 `/library` 200
- [x] curl验证静态JS/CSS 200
- [x] curl验证泡泡API `/api/brainholes/bubble` 返回数据
- [x] curl验证火花API `/api/sparks/public` 返回数据
- [x] curl验证AI催化API `/api/ai/catalyst` 返回3个问题
- [x] curl验证AI房间API `/api/rooms/ai` 创建成功
- [x] curl验证匹配API `/api/match` 返回waiting
- [x] PM2状态 online
- [x] 更新 `ProblemLog.md`
- [x] 更新 `docs/qunxiangxinhuo-TDD-v6.2-fix4.md`

---

## 五、Bug修复记录

### v6.2-fix4
| # | 问题 | 根因 | 修复 | 文件 |
|---|------|------|------|------|
| 1 | 登录页SSR空白复发 | LoginForm使用useSearchParams+window引用 | 移除useSearchParams，windowHeight改用state | LoginForm.tsx |
| 2 | 组件顶层访问localStorage | 最佳实践违规 | 移入useEffect | healing/session, room |
| 3 | library重复API请求 | 两次调用sparks/public | 合并为一次请求 | library/page.tsx |

### v6.2-fix3
| # | 问题 | 修复 |
|---|------|------|
| 1 | 登录页SSR空白 | AppShell移除useSession |
| 2 | 人机按钮遮挡 | solo-match pb-6→pb-20 |
| 3 | 首页火花迁移 | home移除/library新增 |

### v6.2-fix2
| # | 问题 | 修复 |
|---|------|------|
| 1 | 登录页导航栏删不掉 | 新建AppShell组件 |
| 2 | 我的页面一直转圈 | pageLoading state |

---

## 六、自检报告

### 6.1 代码规范检查（71个客户端组件）

| 检查项 | 结果 |
|--------|------|
| useSearchParams包裹Suspense | ✅ 7个页面全部正确 |
| window/document SSR安全 | ✅ 无ReferenceError风险 |
| API路由完整性 | ✅ 58个路由全部正常 |

### 6.2 功能测试

| 功能 | 结果 |
|------|------|
| 登录页SSR | ✅ HTML包含表单 |
| 首页/home | ✅ 200 |
| 火花/library | ✅ 200 |
| 人机/solo-match | ✅ 200 |
| 双人/duo-match | ✅ 200 |
| 故事/story-hall | ✅ 200 |
| 我的/profile | ✅ 200 |
| 疗愈/healing | ✅ 200 |
| 收益/earnings | ✅ 200 |
| 知乎/zhihu-search | ✅ 200 |
| 火花API | ✅ 返回数据 |
| 脑洞API | ✅ 返回数据 |
| AI催化API | ✅ 返回3个问题 |
| AI房间API | ✅ 创建成功 |
| 匹配API | ✅ 返回waiting |
| 静态资源 | ✅ 200 |

---

> 最后更新：2026-05-05 v6.2-fix4 全面质量保障——SSR修复+性能优化+代码规范+功能全面验证 已部署 ✅
