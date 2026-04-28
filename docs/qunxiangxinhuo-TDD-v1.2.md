# 群像·星火 (Qunxiang Xinghuo) 技术设计文档 — v1.2

**项目名称：** 群像·星火  
**版本：** v1.2（基于 v1.1 修订，补充 v1.0 遗漏内容）  
**日期：** 2026年4月  
**目标：** 基于真实职业经验的多人协同创作平台 MVP — 工程化交付参考  
**技术架构：** Next.js 15 + App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma + **SQLite（全阶段唯一数据库）**

---

## 修订说明（v1.1 → v1.2）

| 编号 | 修订内容 | 原因 |
|------|----------|------|
| R-09 | **补充详细页面设计**：恢复 v1.0 中全局导航、各页面的 ASCII 布局图、手势交互动画、语音输入流程、火花标记交互等细节。 | v1.1 仅保留页面清单，缺失开发所需的 UI 交互规范，导致前后端理解不一致。 |
| R-10 | **补充业务逻辑中的类型接口**：在脑洞设计和匹配引擎部分恢复 `Brainhole`、`MatchCriteria` 等 TypeScript 接口定义。 | 为前端提供明确的数据结构约定，避免字段遗漏。 |
| R-11 | **补充 API 请求/响应 JSON 示例**：在 v1.1 接口描述基础上，为每个关键接口添加完整的请求与响应 JSON 示例。 | API 交互规范需要具体示例，便于后端实现和前端联调。 |
| R-12 | **补充单人模式 AI 催化交互**：明确脑洞详情页中的手动催化问题区（换一题）与单人模式下的提示逻辑。 | v1.1 仅描述了双人房间的催化，未覆盖单人模式。 |
| R-13 | **补充空状态、匹配成功动画等细节**：从 v1.0 恢复脑洞刷完空状态、匹配成功粒子动画等交互描述。 | 完善用户体验规范，减少 UI 实现时的猜测。 |
| R-14 | **修正文档结构**：将页面清单与详细设计分为独立章节，并调整部分章节顺序以保持逻辑连贯。 | 增强可读性，便于快速索引。 |

---

## 目录

1. [项目总览](#一项目总览)
2. [用户画像与体验设计](#二用户画像与体验设计)
3. [技术架构与实现](#三技术架构与实现)
4. [业务逻辑与规则](#四业务逻辑与规则)
5. [API 接口设计](#五api-接口设计)
6. [数据模型设计](#六数据模型设计)
7. [TDD 测试策略](#七tdd-测试策略)
8. [项目目录结构](#八项目目录结构)
9. [CI/CD 与部署](#九cicd-与部署)
10. [开发里程碑（MVP）](#十开发里程碑mvp)
11. [风险与应对](#十一风险与应对)
12. [总结](#十二总结)

---

## 一、项目总览

### 1.1 项目背景

**创作痛点：**
- 创作者写剧本/小说时，经常卡在专业细节的真实性上（如急诊科抢救流程、律师质证技巧）
- 单人创作的视角单一，难以写出真实的“群像感”
- 有真实职业经验的普通人（退休阿姨、急诊护士、程序员）有故事但缺乏表达渠道

**市场机会：**
- 微短剧、互动小说市场快速增长，对真实职业细节的需求旺盛
- UGC 创作平台多但缺少“职业身份驱动”的协同创作机制

### 1.2 项目简介

《群像·星火》是一个基于**真实职业经验**的多人协同创作平台。让不同职业背景的普通人，被同时扔进同一个冲突情境，用各自的职业本能碰撞出火花，共同完成一部一个人永远写不出的故事。

### 1.3 核心价值主张

- **真实反应资产化**：记录带时间戳和身份标签的真实反应，确权为可追溯的数字资产
- **即兴思想碰撞**：随机匹配不同职业的用户进行即时对白，产出不可预测的创作火花
- **群像共创导演机制**：多人组队围绕同一故事进行角色化共创，由导演控场推进剧情
- **低门槛表达**：语音输入为主，无需写作能力
- **游戏化体验**：左滑右滑、随机匹配、火花标记等交互降低创作压力

### 1.4 核心业务流程

```
单人模式：
1. 选择身份标签 → 2. 浏览脑洞卡片（左滑跳过/右滑收藏）→ 3. 从收藏夹进入脑洞
→ 4. [可选] 查看引导提问 → 5. 语音/文字反应 → 6. 存入个人素材库

双人模式：
1. 选择身份标签 → 2. 浏览脑洞，右滑收藏 → 3. 进入匹配池（基于右滑同一脑洞）
→ 4. 匹配成功进入对白室 → 5. 即时对白（手动标记火花）→ 6. 对话结束查看火花墙
→ 7. [可选 Phase 4] AI辅助串联故事

多人模式：
1. 浏览故事广场（副本列表）→ 2. 认领角色 → 3. 导演开场，按回合发言
→ 4. 导演控场（暂停/继续/发起投票）→ 5. 导演喊杀青 → 6. 查看共创者署名墙
→ 7. [可选 Phase 4] AI辅助串联成群像故事
```

### 1.5 功能范围边界（MVP v1.0）

**本版本必须实现：**
- 产品首页 + 三个模式入口
- 单人模式：身份选择 → 脑洞匹配（左滑/右滑/收藏夹）→ 反应记录 → 记录反馈
- 双人模式：身份选择 → 匹配等待 → 对白室（含火花标记）→ 火花墙
- 多人模式：故事广场 → 副本详情/角色认领 → 对戏剧场（含导演控场和投票）→ 杀青页面
- 个人素材库（我的反应、火花合集、故事草稿）
- 所有页面的返回操作逻辑

**本版本暂不实现（后续迭代）：**
- AI 催化问题生成（Phase 4 接入；MVP 阶段使用本地预设题库兜底）
- AI 故事串联（Phase 4 接入；UI 入口预留，功能禁用）
- AI 情绪分析标签（Phase 4 接入）
- AI 场景图（“灵感视界”/“场景共鸣”背景板）
- 长期连载模式
- 情侣/密友模式
- 个人疗愈空间
- 收益结算系统（个人中心预留入口，不实现逻辑）

---

## 二、用户画像与体验设计

### 2.1 目标用户

#### 2.1.1 创作者（需求方）

- 写剧本/小说/微短剧，卡在专业细节上
- 需要真实的职业视角来丰富角色
- 愿意为高质量的真实经验付费或交换

#### 2.1.2 经验提供者（供给方）

- 退休阿姨、急诊护士、程序员、快递员、律师等
- 有丰富的一线经验但不想写长篇大论
- 愿意用碎片时间分享真实经历

#### 2.1.3 普通玩家（体验方）

- 想要表达但不想社交
- 对角色扮演、即兴对话感兴趣
- 把平台当“职业模拟器”玩

### 2.2 设计原则

- **移动优先**：充分适配手机 H5 场景，核心流程单手操作
- **游戏感**：左滑右滑、随机匹配、火花标记等交互降低心理门槛
- **低门槛**：语音输入为主，文字输入为辅
- **温暖深色基调**：古风与现代 UI 混搭，夜间使用友好
- **状态透明**：清晰展示匹配状态、房间状态、创作进度

### 2.3 设计系统

**色彩体系：**
```
背景色：    #1a1a2e（深蓝黑）
卡片背景：  rgba(255,255,255,0.05) + 1px solid rgba(255,255,255,0.08)
主色调：    #e2b04a（暖金色）
强调色：    #ff6b6b（火花红）
辅助色：    #4ecdc4（青瓷绿，成功状态）
标题文字：  #ffffff
正文文字：  #b0b5cc
次要文字：  #6b7280
渐变：      linear-gradient(135deg, #e2b04a 0%, #f39c12 100%)
```

**字体系统：**
```
主字体： system-ui, -apple-system, "PingFang SC", "Microsoft YaHei"
标题字重：700
正文字重：400
行高：1.6
```

**组件规范：**
```
卡片圆角：  16px
按钮圆角：  12px（大）/ 8px（小）
标签样式：  圆角药丸形，半透明金色背景 rgba(226,176,74,0.15)
阴影：      0 4px 24px rgba(0,0,0,0.3)
间距基数：  4px（4, 8, 12, 16, 20, 24, 32, 48）
```

### 2.4 页面清单与流程（PRD 对齐）

| 模块 | 页面 | 路由 | MVP 状态 |
|------|------|------|----------|
| 全局 | 首页/脑洞大厅 | `/` | ✅ 实现 |
| 全局 | 个人素材库 | `/library` | ✅ 实现 |
| 全局 | 消息中心 | `/messages` | ✅ 实现（匹配通知） |
| 全局 | 个人中心 | `/profile` | ✅ 实现（含预留入口） |
| 单人 | 身份选择页 | `/brainhole/[id]` (state: identity) | ✅ 实现 |
| 单人 | 脑洞匹配页（左滑右滑） | `/` (主页卡片堆) | ✅ 实现 |
| 单人 | 反应记录页 | `/brainhole/[id]` (state: react) | ✅ 实现 |
| 单人 | 记录反馈页 | `/brainhole/[id]` (state: done) | ✅ 实现 |
| 双人 | 身份选择页 | `/match` (state: identity) | ✅ 实现 |
| 双人 | 匹配等待页 | `/match` (state: waiting) | ✅ 实现 |
| 双人 | 对白室 | `/room/[roomId]` | ✅ 实现 |
| 双人 | 火花墙 | `/room/[roomId]/spark` | ✅ 实现 |
| 双人 | 串联反馈页 | `/room/[roomId]/story` | ⏳ Phase 4（AI 接入后） |
| 多人 | 故事广场 | `/multiplayer` | ✅ 实现 |
| 多人 | 副本详情/角色认领 | `/multiplayer/[roomId]` (state: lobby) | ✅ 实现 |
| 多人 | 对戏剧场 | `/multiplayer/[roomId]` (state: acting) | ✅ 实现 |
| 多人 | 杀青/串联 | `/multiplayer/[roomId]` (state: finished) | ✅ 实现（AI串联 Phase 4） |
| 预留 | 情侣/密友模式 | 个人中心入口 | 🔒 预留入口 |
| 预留 | 个人疗愈空间 | 个人中心入口 | 🔒 预留入口 |
| 预留 | 长期连载模式 | 个人中心入口 | 🔒 预留入口 |

### 2.5 详细页面设计与交互

#### 2.5.1 全局导航与布局

**移动端底部 Tab 导航：**
```
┌─────────────────────────────────────┐
│              内容区域                │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  [发现]   [素材库]   [消息]   [我的] │
│   🔥        📦        💬       👤   │
└─────────────────────────────────────┘
```

**Tab 定义：**
- **发现** (`/`)：脑洞大厅，浏览和匹配
- **素材库** (`/library`)：个人反应收藏、火花合集、故事草稿
- **消息** (`/messages`)：匹配通知、系统消息、导演邀请
- **我的** (`/profile`)：身份标签、等级、设置

#### 2.5.2 首页 / 脑洞大厅

**设计目标：** 吸引用户开始探索，用左滑右滑快速筛选感兴趣的冲突情境

**页面布局：**
```
┌─────────────────────────────────────┐
│ [Logo] 群像·星火        [🔔] [👤]  │
├─────────────────────────────────────┤
│ 身份标签栏（横向滚动）               │
│ [全部] [急诊科护士] [退休阿姨] [程序员│
│  [律师] [快递员] [+]                │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────┐      │
│    │      [脑洞卡片]          │      │
│    │                         │      │
│    │  "你是急诊科值班医生，   │      │
│    │   凌晨2点接到120预报：  │      │
│    │   一名心脏骤停患者5分钟 │      │
│    │   后到达..."           │      │
│    │                         │      │
│    │  🏷️ 医疗 · 悬疑 · 紧急  │      │
│    │  💬 128条反应           │      │
│    └─────────────────────────┘      │
│                                     │
│         ← 左滑跳过  右滑收藏 →      │
│                                     │
├─────────────────────────────────────┤
│  [🎲 随机匹配]  [🎙️ 快速反应]       │
└─────────────────────────────────────┘
```

**卡片交互设计：**
```
手势操作：
- 左滑（< -80px）：卡片飞出左侧，显示"跳过"标签，加载下一张
- 右滑（> 80px）：卡片飞出右侧，显示"收藏"标签，存入素材库
- 上滑（< -100px）：快速进入脑洞详情页
- 点击卡片：进入脑洞详情页

动画：
- 滑动时卡片跟随手指，透明度随位移递减
- 释放后 0.3s ease-out 飞出屏幕
- 新卡片从底部淡入缩放（scale 0.9 → 1.0）
```

**空状态：**
```
┌─────────────────────────────────────┐
│                                     │
│          🔥 今日脑洞已刷完          │
│                                     │
│    你已经探索了所有冲突情境          │
│    明天再来，或者创建一个新脑洞？     │
│                                     │
│       [创建脑洞] [查看素材库]        │
│                                     │
└─────────────────────────────────────┘
```

#### 2.5.3 脑洞详情页（单人模式）

**设计目标：** 展示冲突情境全貌，引导用户选择身份并记录真实反应

**页面布局 - 状态1：身份选择：**
```
┌─────────────────────────────────────┐
│ [←返回]  脑洞详情          [分享]   │
├─────────────────────────────────────┤
│ 冲突情境                           │
│ ┌─────────────────────────────────┐ │
│ │ "你是急诊科值班医生，凌晨2点    │ │
│ │  接到120预报：一名心脏骤停患者  │ │
│ │  5分钟后到达，你只有2分钟准备   │ │
│ │  时间。你的第一反应是？"        │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 选择你的身份标签                     │
│ ┌─────────────────────────────────┐ │
│ │ [真身] 使用我的真实职业          │ │
│ │  当前：未设置                    │ │
│ ├─────────────────────────────────┤ │
│ │ [推荐身份] 基于情境推荐          │ │
│ │ [急诊科医生] [护士] [实习医生]   │ │
│ ├─────────────────────────────────┤ │
│ │ [自定义] 我想扮演...             │ │
│ │ [输入职业标签]                   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [确认身份，开始反应]                 │
└─────────────────────────────────────┘
```

**页面布局 - 状态2：AI催化与反应输入：**
```
┌─────────────────────────────────────┐
│ [←返回]  以「急诊科医生」身份反应   │
├─────────────────────────────────────┤
│ 冲突情境（可展开/收起）              │
│ "你是急诊科值班医生，凌晨2点..."    │
├─────────────────────────────────────┤
│ AI 催化提问区                       │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 如果时间只剩1分钟，你还会   │ │
│ │    坚持气管插管吗？            │ │
│ │            [换一题]            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 反应输入区                          │
│ ┌─────────────────────────────────┐ │
│ │  🎙️ 按住说话，松开发送         │ │
│ │                                 │ │
│ │  [波形动画] 或                  │ │
│ │  [点击输入文字...]              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 已有反应（按时间倒序）               │
│ ┌─────────────────────────────────┐ │
│ │ 👤 急诊科护士 · 2分钟前        │ │
│ │ "会先确认除颤仪到位，同时让    │ │
│ │  实习生准备抢救药品"           │ │
│ │           [🔥 标记火花]        │ │
│ ├─────────────────────────────────┤ │
│ │ 👤 退休教师 · 5分钟前          │ │
│ │ "我会先打电话给家属..."        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**语音输入交互流程：**
```
1. 用户长按麦克风按钮（> 300ms 防误触）
2. 按钮放大，显示波形动画，开始录音
3. 录音中显示时长（最大 60 秒）
4. 松开手指 → 停止录音 → 显示转文字中（loading）
5. 转文字完成 → 显示文字预览 + [发送] [重录]
6. 点击发送 → POST /api/reactions → 成功后追加到列表顶部
```

#### 2.5.4 随机匹配页（双人模式入口）

**设计目标：** 让用户选择身份后快速匹配对手，降低等待焦虑

**页面布局：**
```
┌─────────────────────────────────────┐
│ [←返回]  双人对戏匹配              │
├─────────────────────────────────────┤
│                                     │
│          ┌─────────────┐            │
│          │   [头像]    │            │
│          │   我自己    │            │
│          │  急诊科医生 │            │
│          └─────────────┘            │
│                 ↓                   │
│          正在寻找对手...            │
│          [旋转动画] 00:23           │
│                 ↓                   │
│          ┌─────────────┐            │
│          │   [?]       │            │
│          │  未知身份   │            │
│          │  匹配中...  │            │
│          └─────────────┘            │
│                                     │
│  [取消匹配]                         │
│                                     │
│  匹配规则：                         │
│  · 优先匹配不同职业背景             │
│  · 双方右滑过同一脑洞               │
│  · 30秒内未匹配自动放宽条件         │
│                                     │
└─────────────────────────────────────┘
```

**匹配成功动画：**
```
1. 对手头像从模糊渐显清晰
2. 显示对手身份标签（如"退休阿姨"）
3. 双方头像向中间靠拢，碰撞出火花粒子效果
4. 显示共同匹配的脑洞标题
5. 3秒后自动进入房间，或点击 [立即开始对戏]
```

#### 2.5.5 双人对戏房间

**设计目标：** 沉浸式即时对白体验，强调双方身份碰撞

**页面布局：**
```
┌─────────────────────────────────────┐
│ [←返回]  对戏中          [火花墙💥]│
├─────────────────────────────────────┤
│ 冲突情境横幅（可点击展开）            │
│ "急诊室凌晨2点，心脏骤停患者即将..."│
├─────────────────────────────────────┤
│ 消息流区域                          │
│                                     │
│ ┌────────────────────────┐          │
│ │ 👤 急诊科医生（我）     │          │
│ │ "先推肾上腺素，准备除颤 │          │
│ │ 仪，通知麻醉科待命"     │          │
│ └────────────────────────┘          │
│          09:42 ✓✓                   │
│                                     │
│          ┌────────────────────────┐ │
│          │ 👤 退休阿姨（对方）     │ │
│          │ "我不懂那些，但如果我   │ │
│          │ 是家属，我会想知道     │ │
│          │ 医生有没有尽全力..."    │ │
│          └────────────────────────┘ │
│                   09:43 ✓✓          │
│                                     │
│ ┌────────────────────────┐          │
│ │ 👤 急诊科医生（我）     │          │
│ │ [长按消息可标记为火花]  │          │
│ └────────────────────────┘          │
│                                     │
├─────────────────────────────────────┤
│ AI催化提示（超30秒无发言时显示）      │
│ "🤖 如果患者是儿童，你的判断会      │
│  改变吗？" [忽略] [回答这个问题]     │
├─────────────────────────────────────┤
│ 输入区                              │
│ ┌─────────────────────────────────┐ │
│ │ 🎙️ [按住说话]  或  [文字输入]   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**火花标记交互：**
```
1. 长按任意消息气泡（> 500ms）
2. 消息气泡高亮，弹出操作菜单：[标记火花] [复制] [举报]
3. 点击"标记火花" → 消息旁出现 🔥 图标 + 金色边框
4. 双方同时收到 "一条消息被标记为火花" 系统提示
5. 火花消息自动同步到火花墙
```

**AI 催化逻辑：**
```
触发条件：
- 房间内最后一条消息时间 > 30 秒
- 且双方都在线（WebSocket 连接活跃）
- 且当前消息数 < 50 条（避免过度干扰）

行为：
1. 后端计时器触发 AI 提问生成（MVP 阶段从本地题库选取）
2. 系统基于：冲突情境 + 双方身份 + 历史消息上下文
3. 生成一个开放性问题，推送到双方界面
4. 用户可选择 [忽略] 或点击问题快速填入输入框
```

#### 2.5.6 火花墙页面

**设计目标：** 展示对戏中的高光时刻，引导用户进入故事串联

**页面布局：**
```
┌─────────────────────────────────────┐
│ [←返回]  火花墙           [串联故事]│
├─────────────────────────────────────┤
│ 💥 本次对戏共产生 5 个火花          │
│ 来自「急诊科医生」×「退休阿姨」      │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔥 火花 #1                      │ │
│ │                                 │ │
│ │ "先推肾上腺素，准备除颤仪..."   │ │
│ │ — 急诊科医生                    │ │
│ │                                 │ │
│ │ 💬 后续回应：                   │ │
│ │ "我不懂那些，但如果我是家属..." │ │
│ │ — 退休阿姨                      │ │
│ │                                 │ │
│ │ [✏️ 添加批注] [📌 加入素材库]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔥 火花 #2                      │ │
│ │ "家属想知道医生有没有尽全力"    │ │
│ │ — 退休阿姨                      │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [✨ AI辅助串联故事]                  │
│ 基于这些火花，生成一段完整对白或     │
│ 故事提纲...                         │
└─────────────────────────────────────┘
```

#### 2.5.7 多人副本大厅（多人模式）

**设计目标：** 浏览可参与的多人群像剧本，认领角色

**页面布局：**
```
┌─────────────────────────────────────┐
│ [Logo] 多人副本         [创建副本+] │
├─────────────────────────────────────┤
│ 进行中的副本                        │
│ ┌─────────────────────────────────┐ │
│ │ 《午夜急诊室》                   │ │
│ │ 👥 3/5 人 · 🎬 导演：老张      │ │
│ │ 状态：招募中                     │ │
│ │ [急诊科医生] [护士] [家属] 空缺  │ │
│ │          [申请加入]              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 推荐副本                            │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │午夜 │ │法庭 │ │拆迁 │            │
│ │急诊 │ │风云 │ │谈判 │            │
│ │👥5人│ │👥4人│ │👥6人│            │
│ │     │ │     │ │     │            │
│ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────┘
```

#### 2.5.8 导演控场页（多人模式房间）

**设计目标：** 导演掌控节奏，角色按回合发言，避免混乱

**页面布局：**
```
┌─────────────────────────────────────┐
│ [←返回]  《午夜急诊室》   [设置⚙️]  │
├─────────────────────────────────────┤
│ 角色状态栏                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│ │🎬  │ │👤  │ │👤  │ │👤  │ │❓  ││
│ │导演│ │急诊│ │护士│ │家属│ │待领││
│ │老张│ │李医│ │小王│ │待领│ │    ││
│ └────┘ └────┘ └────┘ └────┘ └────┘│
├─────────────────────────────────────┤
│ 当前回合：场景2 - 患者家属赶到       │
│ 发言角色：家属（待认领/由导演代读）  │
├─────────────────────────────────────┤
│ 剧本提示区                         │
│ "家属冲进急诊室，看到抢救场面，      │
│  第一句话会说什么？"                │
├─────────────────────────────────────┤
│ 发言区（仅当前回合角色可输入）       │
│ ┌─────────────────────────────────┐ │
│ │ 🎙️ [按住说话]                   │ │
│ └─────────────────────────────────┘ │
│ [🎬 导演喊 Cut] [⏭️ 下一回合]      │
├─────────────────────────────────────┤
│ 历史发言                           │
│ 场景1 - 120到达                    │
│ 👤 急诊科医生："准备抢救！"        │
│ 👤 护士："除颤仪充电到200J！"      │
└─────────────────────────────────────┘
```

#### 2.5.9 个人素材库

**设计目标：** 管理个人反应、收藏的火花、生成的故事

**页面布局：**
```
┌─────────────────────────────────────┐
│ [👤 用户名]  Lv.3 资深反应者       │
│ 身份标签：急诊科医生 | 业余编剧      │
├─────────────────────────────────────┤
│ [我的反应] [火花合集] [故事草稿]    │
├─────────────────────────────────────┤
│ 我的反应（24条）                    │
│ ┌─────────────────────────────────┐ │
│ │ "先推肾上腺素..."               │ │
│ │ 📌 来自《凌晨2点的急诊室》      │ │
│ │ 🏷️ 急诊科医生 · 128🔥          │ │
│ │ [编辑] [删除] [生成故事]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 火花合集（5个）                     │
│ ┌─────────────────────────────────┐ │
│ │ 💥 急诊科医生 × 退休阿姨        │ │
│ │    5条火花 · 2026.04.20        │ │
│ │    [查看] [串联故事]            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 三、技术架构与实现

### 3.1 系统架构总览

```
前端层 (Next.js 15 + React 19 + App Router)
    ↓
API层 (Next.js Route Handlers)
    ↓
业务层 (身份认证 + 脑洞管理 + 匹配引擎 + 房间管理)
    ↓
数据层 (Prisma ORM + SQLite)          ← MVP 及生产初期唯一数据库
    ↓
实时层 (Socket.io / WebSocket 房间消息)
    ↓
AI层 (Phase 4 接入，当前使用本地预设数据兜底)
```

> **数据库策略说明：** 整个 MVP 阶段统一使用 SQLite。SQLite 对于单机部署、并发量在千级以内的场景完全足够。后续如需水平扩展，可以通过修改 `DATABASE_URL` 和 Prisma provider 迁移到 PostgreSQL，无需改动业务逻辑。**开发团队不要在此阶段引入 PostgreSQL、Redis 等额外中间件。**

### 3.2 核心技术栈

**前端：**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion（交互动画）
- Socket.io-client（实时通信）
- react-swipeable（滑动手势）
- wavesurfer.js（语音波形可视化）

**后端：**
- Next.js Route Handlers（原生 API）
- Prisma ORM + **SQLite**（唯一数据库）
- Socket.io（WebSocket 房间管理）
- NextAuth.js（身份认证，邮箱登录为主，知乎 OAuth 可选接入）
- BullMQ（异步任务队列，仅用于匹配超时处理；Phase 4 前可用轮询替代）

**AI 服务（Phase 4 延缓接入）：**
- 催化问题：Phase 4 接入 DeepSeek API；Phase 1-3 使用本地预设题库（`/lib/ai/fallback-prompts.ts`）
- 语音转文字：浏览器原生 Web Speech API（零成本，MVP 阶段）
- 故事串联：Phase 4 接入；UI 入口在 Phase 3 完成后预留，按钮禁用并提示“即将上线”
- 情绪分析：Phase 4 接入；存储字段预留，不做实际分析

**AI 接入原则：** 所有 AI 功能均通过 `/lib/ai/` 目录下的抽象接口调用，内部实现可在“本地兜底”和“真实 API”之间切换，通过环境变量 `AI_PROVIDER=mock|deepseek|openai` 控制。

---

## 四、业务逻辑与规则

### 4.1 身份标签系统

**标签分类：**
```
一级分类（系统预设）：
- 医疗：急诊科医生、护士、外科医生、心理医生
- 法律：律师、法官、警察、法医
- 教育：教师、教授、辅导员
- 服务：快递员、外卖员、客服、空乘
- 技术：程序员、产品经理、设计师
- 生活：退休阿姨、全职爸爸、房东
- 其他：自定义标签

标签规则：
- 用户最多设置 3 个主标签
- 自定义标签需通过内容审核
- 标签带置信度标识：「已认证」（OAuth 职业信息）/ 「自我声明」（用户填写）/ 「系统推荐」
```

身份选择分三条路径（与 PRD 对齐）：
1. **以真身入戏**：读取账号绑定职业，展示为“已认证·XXX”
2. **推荐身份**：系统根据脑洞内容推荐几个合适身份（Phase 1-3 使用规则推荐，Phase 4 用 AI）
3. **自创人物**：用户输入自定义职业标签（仅标签，无需写小传）

### 4.2 脑洞（冲突情境）设计

**脑洞数据结构：**
```typescript
interface Brainhole {
  id: string;
  title: string;           // 标题："凌晨2点的急诊室"
  scenario: string;        // 情境描述："你是急诊科值班医生..."
  context: {               // 背景信息
    time: string;          // "凌晨2点"
    location: string;      // "三甲医院急诊科"
    characters: string[];  // ["值班医生", "120护士", "患者家属"]
  };
  tags: Tag[];             // 关联标签
  difficulty: 'easy' | 'medium' | 'hard';  // 难度
  source: 'user' | 'ai' | 'admin';         // 来源
  reactionCount: number;   // 反应数量
  sparkCount: number;      // 火花数量
}
```

**脑洞来源策略：**
1. **种子数据**：运营团队录入 100+ 高质量情境（`prisma/seed.ts`）
2. **UGC 创建**：用户可提交脑洞，审核后上线
3. **AI 生成**（Phase 4）：基于热门话题自动生成，有审核标记

**脑洞卡片交互（与 PRD 对齐）：**
- 左滑：跳过，下一个脑洞出现
- 右滑：收藏到“灵感收藏夹”
- 上滑/点击：进入脑洞详情
- 底部收藏夹悬浮条：展示已收藏数量，点击展开列表，选择后进入反应记录页

### 4.3 匹配引擎规则

**双人匹配核心逻辑（与 PRD 对齐）：**
- 当两个用户右滑了同一个脑洞时，触发匹配
- 优先匹配不同职业背景（`preferDifferent: true`）
- 30秒内未匹配自动放宽条件（允许相同职业）
- 60秒超时，提示用户先进行单人反应

**匹配算法接口：**
```typescript
interface MatchCriteria {
  brainholeId: string;      // 必须基于同一脑洞
  userIdentity: string;     // 当前用户身份
  preferDifferent: boolean; // 优先不同职业（默认 true）
  maxWaitTime: number;      // 最大等待秒数（默认 60s）
}

// 匹配优先级：
// 1. 同时右滑了同一脑洞 + 不同职业 + 同时在线
// 2. 同时右滑了同一脑洞 + 任意职业 + 同时在线
// 3. 同一脑洞 + 不同职业 + 同时在线
// 4. 同一脑洞 + 任意职业 + 同时在线
// 5. 放宽到相似标签的脑洞
```

**匹配状态机：**
```
用户右滑脑洞
  → waiting（进入匹配池，开始计时，实时WebSocket推送）
  → matched（匹配成功，创建房间，推送双方弹窗）
  → timeout（60秒未匹配，降级提示）
  → cancelled（用户主动取消）
```

### 4.4 房间生命周期

**双人房间状态机：**
```
created → active → ended → closed（自动归档，生成火花墙）
  ↑ ai_prompted（AI催化，Phase 4）
  ↑ spark_marked（有消息被标记为火花）
```

**多人副本状态机（与 PRD 对齐）：**
```
recruiting（招募中，可认领角色）
  → ready（角色满员，导演可开始）
  → acting（进行中）
    → paused（导演暂停，所有人无法发言）
    → voting（投票中，所有参与者表态）
  → finished（导演喊杀青）
  → archived（归档，可查看回放）
```

### 4.5 火花（Spark）机制

- **双人模式**：任意一方长按消息（> 500ms）可标记为火花
- **多人模式**：只有导演可以标记火花（与 PRD 对齐）
- 一条消息只能被标记一次，不可取消
- 火花消息在火花墙中展示，带上下文（前后各1条消息）
- 火花可被单独点击查看上下文（PRD 要求）

### 4.6 导演控场与投票（多人模式，与 PRD 对齐）

导演专属操作：
- **暂停**：所有人无法发言，导演引导复盘
- **继续**：恢复对话
- **总结当前剧情**：Phase 4 由 AI 自动总结；Phase 1-3 由导演手动写摘要
- **发起投票**：剧情分支时，所有参与者表态，导演最终裁定；被否决的灵感存入灵感库
- **本章杀青**：导演确认后正式结束本章

### 4.7 灵感库（多人模式）

- 存放导演否决但保留的备用灵感（投票结果被否决的内容）
- 副本详情页有灵感库入口（右侧）
- 对戏剧场实时展示灵感库内容

### 4.8 AI 催化（Phase 4 延缓接入）

**MVP 阶段（Phase 1-3）的兜底方案：**
- 预设本地题库（`/lib/ai/fallback-prompts.ts`），按脑洞标签分类
- **单人模式**：用户可在脑洞详情页手动点击“换一题”获取新的预设催化问题
- **双人模式**：30秒无发言时，从题库随机取一条推送
- UI 展示与真实 AI 完全一致，用户无感知差异

**Phase 4 接入后：**
- 后端计时器触发，调用 AI API
- 基于冲突情境 + 双方身份 + 历史消息生成开放性问题
- 用户可选择 [忽略] 或点击问题快速填入输入框

---

## 五、API 接口设计

### 5.1 接口规范

- **Base URL**: `/api`
- **认证方式**: NextAuth.js Session Cookie + CSRF 防护
- **数据格式**: JSON / UTF-8

**通用响应格式：**
```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

### 5.2 认证接口

#### GET /api/auth/session — 获取当前用户

响应：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "创作者小王",
      "email": "user@example.com",
      "avatar": "https://...",
      "identities": [
        { "label": "急诊科医生", "verified": true },
        { "label": "业余编剧", "verified": false }
      ],
      "level": 3,
      "sparkCount": 15
    }
  }
}
```

#### PUT /api/users/identities — 更新身份标签

请求：
```json
{
  "identities": [
    { "label": "急诊科医生", "verified": true }
  ]
}
```

### 5.3 脑洞接口

#### GET /api/brainholes — 获取脑洞列表

查询参数：
```typescript
{
  page?: number;       // 默认 1
  limit?: number;      // 默认 10
  tags?: string[];     // 标签筛选
  difficulty?: string; // easy | medium | hard
  sort?: 'newest' | 'hot' | 'random';
}
```

响应：
```json
{
  "success": true,
  "data": {
    "brainholes": [
      {
        "id": "bh_001",
        "title": "凌晨2点的急诊室",
        "scenario": "你是急诊科值班医生，凌晨2点接到120预报...",
        "tags": ["医疗", "悬疑", "紧急"],
        "difficulty": "hard",
        "reactionCount": 128,
        "sparkCount": 12,
        "isCollected": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "pages": 16
    }
  }
}
```

#### GET /api/brainholes/:id — 获取脑洞详情

响应：
```json
{
  "success": true,
  "data": {
    "id": "bh_001",
    "title": "凌晨2点的急诊室",
    "scenario": "...",
    "context": {
      "time": "凌晨2点",
      "location": "三甲医院急诊科",
      "characters": ["值班医生", "120护士", "患者家属"]
    },
    "tags": ["医疗", "悬疑"],
    "reactions": [
      {
        "id": "rx_001",
        "content": "先推肾上腺素，准备除颤仪...",
        "identity": "急诊科医生",
        "isSpark": true,
        "createdAt": "2026-04-20T09:30:00Z",
        "user": { "name": "李医生", "avatar": "..." }
      }
    ],
    "myReaction": null
  }
}
```

#### POST /api/brainholes — 创建脑洞（UGC）

请求：
```json
{
  "title": "新情境标题",
  "scenario": "冲突情境描述...",
  "context": { "time": "...", "location": "...", "characters": ["..."] },
  "tags": ["标签1", "标签2"],
  "difficulty": "medium"
}
```

#### POST /api/brainholes/:id/collect — 收藏脑洞（右滑）

响应：`{ "collected": true, "collectionId": "col_001" }`

#### DELETE /api/brainholes/:id/collect — 取消收藏（左滑撤回）

#### GET /api/brainholes/collected — 获取我的脑洞收藏夹

响应：收藏列表，含收藏时间、对应脑洞信息

### 5.4 反应接口

#### POST /api/reactions — 提交反应

请求：
```json
{
  "brainholeId": "bh_001",
  "roomId": null,
  "content": "先推肾上腺素，准备除颤仪...",
  "identity": "急诊科医生",
  "emotionTag": null,
  "mediaUrl": null,
  "mediaDuration": null
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "rx_002",
    "content": "先推肾上腺素，准备除颤仪...",
    "identity": "急诊科医生",
    "isSpark": false,
    "createdAt": "2026-04-20T10:05:00Z",
    "user": { "id": "user_123", "name": "创作者小王" }
  }
}
```

**注意：** `emotionTag` 字段在 Phase 4 之前由客户端传 null，服务端不做 AI 分析。

#### GET /api/reactions — 获取反应列表

查询参数：`brainholeId`（必填）、`roomId`（可选）、`page`、`limit`

### 5.5 匹配接口

#### POST /api/match/request — 请求匹配

请求：
```json
{
  "brainholeId": "bh_001",
  "identity": "急诊科医生",
  "preferDifferent": true
}
```

响应：
```json
{
  "success": true,
  "data": {
    "matchId": "match_001",
    "status": "waiting",
    "expiresAt": "2026-04-20T10:01:00Z"
  }
}
```

#### GET /api/match/:matchId — 查询匹配状态

响应（匹配成功）：
```json
{
  "success": true,
  "data": {
    "matchId": "match_001",
    "status": "matched",
    "roomId": "room_001",
    "opponent": {
      "id": "user_456",
      "name": "张阿姨",
      "identity": "退休阿姨",
      "avatar": "..."
    },
    "brainhole": { "id": "bh_001", "title": "凌晨2点的急诊室" }
  }
}
```

#### DELETE /api/match/:matchId — 取消匹配

### 5.6 房间接口

#### GET /api/rooms/:roomId — 获取房间信息

响应：
```json
{
  "success": true,
  "data": {
    "id": "room_001",
    "type": "duet",
    "brainhole": { "id": "bh_001", "title": "..." },
    "status": "active",
    "participants": [
      { "userId": "user_123", "identity": "急诊科医生", "isOnline": true },
      { "userId": "user_456", "identity": "退休阿姨", "isOnline": true }
    ],
    "messages": [
      {
        "id": "msg_001",
        "senderId": "user_123",
        "content": "先推肾上腺素...",
        "isSpark": true,
        "createdAt": "2026-04-20T10:05:00Z"
      }
    ],
    "sparks": [
      { "messageId": "msg_001", "markedBy": "user_456", "markedAt": "..." }
    ]
  }
}
```

#### POST /api/rooms/:roomId/messages — 发送消息

请求：
```json
{
  "content": "先推肾上腺素...",
  "identity": "急诊科医生",
  "roleCharacter": null
}
```

#### POST /api/rooms/:roomId/spark — 标记火花

请求：`{ "messageId": "msg_001" }`

#### POST /api/rooms/:roomId/pause — 导演暂停（多人）

#### POST /api/rooms/:roomId/resume — 导演恢复（多人）

#### POST /api/rooms/:roomId/finish — 导演杀青（多人）

#### POST /api/rooms/:roomId/vote — 发起投票（多人，导演专用）

请求：
```json
{
  "question": "这个剧情方向你支持吗？",
  "options": ["支持走A线", "支持走B线"],
  "targetMessageId": "msg_010"
}
```

#### POST /api/rooms/:roomId/vote/:voteId/cast — 参与投票

请求：`{ "optionIndex": 0 }`

#### POST /api/rooms/:roomId/vote/:voteId/resolve — 导演裁定投票结果

请求：`{ "winnerOptionIndex": 0, "moveToInspiration": [1] }`

#### GET /api/rooms/:roomId/inspirations — 获取灵感库

### 5.7 AI 接口（Phase 4，当前为桩实现）

> 以下接口在 Phase 1-3 中已存在路由，但返回本地预设数据（mock），不调用外部 AI API。Phase 4 替换内部实现即可，接口签名不变。

#### GET /api/ai/prompt — 获取催化问题

查询参数：`brainholeId`、`roomId`（可选）

响应：
```json
{
  "success": true,
  "data": {
    "prompt": "如果时间只剩1分钟，你还会坚持气管插管吗？",
    "source": "mock"
  }
}
```

#### POST /api/ai/story-weave — 故事串联（Phase 4 才真正生效）

请求：
```json
{
  "sparkIds": ["msg_001", "msg_003", "msg_005"],
  "roomId": "room_001",
  "format": "script",
  "style": "现实主义"
}
```

响应（Phase 1-3 返回占位文字）：
```json
{
  "success": true,
  "data": {
    "title": "故事串联功能即将上线",
    "content": "该功能正在开发中，敬请期待。",
    "source": "mock"
  }
}
```

### 5.8 素材库接口

#### GET /api/library — 获取我的素材

查询参数：`type?: 'reactions' | 'sparks' | 'stories'`、`page`、`limit`

#### POST /api/library/stories — 保存故事草稿

请求：
```json
{
  "title": "凌晨2点的选择",
  "content": "...",
  "sourceRoomId": "room_001",
  "sparkIds": ["msg_001", "msg_003"]
}
```

### 5.9 错误码

| 错误码 | 含义 |
|--------|------|
| `UNAUTHORIZED` | 未登录 |
| `IDENTITY_REQUIRED` | 需要选择身份标签 |
| `MATCH_TIMEOUT` | 匹配超时 |
| `MATCH_CANCELLED` | 匹配已取消 |
| `MATCH_ALREADY_EXISTS` | 已有活跃匹配请求 |
| `ROOM_NOT_FOUND` | 房间不存在 |
| `ROOM_CLOSED` | 房间已关闭 |
| `NOT_YOUR_TURN` | 不是当前用户的回合 |
| `NOT_DIRECTOR` | 非导演无权操作 |
| `ALREADY_SPARKED` | 消息已被标记为火花 |
| `VOTE_IN_PROGRESS` | 投票进行中，不可发言 |
| `RATE_LIMITED` | 操作过于频繁 |

---

## 六、数据模型设计

> **修订说明：** 相比 v1.0，本版本修复了以下问题：
> - `Reaction` 与 `RoomMessage` 之间的循环引用问题（拆分为独立表，通过外键关联）
> - 新增 `BrainholeCollection`（脑洞收藏夹）
> - 新增 `Vote` + `VoteOption` + `VoteCast`（投票系统）
> - 新增 `InspirationItem`（灵感库）
> - `emotionTag` 字段保留但标注为 Phase 4 填充
> - `RoomMessage` 不再直接引用 `Reaction`，改为 `reactionId` 可选外键（消除循环依赖）

### 6.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  // DATABASE_URL=file:./dev.db
}

// ==================== 用户与身份 ====================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  level         Int       @default(1)
  sparkCount    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  identities       UserIdentity[]
  reactions        Reaction[]
  roomParticipants RoomParticipant[]
  stories          StoryDraft[]
  brainholes       Brainhole[]          @relation("BrainholeAuthor")
  collections      BrainholeCollection[]
  voteCasts        VoteCast[]
}

model UserIdentity {
  id        String   @id @default(cuid())
  userId    String
  label     String   // "急诊科医生"
  verified  Boolean  @default(false)  // true = OAuth 职业认证；false = 自我声明
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, label])
}

// ==================== 标签系统 ====================

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String?  // "医疗", "法律" 等
  createdAt DateTime @default(now())

  brainholes BrainholeTag[]
}

// ==================== 脑洞（冲突情境） ====================

model Brainhole {
  id                  String   @id @default(cuid())
  title               String
  scenario            String
  contextTime         String?
  contextLocation     String?
  contextCharacters   String?  // JSON数组字符串，如 "[\"值班医生\",\"护士\"]"
  difficulty          String   @default("medium") // easy | medium | hard
  source              String   @default("user")   // user | ai | admin
  status              String   @default("pending") // pending | active | archived
  reactionCount       Int      @default(0)
  sparkCount          Int      @default(0)
  collectionCount     Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  authorId String?
  author   User?   @relation("BrainholeAuthor", fields: [authorId], references: [id])

  tags        BrainholeTag[]
  reactions   Reaction[]
  rooms       Room[]
  matches     MatchRequest[]
  collections BrainholeCollection[]

  @@index([status, createdAt])
  @@index([difficulty])
  @@index([source])
}

model BrainholeTag {
  id          String @id @default(cuid())
  brainholeId String
  tagId       String

  brainhole Brainhole @relation(fields: [brainholeId], references: [id], onDelete: Cascade)
  tag       Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([brainholeId, tagId])
}

// 用户脑洞收藏夹（右滑收藏）
model BrainholeCollection {
  id          String   @id @default(cuid())
  userId      String
  brainholeId String
  createdAt   DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  brainhole Brainhole @relation(fields: [brainholeId], references: [id], onDelete: Cascade)

  @@unique([userId, brainholeId])
  @@index([userId, createdAt])
}

// ==================== 反应 ====================

model Reaction {
  id            String   @id @default(cuid())
  content       String
  identity      String   // 用户选择的身份标签
  emotionTag    String?  // Phase 4 由 AI 填充；当前恒为 null
  mediaUrl      String?  // 语音文件路径
  mediaDuration Float?   // 语音时长（秒）
  isSpark       Boolean  @default(false)
  sparkMarkedBy String?  // 标记者 userId
  sparkMarkedAt DateTime?
  createdAt     DateTime @default(now())

  userId      String
  user        User      @relation(fields: [userId], references: [id])
  brainholeId String
  brainhole   Brainhole @relation(fields: [brainholeId], references: [id])
  roomId      String?
  room        Room?     @relation(fields: [roomId], references: [id])
  // 不再反向引用 RoomMessage，避免循环引用

  @@index([brainholeId, createdAt])
  @@index([roomId, createdAt])
  @@index([userId])
  @@index([isSpark])
}

// ==================== 匹配 ====================

model MatchRequest {
  id              String    @id @default(cuid())
  userId          String
  brainholeId     String
  identity        String
  preferDifferent Boolean   @default(true)
  status          String    @default("waiting") // waiting | matched | timeout | cancelled
  matchedUserId   String?
  roomId          String?
  createdAt       DateTime  @default(now())
  expiresAt       DateTime
  resolvedAt      DateTime?

  brainhole Brainhole @relation(fields: [brainholeId], references: [id])

  @@index([status, brainholeId, createdAt])
  @@index([userId, status])
}

// ==================== 房间 ====================

model Room {
  id          String   @id @default(cuid())
  type        String   @default("duet") // duet | group
  brainholeId String
  status      String   @default("created")
  // created | active | paused | voting | ended | closed | archived
  directorId  String?  // 多人模式导演 userId
  maxRound    Int?     // 多人模式最大回合数
  currentRound Int     @default(0)
  scene       String?  // 多人模式当前场景描述
  createdAt   DateTime @default(now())
  closedAt    DateTime?

  brainhole     Brainhole          @relation(fields: [brainholeId], references: [id])
  participants  RoomParticipant[]
  messages      RoomMessage[]
  reactions     Reaction[]
  votes         Vote[]
  inspirations  InspirationItem[]

  @@index([status, type])
  @@index([brainholeId])
}

model RoomParticipant {
  id             String    @id @default(cuid())
  roomId         String
  userId         String
  identity       String    // 进入房间时选择的身份
  roleCharacter  String?   // 多人模式认领的角色名
  role           String    @default("actor") // actor | director
  isOnline       Boolean   @default(false)
  joinedAt       DateTime  @default(now())
  leftAt         DateTime?

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@index([roomId, isOnline])
}

model RoomMessage {
  id            String   @id @default(cuid())
  roomId        String
  senderId      String
  content       String
  identity      String   // 发言时的身份标签
  roleCharacter String?  // 多人模式角色名，如"掌柜"
  isSpark       Boolean  @default(false)
  sparkMarkedBy String?  // 标记者 userId（多人模式为 directorId）
  sparkMarkedAt DateTime?
  isAiPrompt    Boolean  @default(false) // true = AI催化系统消息
  isDirectorNote Boolean @default(false) // true = 导演旁白
  reactionId    String?  // 可选关联，单人模式下对应 Reaction 记录
  createdAt     DateTime @default(now())

  room     Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])
  @@index([isSpark])
}

// ==================== 投票（多人模式）====================

model Vote {
  id              String   @id @default(cuid())
  roomId          String
  initiatorId     String   // 发起投票的导演 userId
  question        String
  status          String   @default("open") // open | closed
  winnerOptionIdx Int?     // 导演裁定的获胜选项
  createdAt       DateTime @default(now())
  closedAt        DateTime?

  room    Room         @relation(fields: [roomId], references: [id], onDelete: Cascade)
  options VoteOption[]
  casts   VoteCast[]

  @@index([roomId, status])
}

model VoteOption {
  id      String @id @default(cuid())
  voteId  String
  idx     Int    // 选项顺序（0, 1, 2...）
  text    String // 选项内容

  vote  Vote      @relation(fields: [voteId], references: [id], onDelete: Cascade)
  casts VoteCast[]

  @@unique([voteId, idx])
}

model VoteCast {
  id           String   @id @default(cuid())
  voteId       String
  userId       String
  optionId     String
  createdAt    DateTime @default(now())

  vote   Vote       @relation(fields: [voteId], references: [id], onDelete: Cascade)
  option VoteOption @relation(fields: [optionId], references: [id])
  user   User       @relation(fields: [userId], references: [id])

  @@unique([voteId, userId]) // 每人只能投一次
}

// ==================== 灵感库（多人模式）====================

model InspirationItem {
  id          String   @id @default(cuid())
  roomId      String
  content     String   // 被否决的灵感内容
  sourceMessageId String? // 原始消息 ID
  voteId      String?  // 来源投票 ID
  addedBy     String   // 导演 userId
  createdAt   DateTime @default(now())

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId])
}

// ==================== 故事草稿 ====================

model StoryDraft {
  id           String   @id @default(cuid())
  userId       String
  title        String
  content      String
  format       String   @default("script") // script | outline | story
  sourceRoomId String?
  sparkIds     String?  // JSON数组，引用的消息 ID
  isAiGenerated Boolean @default(false)   // Phase 4 AI串联时为 true
  status       String   @default("draft") // draft | published | archived
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId, status])
}
```

---

## 七、TDD 测试策略

### 7.1 测试工具

- **Vitest**：单元测试 + API 集成测试
- **React Testing Library**：组件测试
- **Playwright**：E2E 测试（关键流程）
- **MSW (Mock Service Worker)**：API Mock

### 7.2 测试原则

- **TDD 流程**：先写测试 → 测试失败（Red）→ 写最少代码通过（Green）→ 重构（Refactor）
- **测试命名**：`should [expected behavior] when [condition]`
- **覆盖率目标**：核心逻辑 ≥ 80%，API 接口 100% 覆盖

### 7.3 核心测试用例

#### 7.3.1 组件测试

```typescript
describe('BrainholeCard', () => {
  it('should render title and scenario correctly');
  it('should call onSkip when swiped left beyond 80px threshold');
  it('should call onCollect when swiped right beyond 80px threshold');
  it('should not trigger action when swipe distance is below threshold');
  it('should display tags as pill badges');
  it('should show collection indicator when already collected');
  it('should be accessible with keyboard navigation');
});

describe('ReactionInput', () => {
  it('should start recording on long press (>300ms)');
  it('should not start recording on quick tap (<300ms)');
  it('should stop recording and show preview on release');
  it('should disable submit when content is empty');
  it('should clear input after successful submit');
  it('should show error when recording exceeds 60 seconds');
});

describe('ChatRoom', () => {
  it('should append new message to bottom of list');
  it('should scroll to bottom on new message');
  it('should show spark indicator on sparked message');
  it('should show AI prompt banner after 30s inactivity');
  it('should mark message as spark on long press');
  it('should show opponent online status');
});

describe('DirectorControls', () => {
  it('should show pause/resume/finish buttons for director role');
  it('should not show director controls for actor role');
  it('should open vote dialog when vote button clicked');
  it('should disable all controls while vote is in progress');
});
```

#### 7.3.2 API 测试

```typescript
describe('GET /api/brainholes', () => {
  it('should return paginated list of active brainholes');
  it('should filter by tags when provided');
  it('should sort by hot when sort=hot');
  it('should return empty array when no brainholes match');
});

describe('POST /api/brainholes/:id/collect', () => {
  it('should create collection record on first collect');
  it('should return 409 when already collected');
  it('should return 401 when not authenticated');
});

describe('POST /api/reactions', () => {
  it('should create reaction with identity tag');
  it('should require identity to be provided');
  it('should set emotionTag to null when AI_PROVIDER=mock');
  it('should associate reaction with room when roomId provided');
  it('should return 404 when brainhole does not exist');
  it('should rate limit to 10 reactions per minute');
});

describe('POST /api/match/request', () => {
  it('should create match request and return matchId');
  it('should match two users who swiped right on same brainhole');
  it('should prefer different identities when preferDifferent=true');
  it('should not allow multiple active match requests');
  it('should timeout after 60 seconds and set status to timeout');
});

describe('POST /api/rooms/:roomId/vote', () => {
  it('should create vote with options when initiated by director');
  it('should return 403 when initiated by non-director');
  it('should set room status to voting');
});

describe('POST /api/rooms/:roomId/vote/:voteId/resolve', () => {
  it('should set winner option and close vote');
  it('should move rejected options to inspiration library');
  it('should set room status back to acting');
});

describe('GET /api/ai/prompt', () => {
  it('should return mock prompt when AI_PROVIDER=mock');
  it('should include source="mock" in response');
  it('should return prompt relevant to brainhole tags');
});
```

#### 7.3.3 E2E 测试（Playwright）

```typescript
// tests/e2e/solo-reaction.spec.ts
describe('单人反应完整流程', () => {
  it('should complete: login → select identity → swipe card → collect → react → feedback');
  it('should persist collection across page refresh');
});

// tests/e2e/duet-flow.spec.ts
describe('双人对戏完整流程', () => {
  it('should complete: match → enter room → chat → spark → spark wall');
  it('should show AI prompt banner when no message for 30 seconds');
});

// tests/e2e/multiplayer-flow.spec.ts
describe('多人共创完整流程', () => {
  it('should complete: browse square → claim role → act → vote → finish');
  it('should move rejected inspiration to inspiration library');
});
```

---

## 八、项目目录结构

```
qunxiang-xinghuo/
├── .github/                        # GitHub CI/CD 配置
│   └── workflows/
│       ├── ci.yml                  # 主 CI 流水线（lint + test + build）
│       └── release.yml             # 发布流水线（可选）
│
├── docker/                         # Docker 相关
│   ├── Dockerfile                  # 生产镜像
│   ├── Dockerfile.dev              # 开发镜像（含 hot-reload）
│   └── entrypoint.sh               # 容器启动脚本
│
├── docker-compose.yml              # 本地开发一键启动
├── docker-compose.prod.yml         # 生产部署（可选）
│
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .env.local
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── README.md
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── public/
│   ├── uploads/
│   ├── assets/
│   │   ├── images/
│   │   └── sounds/
│   └── favicon.ico
│
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── providers.tsx
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── brainhole/
    │   │   └── [id]/page.tsx
    │   ├── match/
    │   │   └── page.tsx
    │   ├── room/
    │   │   └── [roomId]/
    │   │       ├── page.tsx
    │   │       ├── spark/page.tsx
    │   │       └── story/page.tsx
    │   ├── multiplayer/
    │   │   ├── page.tsx
    │   │   └── [roomId]/page.tsx
    │   ├── library/
    │   │   └── page.tsx
    │   ├── messages/
    │   │   └── page.tsx
    │   ├── profile/
    │   │   └── page.tsx
    │   └── api/
    │       ├── auth/
    │       │   └── [...nextauth]/route.ts
    │       ├── users/
    │       │   └── identities/route.ts
    │       ├── brainholes/
    │       │   ├── route.ts
    │       │   ├── collected/route.ts
    │       │   └── [id]/
    │       │       ├── route.ts
    │       │       └── collect/route.ts
    │       ├── reactions/
    │       │   └── route.ts
    │       ├── match/
    │       │   ├── route.ts
    │       │   └── [matchId]/route.ts
    │       ├── rooms/
    │       │   ├── route.ts
    │       │   └── [roomId]/
    │       │       ├── route.ts
    │       │       ├── messages/route.ts
    │       │       ├── spark/route.ts
    │       │       ├── pause/route.ts
    │       │       ├── resume/route.ts
    │       │       ├── finish/route.ts
    │       │       ├── inspirations/route.ts
    │       │       └── vote/
    │       │           ├── route.ts
    │       │           └── [voteId]/
    │       │               ├── cast/route.ts
    │       │               └── resolve/route.ts
    │       ├── ai/
    │       │   ├── prompt/route.ts
    │       │   └── story-weave/route.ts
    │       └── library/
    │           ├── route.ts
    │           └── stories/route.ts
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   │   ├── BottomNav.tsx
    │   │   ├── TopBar.tsx
    │   │   └── MobileContainer.tsx
    │   ├── brainhole/
    │   │   ├── BrainholeCard.tsx
    │   │   ├── BrainholeStack.tsx
    │   │   ├── CollectionDrawer.tsx
    │   │   ├── TagFilter.tsx
    │   │   └── ScenarioReader.tsx
    │   ├── reaction/
    │   │   ├── ReactionInput.tsx
    │   │   ├── VoiceRecorder.tsx
    │   │   ├── ReactionList.tsx
    │   │   └── SparkButton.tsx
    │   ├── match/
    │   │   ├── MatchCard.tsx
    │   │   ├── MatchTimer.tsx
    │   │   └── MatchSuccessModal.tsx
    │   ├── room/
    │   │   ├── ChatRoom.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── AIPromptBanner.tsx
    │   │   ├── SparkWall.tsx
    │   │   ├── ParticipantList.tsx
    │   │   ├── DirectorControls.tsx
    │   │   ├── VoteDialog.tsx
    │   │   └── InspirationLibrary.tsx
    │   ├── identity/
    │   │   ├── IdentitySelector.tsx
    │   │   ├── IdentityBadge.tsx
    │   │   └── IdentitySetupModal.tsx
    │   ├── library/
    │   │   ├── StoryCard.tsx
    │   │   ├── SparkCollection.tsx
    │   │   └── StoryWeaver.tsx
    │   └── profile/
    │       ├── UserStats.tsx
    │       ├── LevelBadge.tsx
    │       └── PlaceholderEntry.tsx
    │
    ├── hooks/
    │   ├── useBrainhole.ts
    │   ├── useCollection.ts
    │   ├── useReaction.ts
    │   ├── useMatch.ts
    │   ├── useRoom.ts
    │   ├── useVoiceRecorder.ts
    │   ├── useSwipe.ts
    │   └── useAuth.ts
    │
    ├── lib/
    │   ├── db.ts
    │   ├── auth.ts
    │   ├── socket.ts
    │   ├── ai/
    │   │   ├── index.ts
    │   │   ├── fallback-prompts.ts
    │   │   ├── prompt-generator.ts
    │   │   └── story-weaver.ts
    │   ├── validators/
    │   │   ├── brainhole.ts
    │   │   ├── reaction.ts
    │   │   ├── match.ts
    │   │   └── vote.ts
    │   └── utils.ts
    │
    ├── types/
    │   ├── api.ts
    │   ├── models.ts
    │   ├── components.ts
    │   └── enums.ts
    │
    ├── server/
    │   ├── match-engine.ts
    │   ├── room-manager.ts
    │   ├── ai-catalyst.ts
    │   └── rate-limiter.ts
    │
    ├── styles/
    │   └── globals.css
    │
    └── __tests__/
        ├── unit/
        │   ├── components/
        │   │   ├── BrainholeCard.test.tsx
        │   │   ├── ReactionInput.test.tsx
        │   │   ├── ChatRoom.test.tsx
        │   │   ├── SparkWall.test.tsx
        │   │   ├── DirectorControls.test.tsx
        │   │   └── VoteDialog.test.tsx
        │   ├── hooks/
        │   │   ├── useSwipe.test.ts
        │   │   ├── useVoiceRecorder.test.ts
        │   │   └── useCollection.test.ts
        │   └── lib/
        │       ├── match-engine.test.ts
        │       ├── fallback-prompts.test.ts
        │       └── validators.test.ts
        ├── integration/
        │   └── api/
        │       ├── brainholes.test.ts
        │       ├── reactions.test.ts
        │       ├── match.test.ts
        │       ├── rooms.test.ts
        │       ├── vote.test.ts
        │       └── ai-prompt.test.ts
        └── e2e/
            ├── solo-reaction.spec.ts
            ├── duet-flow.spec.ts
            └── multiplayer-flow.spec.ts
```

---

## 九、CI/CD 与部署

### 9.1 GitHub Actions CI 流水线

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  DATABASE_URL: 'file:./test.db'
  NEXTAUTH_SECRET: 'test-secret-for-ci'
  NEXTAUTH_URL: 'http://localhost:3000'
  AI_PROVIDER: 'mock'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: ESLint
        run: npm run lint
      - name: TypeScript type check
        run: npm run type-check
      - name: Prettier format check
        run: npm run format:check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Generate Prisma client
        run: npx prisma generate
      - name: Run database migrations (test)
        run: npx prisma migrate deploy
      - name: Seed test database
        run: npx tsx prisma/seed.ts
      - name: Run unit & integration tests
        run: npm run test:ci
      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/coverage-final.json

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Generate Prisma client
        run: npx prisma generate
      - name: Build Next.js application
        run: npm run build
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next/
          retention-days: 3

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Generate Prisma client & migrate
        run: |
          npx prisma generate
          npx prisma migrate deploy
          npx tsx prisma/seed.ts
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 9.2 Dockerfile

```dockerfile
# docker/Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
RUN mkdir -p /data && chown nextjs:nodejs /data
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENTRYPOINT ["./entrypoint.sh"]
```

```bash
# docker/entrypoint.sh
#!/bin/sh
set -e
echo "==> Running Prisma migrations..."
npx prisma migrate deploy
echo "==> Seeding database (if empty)..."
if [ ! -f "/data/.seeded" ]; then
  npx tsx prisma/seed.ts && touch /data/.seeded
  echo "==> Database seeded."
else
  echo "==> Database already seeded, skipping."
fi
echo "==> Starting Next.js server..."
exec node server.js
```

```dockerfile
# docker/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### 9.3 docker-compose

```yaml
# docker-compose.yml
version: '3.9'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
      - sqlite_data:/data
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:/data/dev.db
      - NEXTAUTH_SECRET=dev-secret-change-in-production
      - NEXTAUTH_URL=http://localhost:3000
      - AI_PROVIDER=mock
    restart: unless-stopped
volumes:
  sqlite_data:
    driver: local
```

```yaml
# docker-compose.prod.yml
version: '3.9'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - '3000:3000'
    volumes:
      - sqlite_data:/data
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/data/prod.db
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - AI_PROVIDER=${AI_PROVIDER:-mock}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    restart: always
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
volumes:
  sqlite_data:
    driver: local
```

**.env.example：**
```env
DATABASE_URL=file:./dev.db
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
AI_PROVIDER=mock
DEEPSEEK_API_KEY=
OPENAI_API_KEY=
ZHIHU_CLIENT_ID=
ZHIHU_CLIENT_SECRET=
```

---

## 十、开发里程碑（MVP）

### Phase 1：基础搭建（Week 1）
- [ ] 项目初始化（Next.js + Tailwind + shadcn）
- [ ] Prisma + **SQLite** 配置，运行 Schema 迁移
- [ ] `prisma/seed.ts`：录入 20+ 种子脑洞数据
- [ ] NextAuth.js 认证（邮箱登录）
- [ ] 基础布局组件（BottomNav、TopBar、MobileContainer）
- [ ] Docker 开发环境验证（`docker-compose up` 可运行）
- [ ] GitHub CI 配置（lint + test 阶段）
- [ ] **TDD**：先写 `BrainholeCard` 测试 → 实现组件

### Phase 2：单人模式（Week 2）
- [ ] 脑洞列表 API + 首页卡片堆（左滑/右滑）
- [ ] 脑洞收藏 API + 底部收藏夹抽屉组件
- [ ] 脑洞详情页（身份选择 + 反应输入 + 本地催化题库兜底）
- [ ] 语音输入（Web Speech API）
- [ ] 个人素材库页面（反应列表）
- [ ] 记录反馈页面
- [ ] **TDD**：反应提交 API 测试 → 实现

### Phase 3：双人 + 多人模式（Week 3-4）
- [ ] 匹配引擎 + 匹配页面（WebSocket 推送）
- [ ] Socket.io 房间实时通信
- [ ] 双人对白室（含30秒触发本地催化题）
- [ ] 火花标记 + 火花墙
- [ ] 故事串联页面（UI 占位，功能禁用，提示“即将上线”）
- [ ] 多人故事广场 + 副本详情/角色认领
- [ ] 多人对戏剧场（含导演控场、投票、灵感库）
- [ ] 杀青页面 + 共创者署名墙
- [ ] 个人中心（含预留入口）
- [ ] **TDD**：房间消息同步测试、投票流程测试

### Phase 4：AI 接入（Week 5-6，可选）
- [ ] 接入 DeepSeek API，替换 `AI_PROVIDER=mock` 实现
- [ ] AI 催化问题生成（基于上下文）
- [ ] AI 故事串联（启用故事串联页面）
- [ ] AI 情绪分析标签（填充 `emotionTag` 字段）
- [ ] **TDD**：AI 服务抽象接口测试

### Phase 5：打磨与上线（Week 7）
- [ ] 交互动画优化（Framer Motion）
- [ ] E2E 测试覆盖核心流程
- [ ] 性能优化（图片懒加载、虚拟列表）
- [ ] Docker 生产镜像验证
- [ ] CI build 阶段 + E2E 阶段验证

---

## 十一、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| AI API 不稳定/昂贵 | AI 催化、故事串联不可用 | Phase 4 才接入；Phase 1-3 完全使用本地预设题库兜底，用户无感 |
| 语音转文字精度差 | 用户体验受损 | 优先浏览器原生 Web Speech API；提供文字编辑修正入口 |
| 匹配池用户不足 | 双人模式匹配不到人 | Phase 3 预留 AI 机器人对手接口（`actor_bot` 类型），MVP 降级提示单人模式 |
| SQLite 写入锁 | 并发写入排队 | SQLite WAL 模式（`PRAGMA journal_mode=WAL`）可支持多读单写；生产流量上来前足够用 |
| 用户留存低 | MVP 验证失败 | 强游戏化设计（等级、成就、火花数）；简化核心流程至最短路径 |
| Docker 部署冷启动慢 | 用户首次访问体验差 | 启用 Next.js `output: 'standalone'`；SQLite 文件挂载到 Volume，避免每次重建 |

---

## 十二、总结

《群像·星火》v1.2 技术设计文档在 v1.1 基础上补充了 v1.0 中关键的页面交互设计、业务接口类型定义及 API JSON 示例，确保了前后端开发规范的完整性。同时继承了 v1.1 的数据库策略统一、AI 延缓接入、GitHub CI/CD 与 Docker 工程化等优势，并修复了原有数据模型的循环引用问题。文档结构清晰，可直接作为 MVP 开发与测试的基线参考。

---

*文档版本：v1.2*  
*修订日期：2026-04-28*  
*技术栈：Next.js 15 + App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma + SQLite + Socket.io*
