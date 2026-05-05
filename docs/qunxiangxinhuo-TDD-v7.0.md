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

> 文档位置：`docs/qunxiangxinhuo-TDD-v7.0.md`  
> 最后更新：2026-05-05 v7.0-fix7 全部修复完成 ✅
