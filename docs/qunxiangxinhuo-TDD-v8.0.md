# 群像·星火 (Qunxiang Xinghuo) 产品需求文档 — v7.0 完整版

**项目名称：** 群像·星火  
**版本：** v7.0-fix7（完整功能版 · 累计 v6.0~v6.4 + v7.0 重构 + fix1~fix7）  
**日期：** 2026年5月5日  
**状态：** 已开发完成，已部署 ✅  
**部署地址：** http://81.70.59.228

---

## 本次修改要点（v7.0-fix7）

1. **登录/退出跳转统一为 `/login`**：middleware、AppShell、profile 页面全部统一重定向目标
2. **消息重复显示修复**：Room 页面 Socket 监听器去重（removeAllListeners + senderId 过滤）+ 后端 socket.to 排除发送者
3. **结束逻辑完善**：leave-room 和 disconnect 均广播 opponent-left，前端 alert + 跳转 /home
4. **脑洞显示修复**：标题 `text-xl font-bold text-[#e2b04a]`，描述完整显示
5. **Webhook 自动部署**：Forgejo push → Nginx /webhook → 本地 deploy.sh → git pull → build → PM2 restart

---

## 一、版本演进总览

| 版本 | 日期 | 核心内容 |
|------|------|---------|
| v6.0 | 2026-05-03 | 全面重构：TOP3排行榜+火花+4模式+极简对白室+动态AI |
| v6.1 | 2026-05-04 | P0修复：事务化匹配+消息持久化+观众模式+P1功能扩展 |
| v6.2 | 2026-05-04 | 邀请好友+个人疗愈私密模式+ earnings页面 |
| v6.2-fix2~fix5 | 2026-05-04~05 | 导航栏修复+SSR空白修复+登录页修复+设置功能+全面质量保障 |
| v6.3 | 2026-05-05 | 观看模式：公开房间列表+纯围观房间+滑动切换 |
| v6.3-fix1 | 2026-05-05 | 我的页面+设置页面重构：居中布局+简化列表+独立弹窗 |
| v6.3-fix2 | 2026-05-05 | 认证系统修复：自动登录+注册流程+真实用户数据 |
| v6.3-fix3 | 2026-05-05 | 强制登录墙：middleware全局守卫+JWT 24小时+无条件清除残留 |
| v6.4 | 2026-05-05 | 火花点赞互动+双重排序 |
| **v7.0** | **2026-05-05** | **火花墙重构：个人火花移至【我的】+ 点赞图标统一为 Flame** |
| v7.0-fix1 | 2026-05-05 | 登录页显示修复+标题居中+退出登录修复 |
| v7.0-fix2 | 2026-05-05 | /login路由+getToken修复用户信息读取 |
| v7.0-fix3 | 2026-05-05 | 我的页面头像重构+火花页Tab样式统一 |
| v7.0-fix4 | 2026-05-05 | 登录页恢复根路径+用户名显示修复+注册需手动登录 |
| v7.0-fix5 | 2026-05-05 | P0登录Bug：cookie session化+退出硬刷新+登录导航冲突修复 |
| v7.0-fix6 | 2026-05-05 | 系统性修复 getServerSession → getToken（42个API路由） |
| **v7.0-fix7** | **2026-05-05** | **/login路由+消息去重+结束逻辑+脑洞显示+webhook自动部署** |
| v7.0-test1 | 2026-04-29 | 修复LoginForm空输入loading未重置+移除12个阻塞式alert+register跳转统一+Suspense边界 |
| v7.0-test2 | 2026-04-29 | sparks/public参数校验+feedback/JSON.parse防护+brainhole异步提交错误处理 |
| v7.0-test3 | 2026-04-29 | story-hall修复13个空catch+JSON.parse防护+组件卸载setState防护 |
| v7.0-test4 | 2026-04-29 | rooms/join/invite错误安全访问+brainholes区分ZodError/SyntaxError+library并行化查询 |
| v7.0-test5 | 2026-04-29 | library/multiplayer/roadshow/story/zhihu-search添加framer-motion mounted控制+卸载setState |
| v7.0-test6 | 2026-04-29 | useBrainhole和useReaction添加卸载setState防护+error安全访问 |
| v7.0-test7 | 2026-04-29 | zhihu-zhida卸载setState+match/page.tsx类型安全 |
| v7.0-test8 | 2026-04-29 | brainholes事务包裹+profile SyntaxError/P2002并发防护 |
| v7.0-test9 | 2026-04-29 | duo/multi-waiting清理5处setTimeout内存泄漏+story-hall网络错误区分 |
| v7.0-test10 | 2026-04-29 | 4个API路由添加UUID格式校验 |
| v7.0-test11 | 2026-04-29 | match guestId修复+avatar目录创建+sparks并发竞态+P2002防护+framer-motion+setTimeout泄漏+卸载setState |
| v7.0-test12 | 2026-04-29 | AI聊天apiError参数修复+healing历史排序+reactions事务+match-engine原子性+语音录制cleanup+hooks res.ok |
| v7.0-test13 | 2026-04-29 | zhihu写操作身份验证+healing publishing死锁修复 |
| v7.0-test14 | 2026-04-29 | room setTimeout泄漏+generateAIReply catch+solo/duo-match framer-motion及fetch防护 |
| v7.0-test15 | 2026-04-29 | rooms/ai Zod验证+rooms/join竞态消除+rooms/invite邀请码P2002重试+healing会话限制 |
| v7.0-test16 | 2026-04-29 | spectate identity验证+settings/healing framer-motion及错误处理 |
| v7.0-test17 | 2026-04-29 | 外部API超时控制(DeepSeek/知乎直答 15s)+ai/catalyst致命错误返回500 |
| v7.0-test18 | 2026-04-29 | 组件framer-motion SSR防护(BubbleCloud/ModeDock/ZhihuHotBubbles)+useAuth卸载防护 |
| v7.0-test19 | 2026-04-29 | register/library/profile/roadshow framer-motion SSR防护 |

---

## 二、登录流程与页面权限设计

### 2.1 首页（第一屏）必须是登录页
用户打开网站后，看到的第一个页面必须是登录页面。

登录页特性：
- **绝对不出现底部导航栏**（发现/火花/故事/我的）。导航栏只在登录成功后显示。
- 登录页顶部显示"群像·星火"大字标题。
- 提供用户名和密码输入框，以及登录按钮。
- 底部有一行小字："没有账号？去注册"，点击后跳转到注册页面。
- **路径**：`/`（根路径）是主登录页，`/login` 是重定向别名

### 2.2 全局路由守卫（三层架构）

```
边缘层: middleware.ts → getToken JWT验证 → 未登录307重定向到/login
  ↓
布局层: AppShell.tsx → useSession() + localStorage双重检查
  ↓
组件层: useAuth.ts → session优先，失效时清除localStorage
```

**未登录状态**：访问任何非公开页面（/home、/library、/profile、/room/* 等），middleware 返回 307 重定向到 `/login`。

**已登录状态**：访问 `/` 或 `/register` 或 `/login`，middleware 重定向到 `/home`。

**导航栏控制**：`AppShell.tsx` 中 `isLoginPage = pathname === '/' || pathname === '/login'`，登录页绝对不渲染 BottomNav。

### 2.3 退出登录流程
1. 清除 localStorage: `xh_user`, `xh_identity`, `xh_user_id`
2. 清除 sessionStorage
3. `signOut({ redirect: false })`
4. `window.location.replace('/login')` 硬刷新

---

## 三、核心页面结构

```
底部导航（登录后显示）：
┌─────────────────────────────┐
│  发现   火花   故事   我的   │
└─────────────────────────────┘
```

### 3.1 登录页（/）
- 群像·星火品牌展示+项目简介
- 用户名/密码登录表单
- 注册入口
- 装饰性透明泡泡背景

### 3.2 发现页（/home）
- **今日最热 TOP3**：排行榜，点击直接进入匹配
- **最新火花**：2x2网格展示最新4条火花片段
- **四大模式入口**（2x2网格）：
  - 人机交互模式（/solo-match）
  - 双人对白模式（/duo-match）
  - 多人组队模式（/story-hall，即将开放）
  - 观看模式（/spectate）

### 3.3 火花页（/library）【公开火花墙】
- **Tab 切换**：最新火花 / 最热火花
  - 最新火花：按 `createdAt` 降序（默认）
  - 最热火花：按 `hotScore`（点赞数）降序
- **火花卡片**：
  - 脑洞标题 + 内容摘要
  - 作者身份 + 发布日期
  - 🔥 点赞按钮（**Flame 火花图标**）+ 热度数字
  - 已点赞状态显示红色点亮图标（实心 Flame）
  - 不能给自己的火花点赞
  - 点击卡片可跳转到对白室详情

### 3.4 对白室（/room/[id]）
- **顶部脑洞显示**：标题 `text-xl font-bold text-[#e2b04a]` 完整显示，场景描述 `text-sm text-[#e2b04a]/70`
- 微信聊天风格消息气泡
- **消息去重**：Socket 监听器 removeAllListeners + senderId 过滤 + 后端 socket.to 排除发送者
- **结束逻辑**：一方点击"结束对白" → leaveRoom → 对方收到 opponent-left → alert + 跳转 /home
- AI 动态催化：30秒刷新
- 火花标记：点击 Flame 按钮
- 观众模式：spectator 角色，只读+点赞
- 在线人数显示（👁 静默更新）

### 3.5 我的页（/profile）
- 头像（64px白底圆形）左 + 用户名右
- 功能菜单：我的收益 / 个人疗愈 / 我的火花 / 我的故事 / 设置
- 退出登录

### 3.6 设置页（/settings）
- 顶部头像更换
- 修改用户名 / 修改密码

---

## 四、核心功能详述

### 4.1 认证系统（v7.0-fix5/fix6/fix7）

**三层守卫架构：**
```
边缘层: middleware.ts → getToken JWT验证
  ↓
布局层: AppShell.tsx → useSession() + localStorage双重检查
  ↓
组件层: useAuth.ts → session优先，失效时清除localStorage
```

**关键规则：**
- 未登录用户只能访问 `/`, `/login`, `/register`
- 已登录用户访问 `/`, `/login`, `/register` → 重定向到 `/home`
- JWT `maxAge` = 24 小时
- Cookie 设为 session cookie（关闭浏览器即失效）
- session 失效时**无条件清除** `xh_user` + `xh_identity` + `xh_user_id`
- 登录成功后从 `/api/users/me` 获取**真实用户数据**
- **App Router 铁律**：所有 API Route Handler 必须使用 `getToken`，禁止使用 `getServerSession`

### 4.2 对白室消息系统（v7.0-fix7）

**去重机制（三重保险）：**
1. **useEffect 清理**：每次注册前 `removeAllListeners('new-message')`
2. **senderId 过滤**：`if (senderId === stableUserId) return`
3. **后端排除**：`socket.to(roomId).emit('new-message', message)` 不发给发送者

**结束逻辑：**
- 前端 `handleEndChat` → `leaveRoom(roomId, userId)`
- 后端 `leave-room` → `socket.to(roomId).emit('opponent-left', ...)`
- 后端 `disconnect` → 同样广播 `opponent-left`
- 前端收到 `opponent-left` → `alert('对方已结束对白')` → `router.push('/home')`

### 4.3 火花点赞系统（v6.4 + v7.0）

- 图标：**Flame（火花）**，不使用 Heart
- 不能给自己点赞（后端校验）
- 已点赞则取消，未点赞则点赞（toggle）
- 热度值 `hotScore` = 点赞数量

---

## 五、API 路由总览

### 5.1 认证相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 登录/会话 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/users/me` | GET | 获取当前用户信息（getToken） |
| `/api/users/profile` | PATCH | 修改用户名 |
| `/api/users/avatar` | POST | 上传头像 |
| `/api/users/password` | PUT | 修改密码 |

### 5.2 火花相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/sparks/public` | GET | 公开火花墙 |
| `/api/sparks/mine` | GET | 我的火花 |
| `/api/sparks/:id/like` | POST | 点赞/取消点赞 |
| `/api/sparks/:id/visibility` | PUT | 切换公开/私密 |

### 5.3 房间相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/rooms/public` | GET | 公开房间列表 |
| `/api/rooms/:roomId` | GET | 房间详情 |
| `/api/rooms/:roomId/messages` | GET/POST | 房间消息 |
| `/api/rooms/:roomId/spectate` | POST | 观众加入 |

---

## 六、数据库模型速查

| 模型 | 关键字段 | 说明 |
|------|---------|------|
| `User` | id, name, username(@unique), email(@unique), password, level, image | 用户 |
| `Asset` | id, userId, title, content, hotScore, isPublic, sparkCount | 火花/对白资产 |
| `AssetLike` | id, assetId, userId, createdAt | 火花点赞记录 |
| `Room` | id, type, status, brainholeId, inviteCode(@unique) | 对白房间 |
| `RoomParticipant` | roomId, userId, identity, role, isOnline | 房间参与者 |
| `Brainhole` | id, title, scenario, category | 脑洞/话题 |

---

## 七、技术栈

| 技术 | 版本 |
|------|------|
| Next.js | 16.2.4 (Turbopack) |
| TypeScript | ~5.7 |
| Tailwind CSS | v4 |
| Prisma | 7.8.0 |
| next-auth | 4.24.14 |
| Socket.IO | ~4.x |

---

## 八、关键设计决策（v7.0-fix7）

### 8.1 登录页路由设计
| 项目 | 说明 |
|------|------|
| 主登录页 | `/`（根路径），内容页 |
| 别名 | `/login` → `redirect('/')` |
| 认证失败跳转 | `/login` |
| 退出后跳转 | `/login` |

### 8.2 消息去重架构
| 层级 | 机制 |
|------|------|
| 前端 useEffect | `removeAllListeners` + `useRef` 存储动态 user |
| 前端 handler | `senderId === stableUserId` 过滤 |
| 后端 socket | `socket.to(roomId)` 排除发送者 |

### 8.3 自动部署架构
```
本地 git push fqunxiang dev
  → Forgejo Webhook POST http://81.70.59.228/webhook
  → Nginx 80端口 /webhook → 本地 9000
  → webhook-server.js 接收 push 事件
  → deploy.sh: git pull fqunxiang dev → npm install → npm run build → pm2 restart
```

---

## 九、部署信息

- **服务器**：81.70.59.228（腾讯云 OpenCloudOS 9.4）
- **部署路径**：`/www/wwwroot/qunxiang-xinghuo`
- **PM2**：`qunxiang-xinghuo`
- **数据库**：SQLite (`prisma/dev.db`)
- **Git 分支**：`dev`
- **Webhook 地址**：`http://81.70.59.228/webhook`

---

> 文档位置：`docs/qunxiangxinhuo-TDD-v8.0.md`  
> 最后更新：2026-05-06 v8.0-login-fix 登录守卫系统全面修复完成 ✅

---

## 十、v8.0 登录系统强制守卫修复

### 10.1 问题描述
**核心问题**：`useSession()` loading 状态期间（200-500ms），AppShell 仅在 `useEffect` 中做重定向，组件渲染层面未阻止 `children` 渲染，导致受保护页面内容在守卫完成前短暂闪现（"守卫窗口期"）。

### 10.2 修复方案（多层防御）

#### Layer 1: Edge 中间件 (`middleware.ts`)
- 已覆盖所有页面路由 matcher
- 未登录访问非公开页 → `/login`
- 已登录访问公开页 → `/home`

#### Layer 2: 布局渲染级守卫 (`AppShell.tsx`) — 核心修复
```tsx
// session 加载中 + 非公开页面 → 返回空白屏（不渲染 children，不渲染 BottomNav）
if (sessionStatus === 'loading' && !isPublicPage) {
  return <BlankScreen />;
}
// session 已确认未登录 + 非公开页面 → 返回空白屏（等待跳转完成）
if (sessionStatus === 'unauthenticated' && !isPublicPage) {
  return <BlankScreen />;
}
```

#### Layer 3: 页面级门禁 (`useRequireAuth` hook)
- 新文件：`src/hooks/useRequireAuth.ts`
- 在核心受保护页面顶部调用：未登录时返回空白页
- 已应用页面：`/home`, `/library`, `/profile`, `/settings`

#### Layer 4: 底部导航栏 (`BottomNav.tsx`)
- 最顶部检查：`pathname === '/' || pathname === '/login'` → `return null`
- `status === 'loading'` → `return null`
- `status === 'unauthenticated'` → `return null`

### 10.3 服务器端 Token 失效

#### 数据库变更
- `User` 模型新增 `tokenRevokedAt DateTime?`

#### 登出流程 (`/api/auth/logout`)
1. 客户端调用 `POST /api/auth/logout` → 后端更新 `tokenRevokedAt = now()`
2. 清除 localStorage / sessionStorage
3. `signOut({ redirect: false })` 清除 cookie
4. `window.location.replace('/login')` 硬刷新

#### Token 撤销检查 (`/api/users/me`)
```tsx
if (dbUser?.tokenRevokedAt) {
  const tokenIatMs = token.iat ? token.iat * 1000 : 0;
  if (tokenIatMs < dbUser.tokenRevokedAt.getTime()) {
    return 401 Unauthorized;
  }
}
```

### 10.4 修复文件清单
| 文件 | 变更 |
|------|------|
| `src/components/layout/AppShell.tsx` | 渲染级门禁守卫（核心） |
| `src/components/layout/BottomNav.tsx` | `/login` 最优先检查 |
| `src/hooks/useRequireAuth.ts` | 新建：统一认证门禁 hook |
| `src/app/home/page.tsx` | 页面级门禁 |
| `src/app/library/page.tsx` | 页面级门禁 |
| `src/app/profile/page.tsx` | 页面级门禁 + 登出流程增强 |
| `src/app/settings/page.tsx` | 页面级门禁 |
| `src/app/spectate/page.tsx` | 服务端守卫 + PPR 缓存防护 |
| `src/app/spectate/SpectateClient.tsx` | useRequireAuth 门禁 |
| `src/app/api/auth/logout/route.ts` | 新建：服务器端登出 API |
| `src/app/api/users/me/route.ts` | Token 撤销检查 |
| `src/lib/auth-utils.ts` | 新建：Token 撤销辅助函数 |
| `prisma/schema.prisma` | `User.tokenRevokedAt` |
| `middleware.ts` | Cache-Control: no-store 头 + 调试日志 |
| `next.config.ts` | /spectate 路由禁用缓存 headers |
| `scripts/deploy.sh` | rm -rf .next + nginx stop/start + 清除缓存目录 |

### 10.5 关键发现：Invoke-WebRequest Cookie 陷阱
**测试过程中发现：PowerShell `Invoke-WebRequest` 会自动保持 session cookie！**
- 前期测试中 `/spectate` 返回 200，误以为有缓存 bug
- 实际原因：之前的 `/api/auth/logout` 请求在服务器端设置了 cookie，`Invoke-WebRequest` 在后续请求中自动携带
- **解决方案**：使用 .NET `HttpWebRequest`（全新 `CookieContainer`）进行无 cookie 测试
- 真实未登录场景测试全部通过 ✅

### 10.6 验证结果
- **构建状态**：✅ 66 pages + 所有 API routes 全部通过
- **服务器测试（无 cookie）**：
  - `/home` → 307 `/login` ✅
  - `/library` → 307 `/login` ✅
  - `/profile` → 307 `/login` ✅
  - `/settings` → 307 `/login` ✅
  - `/spectate` → 307 `/login` ✅
  - `/spectate/abc123` → 307 `/login` ✅
  - `/solo-match` → 307 `/login` ✅
  - `/duo-match` → 307 `/login` ✅
  - `/healing` → 307 `/login` ✅
  - `/story-hall` → 307 `/login` ✅
  - `/identity` → 307 `/login` ✅
  - `/feedback` → 307 `/login` ✅
  - `/zhihu-search` → 307 `/login` ✅
  - `/match` → 307 `/login` ✅
  - `/messages` → 307 `/login` ✅
  - `/` → 200 ✅
  - `/login` → 200 ✅
  - `/register` → 200 ✅
- **API 测试**：
  - `/api/users/me` 无 cookie → 401 ✅
  - `/api/auth/logout` POST → 200 ✅
- **直接端口测试（:3000）**：所有受保护页面 307 → `/login` ✅

---

## 十一、TOP3 火花墙改造（v8.0-spark-wall）

### 11.1 功能描述
发现页 `/home` 的"今日最热 TOP3"从脑洞排行榜改为**已完结对白的火花排行榜**。

### 11.2 数据流
```
发现页 /home
  → fetch /api/sparks/top?limit=3
    → Asset.findMany({ isPublic: true, orderBy: hotScore desc })
      → 关联 brainhole（标题、分类）
      → 关联 room（参与者身份、消息预览）
    → 返回 TOP3 火花数据
  → 点击卡片 → /spark-detail/:id
    → fetch /api/sparks/:id
      → Asset + Room（完整消息记录）
    → SparkDetailClient 微信聊天风格展示
```

### 11.3 API 路由
| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/sparks/top` | GET | TOP3 火花排行榜（query: limit=3） |
| `/api/sparks/:id` | GET | 火花详情 + 关联房间完整对白 |

### 11.4 页面路由
| 路由 | 功能 |
|------|------|
| `/home` | 发现页，展示 TOP3 火花排行榜 |
| `/spark-detail/:id` | 火花详情，微信聊天风格展示完整对白 |

### 11.5 改造文件清单
```
modified:   middleware.ts                          # 添加 /spark-detail 路由保护
modified:   src/app/home/page.tsx                  # TOP3 改为火花排行榜
new file:   src/app/api/sparks/top/route.ts        # TOP3 火花 API
new file:   src/app/api/sparks/[id]/route.ts       # 火花详情 API
new file:   src/app/spark-detail/[id]/page.tsx     # 火花详情服务端入口
new file:   src/app/spark-detail/[id]/SparkDetailClient.tsx  # 微信聊天风格展示
```


---

## 十二、v8.1 四大改造

### 12.1 TOP3 极简列表改造

**改动**：
- 发现页 `/home` 的 TOP3 从复杂卡片改为**极简文字列表**
- 显示：排名 + 脑洞标题 + 参与者身份对 + 火花数
- 点击跳转从 `/spark-detail/:id` 改为 `/room/:roomId`

**文件**：`src/app/home/page.tsx`

---

### 12.2 对白详情页 `/room/[id]` 只读改造

**改动**：
- 移除实时聊天、WebSocket、输入框、AI 催化、结束按钮
- 改为只读模式，从 `/api/rooms/:id` 加载历史消息
- 微信聊天风格气泡，左右交替排列
- **火花消息**：金色边框 `border-[#e2b04a]/40` + 发光 `shadow-[0_0_12px_rgba(226,176,74,0.12)]`
- **评论区**：
  - GET `/api/room-comments?roomId=xxx` — 加载评论列表
  - POST `/api/room-comments` — 创建评论（需登录）
  - DELETE `/api/room-comments/:id` — 删除自己的评论

**文件**：
- `src/app/room/[id]/page.tsx`
- `src/app/api/room-comments/route.ts`
- `src/app/api/room-comments/[id]/route.ts`

**Prisma**：
- 新增 `RoomComment` 模型
- `Room.comments` / `User.roomComments` 双向关系

---

### 12.3 火花页职业分类

**改动**：
- `/library` 增加横向滚动标签栏
- 分类：全部 / 医疗 / 法律 / 教育 / 服务 / 技术 / 生活
- API `/api/sparks/public` 增加 `?category=xxx` 筛选参数

**文件**：
- `src/app/library/page.tsx`
- `src/app/api/sparks/public/route.ts`

---

### 12.4 全局 Flame 图标替换

**改动**：
- 所有 `Heart` / `ThumbsUp` 替换为 `lucide-react` 的 `Flame`
- 已赞：金色 `#e2b04a` + `fill-current` + `drop-shadow` 发光
- 未赞：灰色

**涉及文件**（15个）：
- `src/app/home/page.tsx`
- `src/app/library/page.tsx`
- `src/app/healing/page.tsx`
- `src/app/healing/session/[id]/page.tsx`
- `src/app/spectate/[roomId]/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/room/[id]/page.tsx`
- `src/components/bubble-cloud/BubbleDetailModal.tsx`
- `src/components/match/MatchCard.tsx`
- `src/components/home/ModeDock.tsx`
- `src/components/story/CreateStoryModal.tsx`

---

### 12.5 v8.1b 补充改造

#### 12.5.1 多人组队愿景介绍页

**改动**：
- `src/app/multiplayer/page.tsx` 完全重写为愿景介绍页
- 无按钮，纯文字介绍多人即兴碰撞的玩法和愿景
- 包含：场景想象（急诊室）、玩法四步、四个价值点
- 底部"🚧 功能开发中"

#### 12.5.2 "人机交互模式"改名

**改动**：
- `src/app/home/page.tsx`：模式卡片标题 "人机交互模式" → "和刘看山对话"
- `src/app/solo-match/page.tsx`：TopBar 标题 "人机模式" → "和刘看山对话"

---

## 十三、构建验证记录

| 版本 | 日期 | 构建结果 | 页面数 |
|------|------|----------|--------|
| v8.0 | 2026-05-06 | ✅ 通过 | 68/68 |
| v8.1 | 2026-05-06 | ✅ 通过 | 68/68 |
| v8.1b | 2026-05-06 | ✅ 通过 | 68/68 |


---

## 十四、v8.0 故事系统完整开发

### 14.1 设计理念

**叙事性轨迹 + AI兜底**

| 角色 | 能看到 | 看不到 |
|------|--------|--------|
| 角色A | 自己的身份、开场信息 | 角色B的信息、完整故事线 |
| 角色B | 自己的身份、开场信息 | 角色A的信息、完整故事线 |
| AI刘看山 | 完整故事线（起承转合） | — |

**四格解密结构**：起→承→转→合，用户只解锁「起」，承转合在对话中逐步揭示。

**AI兜底**：15秒未匹配到真人→弹窗询问是否和刘看山玩。

### 14.2 数据库设计

扩展现有 `Story` / `StoryRole` / `Room` 模型：

| 模型 | 新增字段 | 说明 |
|------|----------|------|
| Story | `eraBackground`, `storySummary`, `act1Reveal`~`act4Truth`, `maxCharacters`, `hotScore`, `creatorId` | 解密故事内容 |
| StoryRole | `openingInfo`, `sortOrder` | 角色开场信息 |
| Room | `storyId`, `isAiRoom` | 关联故事、AI房间标记 |
| User | `createdStories` | 创建的故事关系 |

### 14.3 种子数据（5个太仓解密故事）

1. 最后的起锚地 — 明永乐三年，郑和下西洋前夜
2. 天妃宫的不速之客 — 明洪武三十一年，朱元璋驾崩前夜
3. 丝竹世家的最后一曲 — 1937年，日军逼近苏州
4. 麻将的秘密 — 1937年，南京沦陷后
5. 牛郎织女降生地 — 2026年，西工大

### 14.4 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/stories` | GET | 故事列表（标题、时代背景、简介、角色数） |
| `/api/stories/[storyId]` | GET | 故事详情 + 角色列表 + openingInfo |
| `/api/stories/[storyId]/join` | POST | 选角色加入，匹配或等待 |
| `/api/stories/[storyId]/join-ai` | POST | 创建AI房间，刘看山扮演另一角色 |
| `/api/stories/[storyId]/catalyst` | GET | 按消息数返回对应阶段催化提示 |
| `/api/stories/mine` | GET | `?type=created` / `?type=participated` |

### 14.5 前端页面

| 路由 | 功能 |
|------|------|
| `/story-hall` | 故事大厅：故事卡片列表 + 长期连载入口 |
| `/story/[id]` | 故事详情：时代背景、简介、起（解锁）、承转合（锁住）、角色选择、等待匹配弹窗、AI兜底弹窗 |
| `/room/[id]` | 对白室：顶部故事标题+时代背景+角色名、openingInfo提示、AI催化提示、实时聊天/只读模式切换、评论区 |
| `/my-stories` | 我的故事：我参与的 / 我发起的 |
| `/story-hall/long-term` | 长期连载愿景介绍页 |

### 14.6 Room 页面模式切换

| 房间状态 | 模式 | 功能 |
|----------|------|------|
| `active` | 实时聊天 | WebSocket、输入框、AI催化、AI房间自动回复 |
| `closed` | 只读浏览 | 消息列表、评论区（GET/POST/DELETE） |

### 14.7 文件变更清单

```
modified:   prisma/schema.prisma                 # Story/StoryRole/Room 扩展
new file:   prisma/seed-stories.ts               # 5个太仓解密故事种子
modified:   src/lib/db.ts                        # 默认数据库路径修正
modified:   src/server/room-manager.ts           # 添加 story include
modified:   src/app/home/page.tsx                # 入口改为「故事大厅」「和刘看山对话」
new file:   src/app/story-hall/page.tsx          # 故事大厅
new file:   src/app/story-hall/long-term/page.tsx # 长期连载愿景页
new file:   src/app/story/[id]/page.tsx          # 故事详情+角色选择+弹窗
new file:   src/app/my-stories/page.tsx          # 我的故事
modified:   src/app/room/[id]/page.tsx           # 支持故事系统+实时/只读双模式
modified:   src/app/api/stories/[storyId]/route.ts # 合并解密故事字段
new file:   src/app/api/stories/[storyId]/join/route.ts
new file:   src/app/api/stories/[storyId]/join-ai/route.ts
new file:   src/app/api/stories/[storyId]/catalyst/route.ts
```

### 14.8 构建验证

| 版本 | 日期 | 结果 | 页面数 |
|------|------|------|--------|
| v8.0 story | 2026-05-06 | ✅ 通过 | 70/70 |

---

## 十五、已知问题与注意事项

1. **Prisma db push 路径问题**：`src/lib/db.ts` 默认路径原为 `file:./prisma/dev.db`（空文件），已修正为 `file:./dev.db`
2. **路由冲突**：`/api/stories/[id]` 与 `/api/stories/[storyId]` 冲突，已合并到 `[storyId]` 下
3. **生产环境 migrate deploy P3005**：数据库未 baseline，需使用 `prisma db push`
4. **SSH 自动部署失败**：服务器端口 2222 超时 / 22 权限拒绝，需手动部署


---

## 十六、v8.0 故事系统代码审查修复（2026-05-06 追加）

### 16.1 审查背景
在 v8.0 故事系统开发完成后，进行了资深测试工程师 + 资深技术员的全面代码审查，发现并修复了 **20+ 个代码审查问题**，涵盖竞态条件、内存泄漏、数据一致性、权限控制等。

### 16.2 修复问题清单

#### API 层修复（5 个关键问题）

| # | 文件 | 问题 | 修复方案 | 严重程度 |
|---|------|------|---------|---------|
| 1 | `rooms/[roomId]/finish` | 重复调用 finish 会因 Asset.roomId @unique 约束崩溃 | 添加幂等检查：`status==='closed'` 时直接返回已有 assetId；使用 `$transaction` 原子执行 update+create | 🔴 Critical |
| 2 | `rooms/[roomId]/finish` | 观众(spectator)可触发结束 | 添加 `me.role === 'spectator'` 拒绝 | 🟡 Warning |
| 3 | `stories/[storyId]/join` | role claim 竞态条件：两个请求同时检查 `claimedBy===null`，都通过，后一个覆盖前一个 | 使用乐观锁：`update({ where: { id: roleId, claimedBy: null } })`，P2025 时返回 409 | 🔴 Critical |
| 4 | `stories/[storyId]/join` | 未检查用户是否已在该故事活跃房间中，可重复创建 | 先查 `roomParticipant` where `room.storyId=xxx AND status=active` | 🔴 Critical |
| 5 | `stories/[storyId]/join` | 匹配时可能重复创建房间（两个用户同时触发） | 创建房间前先查 `participants.every` 是否已有配对房间 | 🔴 Critical |
| 6 | `stories/[storyId]/catalyst` | 不验证 room 是否属于 story，可传入任意 roomId | 添加 `db.room.findFirst({ where: { id: roomId, storyId } })` | 🔴 Critical |
| 7 | `stories/[storyId]/join-ai` | 可无限创建 AI 房间 | 添加检查：该用户在该故事是否已有活跃 AI 房间 | 🔴 Critical |
| 8 | `stories/[storyId]/join` | 未验证 story 状态（closed/completed 仍可加入） | 添加 `story.status` 检查 | 🟡 Warning |

#### 前端层修复（5 个关键问题）

| # | 文件 | 问题 | 修复方案 | 严重程度 |
|---|------|------|---------|---------|
| 9 | `room/[id]/page.tsx` | AI 催化 `setTimeout` 未清理，组件卸载后 setState 警告 | `useRef` 存储 timeout ID，effect cleanup 中 `clearTimeout` | 🔴 Critical |
| 10 | `room/[id]/page.tsx` | `removeAllListeners('new-message')` 清除全局 socket 的所有监听器 | 改为 `off('new-message', handleNewMessage)` 只移除当前 handler | 🔴 Critical |
| 11 | `room/[id]/page.tsx` | Socket `joinRoom` 在 `myRoleName` 从空到值时触发两次 | 添加 `hasJoinedRef` + `!myRoleName` 提前 return | 🔴 Critical |
| 12 | `room/[id]/page.tsx` | `msg.userId.startsWith('agent_')` 可能 crash（null/undefined） | 改为 `msg.userId?.startsWith('agent_') &#124;&#124; false` | 🔴 Critical |
| 13 | `story/[id]/page.tsx` | 轮询 POST `/join` 每3秒调用，有副作用（重复 claim/创建） | 添加 `pollInProgress` ref 防并发 | 🔴 Critical |
| 14 | `room/[id]/page.tsx` | 房间 fetch 无 AbortController，快速切换房间时数据错乱 | 添加 `AbortController`，cleanup 中 abort | 🟡 Warning |
| 15 | `room/[id]/page.tsx` | `useCallback` deps 不完整（`sendMessage` 未包含） | 补全依赖数组 | 🟡 Warning |

#### v8.0 初始 20 个问题（用户确认的设计决策后修复）

| # | 问题 | 状态 |
|---|------|------|
| 1 | 房间无结束机制 | ✅ 添加 🏁 结束对白按钮 + `/api/rooms/{id}/finish` |
| 2 | 匹配后用户A不知道 | ✅ 轮询自动检测 matched 状态 |
| 3 | 催化剂调用过于频繁 | ✅ `catalystCalledRef` Set 防重复 |
| 4 | AI房间开场冲突 | ✅ `isAiRoom &#124;&#124; type==='story_ai'` 双重判断 |
| 5 | 无「我的故事」入口 | ✅ `/home` 发现页添加快捷入口 |
| 6 | 等待弹窗无关闭/返回 | ✅ 添加 ❌ 关闭、↩ 返回选角色按钮 |
| 7 | 等待状态丢失 | ✅ 轮询自动恢复 |
| 8 | 旧角色claim未清理 | ✅ join API 清理旧记录 |
| 9 | Room API权限403 | ✅ finish API 兼容 storyId 场景 |
| 10 | 无揭晓谜底按钮 | ✅ 结束按钮确认后揭晓起承转合 |
| 11 | 只读不显示四格 | ✅ room page 展示四格 + 评论区 |
| 12 | 角色选择无loading | ✅ 添加 loading 状态 |
| 13 | isAi判断不严谨 | ✅ 双重校验 |

### 16.3 设计决策确认（7项）

1. **故事大厅样式**：列表式（保持现有）
2. **结束按钮位置**：输入区上方「🏁 结束对白」
3. **揭晓时机**：手动点击后一次性揭晓起承转合
4. **只读模式**：完整四格 + 对白记录 + 评论区
5. **等待弹窗**：新增「❌ 关闭」「返回选角色」
6. **超时后**：「和刘看山玩」「继续等待」「返回选角色」
7. **我的故事入口**：`/home` 发现页

### 16.4 文件变更清单（本次修复）

```
modified:   src/app/api/rooms/[roomId]/finish/route.ts      # 幂等+事务+权限
modified:   src/app/api/stories/[storyId]/join/route.ts     # 乐观锁+防重复房间
modified:   src/app/api/stories/[storyId]/join-ai/route.ts  # 防重复AI房间
modified:   src/app/api/stories/[storyId]/catalyst/route.ts # room-story验证
modified:   src/app/room/[id]/page.tsx                      # 内存泄漏+socket+防御
modified:   src/app/story/[id]/page.tsx                     # 轮询防并发
```

### 16.5 构建验证

| 版本 | 日期 | 构建结果 | 页面数 |
|------|------|----------|--------|
| v8.0 story-fix | 2026-05-06 | ✅ 通过 | 70/70 |

---

> 文档位置：`docs/qunxiangxinhuo-TDD-v8.0.md`  
> 最后更新：2026-05-06 v8.0 故事系统代码审查修复完成 ✅


---

## 十七、v8.0 故事系统 UX 优化（2026-05-06 追加）

### 17.1 优化背景
基于资深产品交互设计师的全方位体验走查，对故事系统进行 7 项 UX 优化，覆盖「降低决策成本」「减少信息过载」「提升叙事沉浸感」「增强容错能力」四个维度。

### 17.2 优化清单

| # | 优化项 | 目标 | 实现方案 | 文件 |
|---|--------|------|---------|------|
| 1 | openingInfo 自动折叠 | 减少信息过载 | 30秒后自动折叠为「📋 查看开场信息」小按钮，点击展开 | `room/[id]/page.tsx` |
| 2 | 结束对白确认卡片 | 替代生硬 confirm | 内嵌柔和确认卡片：「真的要揭晓谜底了吗？」+「再聊一会」「揭晓谜底」双按钮 | `room/[id]/page.tsx` |
| 3 | 揭晓谜底后「再来一局」 | 降低流失率 | TruthModal 底部增加「🎭 再来一局」按钮，跳转 /story-hall | `room/[id]/page.tsx` |
| 4 | AI 房间使用故事上下文 | 提升沉浸感 | generateAIReply 构建 system prompt 包含：角色名、openingInfo、act1-4Reveal，让 AI 扮演知情角色 | `room/[id]/page.tsx` |
| 5 | 🎲 随机分配角色 | 降低决策成本 | 角色列表顶部增加「随机分配」按钮，从未被选角色中随机选一个 | `story/[id]/page.tsx` |
| 6 | 角色详情展开 | 帮助决策 | 每个角色卡片增加 ChevronDown 展开按钮，显示 description | `story/[id]/page.tsx` |
| 7 | 等待时间缩短 | 减少焦虑感 | 15秒 → 10秒，AI 兜底体验本身很好，不需要让用户等太久 | `story/[id]/page.tsx` |
| 8 | 故事大厅空状态 | 避免空白迷茫 | stories 为空时显示「还没有解密故事」+ 引导去长期连载 | `story-hall/page.tsx` |
| 9 | Error Boundary | 防止白屏崩溃 | AppShell 包裹 ErrorBoundary，渲染错误时显示「刷新页面」按钮 | `AppShell.tsx` |

### 17.3 文件变更清单

```
modified:   src/app/room/[id]/page.tsx           # 折叠+确认卡片+再来一局+AI context
modified:   src/app/story/[id]/page.tsx           # 随机角色+详情展开+10秒等待
modified:   src/app/story-hall/page.tsx           # 空状态引导
modified:   src/components/layout/AppShell.tsx    # Error Boundary
```

### 17.4 构建验证

| 版本 | 日期 | 构建结果 | 页面数 |
|------|------|----------|--------|
| v8.0-ux | 2026-05-06 | ✅ 通过 | 70/70 |

---

> 文档位置：`docs/qunxiangxinhuo-TDD-v8.0.md`  
> 最后更新：2026-05-06 v8.0 故事系统 UX 优化完成 ✅
