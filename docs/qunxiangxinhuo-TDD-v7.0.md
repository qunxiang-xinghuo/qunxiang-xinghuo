# 群像·星火 (Qunxiang Xinghuo) 产品需求文档 — v7.0 完整版

**项目名称：** 群像·星火  
**版本：** v7.0（完整功能版 · 累计 v6.0~v6.4 + v7.0 重构）  
**日期：** 2026年5月5日  
**状态：** 已开发完成，已部署 ✅  
**部署地址：** http://81.70.59.228:3000

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

---

## 二、登录流程与页面权限设计

### 2.1 首页（第一屏）必须是登录页
用户打开网站后，看到的第一个页面必须是登录页面。

登录页特性：
- **绝对不出现底部导航栏**（发现/火花/故事/我的）。导航栏只在登录成功后显示。
- 登录页顶部显示"群像·星火"大字标题。
- 提供用户名和密码输入框，以及登录按钮。
- 底部有一行小字："没有账号？去注册"，点击后跳转到注册页面。

### 2.2 全局路由守卫
**未登录状态**：当用户没有登录时，访问网站的任何页面（包括发现页、火花页、故事页、我的页面），都必须被强制重定向到登录页。

**已登录状态**：登录成功后，自动跳转到发现页。如果用户已经登录，再次打开网站时，自动跳过登录页，直接进入发现页。

**导航栏控制**：只有在用户登录成功后，底部导航栏（发现、火花、故事、我的）才显示。未登录状态下，导航栏绝对不能出现。

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
- **最新火花展示**：顶部 2x2 网格（始终最新）
- **排序切换**：最新 / 最热
  - 最新：按 `createdAt` 降序（默认）
  - 最热：按 `hotScore`（点赞数）降序
- **火花卡片**：
  - 脑洞标题 + 内容摘要
  - 作者身份 + 发布日期
  - 🔥 点赞按钮（**Flame 火花图标**）+ 热度数字
  - 已点赞状态显示红色点亮图标（实心 Flame）
  - 不能给自己的火花点赞（自己的只显示热度数字）
  - 点击卡片可跳转到对白室详情
- **注意**：个人火花管理已移至【我的】页面内

### 3.4 故事大厅（/story-hall）
- 快速匹配、长期连载、我发起的、其他人的
- 故事房间：导演控制、角色认领、分支投票

### 3.5 我的页（/profile）
- **居中布局**：头像（48px圆形）+ 用户名水平对齐
- 统计数据：火花数、故事数、匹配数
- 功能菜单：
  - 我的收益
  - 个人疗愈
  - **我的火花** → 跳转到 `/profile/sparks`
  - 我的故事
  - 设置
- 退出登录

### 3.6 我的火花页（/profile/sparks）【新增】
- **归属位置**：个人火花的管理入口，完全移动至【我的】页面内
- **展示内容**：展示当前用户自己所有的对白记录（无论是否公开）
- **排序切换**：最新 / 最热
- **公开控制**：每条对白记录旁边，提供一个"公开/私密"切换开关。打开开关后，该条火花会立刻同步到公共火花墙
- **点击详情**：点击火花可跳转到对白室详情

### 3.7 设置页（/settings）
- **顶部头像**：点击更换（Multer上传，保存到 public/avatars/）
- **功能列表**：
  - 修改用户名 → 独立弹窗，PATCH /api/users/profile，唯一性检查
  - 修改密码 → 独立弹窗，旧密码+新密码+确认密码

### 3.8 观看模式（/spectate）
- **公开房间列表**：显示标题/身份标签/在线人数
- **围观房间**（/spectate/[roomId]）：
  - 纯观众视角，只读消息流
  - 顶部 👁 在线人数（静默更新）
  - ❤️ 点赞按钮
  - 上下滑动切换房间

---

## 四、核心功能详述

### 4.1 认证系统（v6.3-fix2/fix3）

**三层守卫架构：**
```
边缘层: middleware.ts → JWT token 验证
  ↓
布局层: AppShell.tsx → useSession() + localStorage 双重检查
  ↓
组件层: useAuth.ts → session 优先，失效时清除 localStorage
```

**关键规则：**
- 未登录用户只能访问 `/` 和 `/register`
- 已登录用户访问 `/` 或 `/register` → 重定向到 `/home`
- JWT `maxAge` = 24 小时（避免长期会话残留）
- session 失效时**无条件清除** `xh_user` + `xh_identity` + `xh_user_id`
- 登录成功后从 `/api/users/me` 获取**真实用户数据**

### 4.2 火花点赞系统（v6.4 + v7.0）

**数据模型：**
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

**点赞规则：**
- **图标**：使用 **Flame（火花）** 图标，不使用 Heart（心形）
- 不能给自己的火花点赞（后端校验 `asset.userId !== currentUserId`）
- 已点赞则取消，未点赞则点赞（toggle）
- 热度值 `hotScore` = 点赞数量
- 事务操作：创建/删除 AssetLike + 更新 Asset.hotScore
- 已点赞状态：Flame 图标变红且实心（`fill-current`）
- 未点赞状态：Flame 图标灰色空心

**接口：**
- `POST /api/sparks/:id/like` — 点赞/取消点赞
- `GET /api/sparks/public?sort=latest|hottest` — 公开火花（支持排序）
- `GET /api/sparks/mine?sort=latest|hottest` — 我的火花（支持排序）

### 4.3 对白室（/room/[id]）

- 微信聊天风格消息气泡
- AI 动态催化：30秒刷新，基于上下文生成问题
- 火花标记：点击 Flame 按钮标记为火花
- 观众模式：spectator 角色，只读+点赞
- 在线人数显示（👁 静默更新）

### 4.4 AI 催化系统

- **双 API**：DeepSeek + 知乎直答
- **30秒刷新**：基于最近6条对话生成催化问题
- **多Agent轮流回复**：支持多个 AI 角色依次发言

---

## 五、API 路由总览

### 5.1 认证相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 登录/会话 |
| `/api/auth/register` | POST | 用户注册（自动登录） |
| `/api/users/me` | GET | 获取当前用户信息 |
| `/api/users/profile` | PATCH | 修改用户名（唯一性检查） |
| `/api/users/avatar` | POST | 上传头像（Multer multipart） |
| `/api/users/password` | PUT | 修改密码（bcrypt） |

### 5.2 火花相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/sparks/public` | GET | 公开火花墙（sort=latest\|hottest） |
| `/api/sparks/mine` | GET | 我的火花（sort=latest\|hottest） |
| `/api/sparks/:id/like` | POST | 点赞/取消点赞 |
| `/api/sparks/:id/visibility` | PUT | 切换公开/私密 |

### 5.3 房间相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/rooms/public` | GET | 公开房间列表（观看模式） |
| `/api/rooms/:roomId/spectate` | POST | 以观众身份加入房间 |
| `/api/rooms/:roomId/messages` | GET/POST | 房间消息 |
| `/api/rooms/invite` | POST | 创建邀请码 |
| `/api/rooms/join` | POST | 通过邀请码加入 |

### 5.4 故事相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/stories` | GET/POST | 故事列表/创建 |
| `/api/stories/:storyId` | GET | 故事详情 |
| `/api/stories/:storyId/start` | POST | 启动故事 |
| `/api/stories/:storyId/roles/:roleId/claim` | POST | 认领角色 |

### 5.5 AI 相关
| API | 方法 | 说明 |
|-----|------|------|
| `/api/ai/chat` | POST | AI 对话 |
| `/api/ai/catalyst` | POST | AI 动态催化问题 |
| `/api/ai/story-weave` | POST | 故事编织 |

---

## 六、数据库模型速查

### 6.1 核心模型
| 模型 | 关键字段 | 说明 |
|------|---------|------|
| `User` | id, name, username(@unique), email(@unique), password, level, image | 用户 |
| `Asset` | id, userId, title, content, hotScore, isPublic, sparkCount | 火花/对白资产 |
| `AssetLike` | id, assetId, userId, createdAt | 火花点赞记录 |
| `Room` | id, type, status, brainholeId, inviteCode(@unique) | 对白房间 |
| `RoomParticipant` | roomId, userId, identity, role, isOnline | 房间参与者 |
| `Brainhole` | id, title, scenario, category | 脑洞/话题 |
| `Story` | id, title, worldview, conflict, status, directorId | 故事 |
| `HealingSession` | id, userId, title, encryptionKey | 疗愈会话 |

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
| react-swipeable | 7.0.2 |
| multer | ~2.x |

---

## 八、关键设计决策（v7.0）

### 8.1 火花墙架构调整
| 项目 | v6.4 | v7.0 |
|------|------|------|
| 公开火花墙 | `/library` Tab "公开火花" | `/library` 单一页面 |
| 个人火花 | `/library` Tab "我的火花" | `/profile/sparks` 独立页面 |
| 点赞图标 | Heart（心形） | Flame（火花） |
| 公开/私密切换 | library 页面内 | profile/sparks 页面内 |

### 8.2 页面路由
| 页面 | 路径 | 说明 |
|------|------|------|
| 公开火花墙 | `/library` | 展示所有公开火花，支持排序 |
| 我的火花 | `/profile/sparks` | 管理个人火花，支持排序+公开/私密切换 |

---

## 九、部署信息

- **服务器**：81.70.59.228（腾讯云 OpenCloudOS 9.4）
- **部署路径**：`/www/wwwroot/qunxiang-xinghuo`
- **PM2**：`qunxiang-xinghuo`
- **数据库**：SQLite (`prisma/dev.db`)
- **Git 分支**：`dev`

---

> 文档位置：`docs/qunxiangxinhuo-TDD-v7.0.md`
> 最后更新：2026-05-05 v7.0 火花墙重构完成 ✅
