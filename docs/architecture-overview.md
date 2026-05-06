# 群像·星火

> Generated: 2026-05-06

---

## 一、架构图

```
+-----------------------------------------------------------------------------+
| 群像·星火 系统架构                                                    |
+-----------------------------------------------------------------------------+
|  用户层                                                                |
|  [移动端] [Web端] [小程序-Future] [SSR旁观]                            |
+-----------------------------------------------------------------------------+
|                                 v                                            |
|  Next.js 16 App Router (SSR + SPA)                                  |
|  Pages -> React Components -> Hooks (useAuth/useSocket/useBrainhole..) |
+-----------------------------------------------------------------------------+
|                                 v                                            |
|  NextAuth.js (JWT) + 页面级守卫 AppShell.tsx                         |
+-----------------------------------------------------------------------------+
|                                 v                                            |
|  API Routes (30+ 端点)                                              |
|  /match | /rooms | /stories | /sparks | /brainholes | /ai | /zhihu       |
+-----------------------------------------------------------------------------+
|       +------------+         +------------------+     +-------------+         |
|       |MatchEngine| <----> | RoomManager      |     | AI.Catalyst |         |
|       | (server)  |         | (server)         |     | (server)   |         |
|       +------------+         +--------+---------+     +-------------+         |
|                                       |              |                         |
|                              Socket.io Handler (globalThis)                   |
+-----------------------------------------------------------------------------+
|                                 v                                            |
|  Prisma ORM + SQLite (better-sqlite3)                             |
+-----------------------------------------------------------------------------+
```

## 二、目录结构

### 页面路由 (src/app/)

| 路由 | 功能 |
|------|------|
| /login | 登录入口 (NextAuth) |
| /register | 用户注册 |
| /home | 主Tab: 发现主页+四大模式入口 |
| /match | 脑洞广场: 卡片滑动浏览 |
| /solo-match | 人机模式入口 |
| /brainhole/[id] | 脑洞详情+AI催化+语音反应 |
| /duo-match | 双人身份选择 |
| /duo-waiting | 双人匹配等待(15s) |
| /duo-timeout | 匹配超时选择 |
| /multiplayer | 多人组队介绍 |
| /multi-match | 快速组队 |
| /multi-waiting | 多人等待(60s三阶段降级) |
| /story-hall | 主Tab: 故事大厅 |
| /story-hall/[storyId] | 剧本详情+角色认领 |
| /story-hall/[storyId]/room | 群像对白室(导演控场) |
| /room/[id] | 核心对白室(双人/AI实时聊天) |
| /spark-detail/[id] | 火花详情(SSR) |
| /library | 主Tab: 火花墙 |
| /profile | 主Tab: 个人中心 |
| /spectate | 围观入口(SSR校验) |
| /spectate/[roomId] | 旁观房间 |
| /zhihu-ring | 知乎圈子(Agent发帖/评论) |
| /zhihu-search | 知乎搜索(站内/全网/热榜) |
| /zhihu-zhida | 知乎直答(AI问答) |
| /healing | 个人疗愈会话 |
| /healing/session/[id] | 私密对话(加密存储) |
| /settings | 设置页 |
| /earnings | 我的收益 |
| /roadshow | 路演介绍 |

### 组件 (src/components/) - 43个文件

| 模块 | 文件 | 功能 |
|------|------|------|
| layout | AppShell|BottomNav|TopBar|MobileContainer|PageHeader|LiuKanshan* | 全局布局+认证守卫+吉祥物 |
| brainhole | BrainholeCard|Stack|ScenarioReader|CollectionDrawer|TagFilter | 脑洞卡片滑动+收藏 |
| bubble-cloud | BubbleCloud|Bubble|DetailModal|Preview|types | 力导向泡泡云 |
| room | ChatRoom|MessageBubble|SparkWall|AIPromptBanner | 实时对白室 |
| story | CreateStoryModal|ClaimRoleModal | 剧本创建+角色认领 |
| match | DuoIdentityModal|MatchCard|SuccessModal|Timer | 双人匹配UI |
| identity | IdentityBadge|Selector|SetupModal | 身份标签管理 |
| reaction | ReactionInput|VoiceRecorder|ReactionList|SparkButton | 反应+语音录制 |
| library | SparkCollection|StoryCard|StoryWeaver | 火花收藏+故事卡片 |
| profile | LevelBadge|UserStats|PlaceholderEntry | 用户等级/统计 |
| zhihu | ZhihuHotBubbles | 知乎热榜气泡 |
| home | ModeDock | 首页模式入口 |

### Hooks (src/hooks/) - 7个

| Hook | 功能 |
|------|------|
| useAuth | 三层兜底认证(NextAuth->localStorage->匿名) |
| useBrainhole | 脑洞数据+降级mock |
| useCollection | 收藏CRUD |
| useReaction | 反应管理 |
| useSocket | Socket.io封装(joinRoom/sendMessage/markSpark..) |
| useVoiceRecorder | 语音录制(Web Speech API连续识别) |
| useRequireAuth | 认证门禁(未登录跳转/login) |

### 服务端 (src/server/)

| 文件 | 功能 |
|------|------|
| match-engine.ts | 4阶段匹配策略; 乐观锁; $transaction原子创建 |
| room-manager.ts | markSpark/sendMessage; 状态机 |
| socket-handler.ts | 7房间事件+7故事大厅事件; 静默更新在线人数 |
| io.ts | Socket.io全局单例(globalThis) |
| ai-catalyst.ts | 脑洞->分类->难度->提示词 |

### AI模块 (src/lib/ai/)

| 文件 | 功能 |
|------|------|
| story-weaver.ts | weaveStory()火花串联; generateBranchOptions()分支 |
| prompt-generator.ts | generatePromptFromContext(); 三级降级 |
| personas.ts | 刘看山4角色(catalyst/creative/healer/mediator) |
| fallback-prompts.ts | 本地提示词库(7分类x5条) |

### API Routes (src/app/api/) - 30+端点

| 分组 | 端点数 | 说明 |
|------|------|------|
| auth | 3 | 注册/登录/登出 |
| users | 5 | 用户信息/密码/头像/身份 |
| match | 2 | 创建/查询/取消匹配 |
| rooms | 15+ | 房间CRUD/观众/火花/投票/消息/灵感 |
| stories | 10+ | 故事CRUD/分支/角色/灵感/启动暂停 |
| sparks | 6 | 我的/公开/TOP/详情/点赞/可见性 |
| brainholes | 5 | 列表/详情/收藏/泡泡模式 |
| assets | 4 | 对白资产CRUD/公开 |
| ai | 4 | chat/prompt/catalyst/story-weave |
| zhihu | 8 | 发布/评论/点赞/搜索/热榜/直答 |
| reactions | 2 | 反应CRUD |
| healing | 3 | 会话CRUD/消息(加密) |
| library | 1 | 素材库汇总 |

## 三、数据库模型(17表)

| 表 | 说明 |
|------|------|
| User | 用户(name/email/username/level/sparkCount/tokenRevokedAt) |
| Account/Session | NextAuth OAuth |
| UserIdentity | 身份标签(verified) |
| Tag | 标签(category) |
| Brainhole | 脑洞(scenario/difficulty/hotScore/category/recencyBoost) |
| BrainholeTag/Collection | 脑洞-标签/收藏关联 |
| Reaction | 反应(content/identity/emotionTag/isSpark) |
| MatchRequest | 匹配(identity/status/matchedUserId) |
| Room | 房间(type/status/directorId/inviteCode) |
| RoomParticipant | 参与者(identity/role/isOnline) |
| RoomMessage | 消息(content/isSpark/isAiPrompt/isDirectorNote) |
| Vote/VoteOption/VoteCast | 投票系统 |
| InspirationItem | 灵感库 |
| HealingSession/HealingMessage | 疗愈(加密存储) |
| StoryDraft | 故事草稿 |
| Asset | 对白资产(title/content/sparkCount/hotScore) |
| AssetLike | 火花点赞 |
| Story/StoryRole/StoryChapter/StoryMessage | 多人剧本 |
| StoryInspiration/StoryBranch | 剧本灵感/分支 |

## 四、业务矛盾与改进空间

### 4.1 核心业务矛盾

1. **匹配体验 vs 等待焦虑**
   - 双人模式15s超时太短，用户等待体验差
   - 超时降级到AI的设计合理，但用户体验割裂
   - 多人模式60s三阶段降级流程复杂，用户困惑

2. **隐私 vs 社交展示**
   - 火花标记为公开，但Reaction表缺少isPublic字段，用户无法控制
   - HealingMessage加密存储，但机制是否足够安全未知
   - AssetLike的独处点赞记录是否应该公开?

3. **AI依赖 vs 可用性**
   - 所有核心功能(催化/串联/匹配)重度依赖DeepSeek API
   - 三级降级策略存在，但知乎直答作为降级链路过长
   - 没有离线模式，任何API失败都影响核心体验

4. **多人模式完成度低**
   - /story-hall/[storyId]/room页面存在，但功能不完整
   - 分支投票(BranchVoteData)已定义，但前端投票UI未找到
   - 导演控场(暂停/恢复/杀青)功能完整，但审核流程复杂

5. **数据模型不一致**
   - Asset和Reaction都存储对白内容，功能重叠
   - StoryDraft和Asset的关系不清晰(都有sourceRoomId)
   - Brainhole的hotScore字段存在，但bubble-cloud用的是Float，Asset用Int

### 4.2 技术债务

1. **Socket.io vs HTTP混用**
   - 消息发送用Socket.io广播，但创建消息用HTTP POST
   - 这导致两次网络请求(一次API，一次Socket广播)
   - 应该统一为Socket.io原生发送消息

2. **NextAuth v4 vs v5迁移?**
   - package.json用"next-auth": "^4.24.14"(v4)
   - 但最新是v5，有breaking changes
   - tokenRevokedAt字段是v8.0自创的临时方案，非标准做法

3. **Prisma生成代码位置**
   - src/generated/prisma/不是标准位置，应在node_modules或prisma/
   - 自定义client输出路径导致import路径复杂(@/generated/prisma)

4. **认证localStorage残留**
   - AppShell在unauthenticated时清除localStorage
   - 但useAuth仍用localStorage做兜底，数据不一致风险
   - 没有统一的auth状态管理方案

5. **测试217个通过但代码质量存疑**
   - 大量测试存在，但仍有上述业务矛盾
   - TDD覆盖了API层，但UI交互和WebSocket测试缺失

### 4.3 改进建议

| 优先级 | 问题 | 改进方案 |
|------|------|------|
| P0 | 匹配体验差 | 延长超时，增加匹配进度可视化 |
| P0 | Socket/HTTP混用 | 统一用Socket.io发送消息，移除HTTP消息POST |
| P0 | 多人模式UI不完整 | 补充分支投票UI，完善导演控场界面 |
| P1 | 认证数据不一致 | 移除localStorage兜底，统一使用NextAuth session |
| P1 | Reaction无隐私控制 | 添加isPublic字段，支持私密反应 |
| P1 | 知乎API密钥暴露 | zhihu-api.ts的HMAC密钥不应在前端代码 |
| P2 | Prisma生成路径 | 迁移到标准位置，清理@/generated路径 |
| P2 | NextAuth升级 | 评估v5迁移，标准化token撤销方案 |
| P2 | hotScore类型不一致 | 统一为Float，按统一公式计算 |
| P3 | 离线模式缺失 | 实现本地缓存+队列，API恢复后同步 |
| P3 | WebSocket重连 | 添加指数退避重连，心跳检测 |

## 五、用户使用流程图

### 5.1 四大模式总览流程

```
                               [未登录用户]
                                     |
                                     v
                              [/login 登录]
                                     |
                                     v
                                [已登录]
                                     |
              +-----------------+----------------+----------------+-----------------+
              |                 |                |                |
              v                 v                v                v
          [/home]           [/match]        [/duo-match]     [/story-hall]    [/spectate]
          发现主页          脑洞广场          双人身份          故事大厅          旁观入口
              |                 |                |                |
              v                 v                v                v
        [四大模式入口]    [滑动脑洞]      [duo-waiting]   [广场浏览/创建]  [旁观房间]
        +--+--+--+        +--+---+        +--+---+        +--+---+
        |AI|Duo|Multi|      |收藏|跳过|      |邀请|继续|      |快速|长期|
        +--+--+--+        +--+---+        +--+---+        +--+---+
          |   |              |   |              |   |              |   |
          v   v              |   |              v   v              |
     [solo-match]        |     [room/id]     [story-hall]       |
        |               [brainhole]      (双人)       /[storyId]
        |               /detail             |             /room
        v               |                    |
     [room/id]           v             [火花墙]     [群像对白室]
     (人机)     [AI催化+语音反应]              |         (导演控场)
                          |                        |
                          v                        |
                     [feedback]                      |
                          |                        |
              +--------+--------+--------+--------+--------+
                          |
                          v
                      [/library]
                      火花墙（公开列表）
                          |
                          v
                  [/spark-detail/id]
                  火花详情（SSR）
                          |
                          v
                      [/profile]
                      个人中心
```

### 5.2 双人模式详细流程

```
[用户A]--选择身份-->[duo-match]--发起匹配-->[duo-waiting]
                                                |
            +----------------+----------------+-----------------+
            |                |                |
            v                v                v
     [15s内匹配成功]  [超时]          [超时]
            |                |                |
            v                v                v
     [身份确认弹窗]  [duo-timeout]   [duo-timeout]
            |                |                |
            |                +----+----------+----+
            |                             |                |
            v                             v                v
     [room/id]              [与AI对话]      [继续搜索]
     (双人实时)           (人机模式)      (扩大匹配)
            |
            +--->[WebSocket实时消息]<--->[用户B]
            |
            v
     [标记火花]--->[spark-wall展示]
            |
            v
     [room/id]--->[完成]--->[library火花墙]
```

### 5.3 多人模式（故事大厅）详细流程

```
[导演]--创建故事-->[/story-hall]--->[填写剧本信息]--->[创建角色]
                                                        |
                                                        v
                                                   [等待参与者]
                                                        |
                            +-------------------------------+-------------------------------+
                            |                               |
                            v                               v
                    [用户认领角色]                  [其他用户认领]
                            |                               |
                            v                               v
                    [导演审核: approve/reject]
                            |
                            +-------批准所有角色后------->+
                                                        |
                                                        v
                                                   [导演启动]--->[/story-hall/[id]/room]
                                                        |
                                                        v
                                              [群像对白室]
                            +-------------+-------------+-------------+
                            |             |             |
                            v             v             v
                      [导演暂停]  [演员发言]  [AI催化]
                            |             |             |
                            v             v             v
                      [发起投票]--->[分支提案]--->[投票/导演裁决]
                                              (StoryBranch)
                                                        |
                                                        v
                                                  [灵感库]
                                                        |
                                                        v
                                                  [杀青]--->[火花墙]
```

### 5.4 知乎集成模块流程

```
                                [知乎圈子模块]
                                      |
                    +-------------+----------------+----------------+-------------+
                    |             |                |                |
                    v             v                v                v
            [/zhihu-ring]  [/zhihu-search]  [/zhihu-zhida]  [知乎热榜气泡]
             发帖评论          搜索              直答问答        (首页入口)
                    |             |                |
                    v             v                v
            [Agent发帖]--->[跨平台互动]--->[AI直答生成]
                    |
                    v
              [内容同步到火花墙?]
```

### 5.5 个人疗愈模块流程

```
                               [/healing]--->[选择话题]--->[开始私密对话]
                                                        |
                                                        v
                                              [刘看山·疗愈师]
                                                        |
                                                        v
                                    [用户发送消息]--->[加密存储]--->[AI回复]
                                                        |
                                                        v
                                             [对话结束后]
                                                        |
                                          +---+------------+---+
                                          |                   |
                                          v                   v
                                   [存入私密]      [公开到火花墙]
```

## 六、核心走向分支说明

### 6.1 用户旅程分支

| 起点 | 分支选项 | 目的地 | 条件 |
|------|---------|--------|------|
| /home | 人机模式 | /solo-match -> /room/[id](AI) | 用户选择AI图标 |
| /home | 双人模式 | /duo-match -> /duo-waiting | 用户选择双人图标 |
| /home | 多人模式 | /story-hall | 用户选择多人图标 |
| /home | 围观模式 | /spectate | 用户选择围观图标 |
| /duo-waiting | 15s内匹配 | /room/[id] | 找到匹配用户 |
| /duo-waiting | 超时 | /duo-timeout | 15s内无匹配 |
| /duo-timeout | 与AI对话 | /room/[id](AI) | 用户选择AI |
| /duo-timeout | 继续搜索 | /duo-waiting | 用户选择继续 |
| /multi-waiting | 多人成功 | /story-hall/[id]/room | 多人组队成功 |
| /multi-waiting | 降级双人 | /room/[id] | 降级为双人 |
| /multi-waiting | 降级AI | /room/[id](AI) | 继续降级 |
| /room/[id] | 标记火花 | 火花墙 | 用户点击火花按钮 |
| /room/[id] | 完成对话 | /library | 用户关闭房间 |
| /story-hall/[id] | 认领角色 | 待审核 | 用户申请角色 |
| /story-hall/[id]/room | 投票分支 | 分支结果 | 导演发起投票 |
| /story-hall/[id]/room | 杀青 | /library | 导演结束剧本 |
| /healing/session | 私密存储 | 仅自己可见 | 用户选择不公开 |
| /healing/session | 公开分享 | /library | 用户选择公开 |

### 6.2 状态流转图

**房间状态 (Room.status)**

```
created ---> active ---> paused ---> active
                        |                  |
                        v                  v
                    finished ---> closed
```

**匹配状态 (MatchRequest.status)**

```
waiting ---> matched ---> resolved
     |
     v
 cancelled / timeout
```

**故事状态 (Story.status)**

```
recruiting ---> ongoing ---> completed
```

**角色认领状态 (StoryRole.claimStatus)**

```
unclaimed ---> pending ---> approved / rejected
```
