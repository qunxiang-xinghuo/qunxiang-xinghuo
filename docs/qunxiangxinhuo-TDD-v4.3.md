# 群像·星火 TDD v4.3 — 双人匹配流程重构 + 素材库系统

## 一、版本信息
- **版本**: v4.3
- **日期**: 2026-05-01
- **Git**: `67a4724` dev分支
- **服务器**: http://81.70.59.228/
- **PM2**: pid 1164612, status online

## 二、核心匹配流程重构

### 2.1 匹配逻辑（优先复用已有脑洞）

```
用户A通过泡泡选"深夜便利店" → 点击"进入脑洞创作"
    ↓
跳转 /duo-match?brainholeId=xxx
    ↓
选择身份 → 确认 → 创建匹配请求（带brainholeId）
    ↓
匹配引擎：优先寻找对方已有的brainholeId
    ↓
用户B直接点击【双人模式】→ 无brainholeId
    ↓
A与B匹配成功 → 使用A的"深夜便利店"作为话题
    ↓
等待页显示：当前话题"深夜便利店"
    ↓
进入对白实验室 → 顶部固定展示"深夜便利店"
```

### 2.2 匹配引擎改造（match-engine.ts）

| 改动 | 说明 |
|------|------|
| quick模式保存brainholeId | 无论是否quick，都保存用户传入的brainholeId |
| 优先使用对方脑洞 | `roomBrainholeId = matchedRequest.brainholeId \|\| brainholeId` |
| 双方无脑洞时随机 | 从approved脑洞中按hotScore排序随机抽取 |

### 2.3 前端流程

| 页面 | 改动 |
|------|------|
| BubbleDetailModal | 点击"进入脑洞创作"跳转 `/duo-match?brainholeId=xxx` |
| duo-match | 读取URL参数，传入匹配请求body |
| duo-waiting | 轮询 `/api/match/:matchId`，显示 `room.brainhole.title` |
| duo-timeout | 选择AI时随机抽取一个脑洞传入 |
| api/rooms/ai | 未传brainholeId时随机抽取approved脑洞 |
| room/[id] | 顶部固定展示当前brainhole标题和场景 |

## 三、素材库系统

### 3.1 数据库模型（Prisma）

```prisma
model Asset {
  id           String   @id @default(cuid())
  userId       String
  roomId       String?  @unique
  brainholeId  String?
  title        String
  summary      String?
  messageCount Int      @default(0)
  sparkCount   Int      @default(0)
  isPublic     Boolean  @default(false)
  createdAt    DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id])
  brainhole Brainhole? @relation(fields: [brainholeId], references: [id])
  room      Room?      @relation(fields: [roomId], references: [id])

  @@index([userId, createdAt])
  @@index([isPublic, createdAt])
}
```

### 3.2 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/assets` | GET | 获取当前用户的对白资产 |
| `/api/assets` | POST | 从房间创建对白资产（body: {roomId}） |
| `/api/assets/public` | GET | 获取广场素材（isPublic=true） |
| `/api/assets/:id/public` | PATCH | 切换资产公开/私有状态 |

### 3.3 素材库页面 `/library`

**我的素材标签：**
- 显示所有个人对白资产（按创建时间倒序）
- 每个资产卡片：标题、摘要、消息数、火花数
- 公开/私有切换按钮（锁图标）
- 公开后自动出现在广场素材

**广场素材标签：**
- 显示所有用户公开的资产
- 显示作者头像和名称
- 消息数和火花数统计

### 3.4 对白室保存功能

- 连接状态栏旁新增"存素材库"按钮
- 点击后调用 `POST /api/assets`（body: {roomId}）
- 保存成功后按钮变为"已保存"（绿色）
- 资产自动关联当前房间的brainhole和消息统计

## 四、自检结果

| 检查项 | 状态 |
|--------|------|
| `/` 登录页 | ✅ HTTP 200 |
| `/home` 发现页 | ✅ HTTP 200 |
| `/duo-match` 身份选择 | ✅ HTTP 200 |
| `/duo-waiting` 匹配等待 | ✅ HTTP 200 |
| `/duo-timeout` 超时选择 | ✅ HTTP 200 |
| `/library` 素材库 | ✅ HTTP 200 |
| 本地 Build | ✅ 44页通过 |
| 服务器 Build | ✅ 44页通过 |
| PM2 | ✅ online (pid 1164612) |
| Prisma db push | ✅ Asset模型同步成功 |

## 五、部署记录

### 5.1 修复：mkdir -p 创建方括号目录
- 问题：paramiko `sftp.mkdir` 不支持 `-p`，且方括号目录名 `src/app/api/assets/[id]` 创建失败
- 修复：部署脚本先通过 SSH `mkdir -p 'path'` 创建所有目录，再用 SFTP 上传文件

### 5.2 新增路由
- `ƒ /api/assets` — 个人资产CRUD
- `ƒ /api/assets/[id]/public` — 公开状态切换
- `ƒ /api/assets/public` — 广场素材列表

## 六、文件变更

```
M  prisma/schema.prisma              # 新增Asset模型 + User/Brainhole/Room反向关系
M  src/server/match-engine.ts        # quick模式保存brainholeId
M  src/app/duo-match/page.tsx        # 读取brainholeId URL参数
M  src/app/duo-waiting/page.tsx      # 显示匹配的brainhole标题
M  src/app/duo-timeout/page.tsx      # AI时随机抽取brainhole
M  src/app/api/match/[matchId]/route.ts  # 返回room+brainhole信息
M  src/app/api/rooms/ai/route.ts     # 未传brainholeId时随机抽取
M  src/app/room/[id]/page.tsx        # 添加"存素材库"按钮
M  src/app/library/page.tsx          # 改造为Asset素材库
A  src/app/api/assets/route.ts       # 个人资产GET/POST
A  src/app/api/assets/public/route.ts    # 广场素材GET
A  src/app/api/assets/[id]/public/route.ts  # 公开状态PATCH
```

## 七、已知问题记录

| 问题 | 修复方式 |
|------|---------|
| paramiko无法创建`[id]`目录 | SSH `mkdir -p` 替代 |
| `.next`缓存引用旧文件 | `rm -rf .next` |
| useSearchParams无Suspense | 拆分为page.tsx + Content.tsx |
| Prisma反向关系缺失 | User/Brainhole/Room添加`assets Asset[]` |
