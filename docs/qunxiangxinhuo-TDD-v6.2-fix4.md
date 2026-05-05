# 群像·星火 (Qunxiang Xinghuo) 产品需求文档 — v6.2-fix4 质量保障版

**项目名称：** 群像·星火  
**版本：** v6.2-fix4（质量保障版 · 资深测试员全面自检）  
**日期：** 2026年5月5日  
**目标：** SSR彻底修复、性能优化、代码规范、功能全面验证  
**状态：** 已开发完成，已部署 ✅

---

## 一、v6.2-fix4 核心修复成果

### 1.1 登录页 SSR "消失" 问题彻底根治

**问题现象**：部署后用户反馈"登录页面消失了"——页面加载后内容不可见/空白

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

**自检教训**：之前只检查了 `<form>` 和 `<input>` 是否存在，没检查内容是否可见（`opacity:0` 会让内容存在但不可见）。

**修复措施：**
1. **MobileContainer**：添加 `mounted` state，SSR 期间 `initial=false`
2. **LoginForm**：所有 `motion` 组件改为 `initial={mounted ? ... : false}`
3. **page.tsx**：从 `'use client'` + `Suspense` 改为纯服务端组件
4. **LoginForm**：移除 `useSearchParams`，改用 `window.location.search`（`useEffect` 内）
5. **LoginForm**：`window.innerHeight` 改为 `useState` + `useEffect`

**验证铁律**：
- 检查 SSR HTML 是否包含 `<form>` ✅
- 检查 body 中是否没有 `opacity:0` ✅
- 检查 `animate-spin` 是否不在 body 中 ✅

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

### 2.2 发现页（/home）

- 今日最热 TOP3 排行榜
- 四大模式入口（人机/双人/多人ComingSoon/连载ComingSoon）

### 2.3 火花页（/library）

- 顶部"最新火花"2×2网格展示
- 公开火花：按热度排序
- 我的火花：支持公开/私密切换

### 2.4 故事页（/story-hall）

4Tab：快速匹配 / 长期连载 / 我发起的 / 其他人的

### 2.5 我的页（/profile）

- `pageLoading` state 区分初始化与未登录
- 未登录显示"请先登录"UI
- API 请求带 `AbortController` 10秒超时

---

## 三、核心功能模块

### 3.1 人机模式（/solo-match）

- 底部按钮 `pb-20`，防止被导航栏遮挡
- 选择身份 → `POST /api/rooms/ai` → 跳转 `/room/[id]`

### 3.2 双人对白匹配

```
/duo-match → /duo-waiting（15秒）
  → 匹配成功 → /room/[id]
  → 超时 → "与刘看山对话"按钮
```

### 3.3 个人疗愈（/healing）

- AES-256-GCM 加密存储
- API：`GET/POST /api/healing`、`GET/POST /api/healing/[id]/messages`

---

## 四、部署检查清单（v6.2-fix4）

- [x] 本地 `npm run build` 57/57通过
- [x] 登录页 SSR 验证：body 中无 `opacity:0`
- [x] 登录页 SSR 验证：包含 `<form>` + `<input>`
- [x] 登录页 SSR 验证：无 `animate-spin`
- [x] `git commit` + `git push origin dev` + `git push fqunxiang dev`
- [x] 服务器 build 57/57通过
- [x] curl验证 `/` 200
- [x] curl验证 `/home` 200
- [x] curl验证 `/library` 200
- [x] curl验证 `/solo-match` 200
- [x] curl验证静态JS/CSS 200
- [x] PM2状态 online
- [x] 更新 `ProblemLog.md`
- [x] 更新 `docs/qunxiangxinhuo-TDD-v6.2-fix4.md`

---

## 五、Bug修复记录

### v6.2-fix4-final（登录页消失彻底修复）

| # | 问题 | 根因 | 修复 | 文件 |
|---|------|------|------|------|
| 1 | 登录页消失 | MobileContainer `initial={{opacity:0}}` 包裹所有页面 | SSR期间`initial=false` | MobileContainer.tsx |
| 2 | 登录页消失 | LoginForm多处`initial={{opacity:0}}` | 条件`initial` | LoginForm.tsx |
| 3 | 登录页SSR空白 | page.tsx是'use client'+Suspense | 改为服务端组件 | page.tsx |
| 4 | 登录页SSR空白 | LoginForm使用useSearchParams | 移除，改用window.location.search | LoginForm.tsx |
| 5 | 登录页SSR报错 | window?.innerHeight直接引用 | 改为useState+useEffect | LoginForm.tsx |

### 自检结论

| 检查项 | 结果 |
|--------|------|
| useSearchParams包裹Suspense | ✅ 7个页面全部正确 |
| window/document SSR安全 | ✅ 无ReferenceError风险 |
| API路由完整性 | ✅ 58个路由全部正常 |
| 登录页SSR（body无opacity:0） | ✅ 通过 |
| 57/57 路由编译 | ✅ 通过 |
| 服务器API测试 | ✅ 全部正常 |

---

> 最后更新：2026-05-05 v6.2-fix4 登录页消失彻底修复——framer-motion initial opacity:0 根因根治 已部署 ✅
