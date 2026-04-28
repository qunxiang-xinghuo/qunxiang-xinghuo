# 群像·星火 (Qunxiang Xinghuo) 项目方案书 — v1.0

**项目名称：** 群像·星火  
**版本：** v1.0  
**日期：** 2026年4月  
**目标：** 基于真实职业经验的多人协同创作平台 MVP — 工程化交付参考  
**技术架构：** Next.js 15 + App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma + SQLite

---

## 一、项目总览

### 1.1 项目背景

**创作痛点：**
- 创作者写剧本/小说时，经常卡在专业细节的真实性上（如急诊科抢救流程、律师质证技巧）
- 单人创作的视角单一，难以写出真实的"群像感"
- 有真实职业经验的普通人（退休阿姨、急诊护士、程序员）有故事但缺乏表达渠道

**市场机会：**
- 微短剧、互动小说市场快速增长，对真实职业细节的需求旺盛
- UGC 创作平台多但缺少"职业身份驱动"的协同创作机制

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
1. 选择身份标签 → 2. 浏览脑洞卡片（左滑跳过/右滑收藏） → 3. 进入脑洞详情
→ 4. AI催化提问 → 5. 语音/文字反应 → 6. 存入个人素材库

双人模式：
1. 选择身份标签 → 2. 随机匹配对手 → 3. 进入对戏房间
→ 4. 即时对白（AI超30秒无发言则催化） → 5. 标记火花消息 → 6. 火花墙回顾
→ 7. 故事串联（AI辅助生成故事线）

多人模式：
1. 浏览副本（脑洞） → 2. 认领角色 → 3. 导演控场（回合制发言）
→ 4. 角色即兴发言 → 5. 导演喊"Cut" → 6. 杀青串联生成群像故事
```

---

## 二、用户画像与体验设计

### 2.1 目标用户

#### 2.1.1 创作者（需求方）

**用户特征：**
- 写剧本/小说/微短剧，卡在专业细节上
- 需要真实的职业视角来丰富角色
- 愿意为高质量的真实经验付费或交换

**核心需求：**
- ✅ 快速获得特定职业的一手经验反馈
- ✅ 看到不同职业对同一情境的真实反应对比
- ✅ 将碎片化反应整合成可用的创作素材

#### 2.1.2 经验提供者（供给方）

**用户特征：**
- 退休阿姨、急诊护士、程序员、快递员、律师等
- 有丰富的一线经验但不想写长篇大论
- 愿意用碎片时间分享真实经历

**核心需求：**
- ✅ 用自己的真实经历赚取收益/积分
- ✅ 表达门槛低，说几句就行
- ✅ 看到自己的反应被认可（火花标记）

#### 2.1.3 普通玩家（体验方）

**用户特征：**
- 想要表达但不想社交
- 对角色扮演、即兴对话感兴趣
- 把平台当"职业模拟器"玩

**核心需求：**
- ✅ 无压力记录真实反应
- ✅ 匿名或伪匿名参与
- ✅ 游戏感强，有即时反馈

### 2.2 设计原则

- **移动优先**：充分适配手机 H5 场景，核心流程单手操作
- **游戏感**：左滑右滑、随机匹配、火花标记等交互降低心理门槛
- **低门槛**：语音输入为主，文字输入为辅
- **温暖深色基调**：古风与现代 UI 混搭，夜间使用友好
- **状态透明**：清晰展示匹配状态、房间状态、创作进度

### 2.3 页面设计与用户体验

#### 2.3.1 设计系统

**色彩体系：**
```
- 背景色：#1a1a2e（深蓝黑）
- 卡片背景：rgba(255,255,255,0.05) + 1px solid rgba(255,255,255,0.08)
- 主色调：#e2b04a（暖金色）
- 强调色：#ff6b6b（火花红）
- 辅助色：#4ecdc4（青瓷绿，用于成功状态）
- 文字色：#ffffff（标题）、#b0b5cc（正文）、#6b7280（次要文字）
- 渐变：linear-gradient(135deg, #e2b04a 0%, #f39c12 100%)
```

**字体系统：**
```
- 主字体：system-ui, -apple-system, "PingFang SC", "Microsoft YaHei"
- 标题字重：700
- 正文字重：400
- 行高：1.6
```

**组件规范：**
```
- 卡片圆角：16px
- 按钮圆角：12px（大）、8px（小）
- 标签样式：圆角药丸形，半透明金色背景 rgba(226,176,74,0.15)
- 阴影：0 4px 24px rgba(0,0,0,0.3)
- 间距：4px 基数（4, 8, 12, 16, 20, 24, 32, 48）
```

#### 2.3.2 全局导航与布局

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

#### 2.3.3 首页 / 脑洞大厅

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

#### 2.3.4 脑洞详情页（单人模式）

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

#### 2.3.5 随机匹配页（双人模式入口）

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

#### 2.3.6 双人对戏房间

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
1. 后端计时器触发 AI 提问生成
2. AI 基于：冲突情境 + 双方身份 + 历史消息上下文
3. 生成一个开放性问题，推送到双方界面
4. 用户可选择 [忽略] 或点击问题快速填入输入框
```

#### 2.3.7 火花墙页面

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

#### 2.3.8 多人副本大厅（多人模式）

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

#### 2.3.9 导演控场页（多人模式房间）

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

#### 2.3.10 个人素材库

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
API层 (Next.js Route Handlers + tRPC 可选)
    ↓
业务层 (身份认证 + 脑洞管理 + 匹配引擎 + 房间管理 + AI催化)
    ↓
数据层 (Prisma ORM + SQLite 开发 / PostgreSQL 生产)
    ↓
实时层 (Socket.io / WebSocket 房间消息)
    ↓
AI层 (OpenAI API / 国产大模型 API — 可插拔设计)
```

### 3.2 核心技术栈

**前端技术栈：**
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion（交互动画）
- Socket.io-client（实时通信）
- react-swipeable（滑动手势）
- wavesurfer.js（语音波形可视化）

**后端技术栈：**
- Next.js Route Handlers (App Router 原生 API)
- Prisma ORM + SQLite（开发）/ PostgreSQL（生产）
- Socket.io（WebSocket 房间管理）
- NextAuth.js / Lucia Auth（身份认证）
- BullMQ（异步任务队列：AI催化、匹配超时处理）

**AI 与外部服务：**
- AI 催化：DeepSeek API（免费版优先，可插拔替换 OpenAI/通义千问）
- 语音转文字：浏览器原生 Web Speech API（MVP 阶段，零成本）
- 脑洞来源：种子数据 + UGC + AI 生成（可插拔）

---

## 四、业务逻辑与规则

### 4.1 身份标签系统

**标签分类：**
```
一级分类（系统预设）：
- 医疗：急诊科医生、护士、外科医生、心理医生...
- 法律：律师、法官、警察、法医...
- 教育：教师、教授、辅导员...
- 服务：快递员、外卖员、客服、空乘...
- 技术：程序员、产品经理、设计师...
- 生活：退休阿姨、全职爸爸、房东...
- 其他：自定义标签

标签规则：
- 用户最多设置 3 个主标签
- 自定义标签需审核或达到一定等级后解锁
- 标签带有置信度标识（"已认证" / "自我声明"）
```

### 4.2 脑洞（冲突情境）设计

**脑洞结构：**
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
1. **种子数据**：运营团队录入 100+ 高质量情境
2. **UGC 创建**：用户可提交脑洞，审核后上线
3. **AI 生成**：基于热门话题自动生成情境（有审核标记）

### 4.3 匹配引擎规则

**双人匹配算法：**
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
用户A点击[随机匹配]
  → waiting（进入匹配池，开始计时）
  → matched（匹配成功，创建房间，推送双方）
  → timeout（60秒未匹配，提示"暂时无人，先单人反应？"）
  → cancelled（用户主动取消）
```

### 4.4 房间生命周期

**双人房间状态机：**
```
created（房间创建，等待双方进入）
  → active（双方都进入，开始对戏）
    → ai_prompted（AI已推送催化问题）
    → spark_marked（有消息被标记为火花）
    → ended（一方离开或超时15分钟无发言）
  → closed（房间关闭，生成火花墙）
```

**多人副本状态机：**
```
recruiting（招募中，可认领角色）
  → ready（角色满员，导演可开始）
  → acting（进行中，按回合推进）
  → paused（导演暂停）
  → finished（导演喊杀青）
  → archived（归档，可查看回放）
```

### 4.5 火花（Spark）机制

**火花定义：** 被双方或导演标记为"高光"的消息，代表有价值的创作素材。

**火花规则：**
- 双人模式：任意一方长按消息可标记为火花
- 多人模式：只有导演可以标记火花
- 一条消息只能被标记一次，不可取消（避免反复）
- 火花消息在火花墙中展示，带上下文（前后各1条消息）

### 4.6 故事串联（AI 辅助创作）

**输入：** 火花墙中的火花消息 + 原始冲突情境 + 参与者的身份标签

**输出选项：**
1. **对白剧本**：按时间顺序整理成对话体
2. **故事提纲**：提炼起承转合的情节线
3. **角色小传**：基于反应生成角色背景补充
4. **完整短篇**：AI 扩写成 800-2000 字微小说

**用户操作：**
- 可编辑 AI 生成的内容
- 可导出为 Markdown / 图片 / 分享链接
- 可保存到"故事草稿"

---

## 五、API 接口设计

### 5.1 接口规范

**基础信息：**
- **Base URL**: `/api`
- **认证方式**: NextAuth.js（邮箱 + 知乎 OAuth）+ Session Cookie + CSRF 防护
- **数据格式**: JSON
- **编码**: UTF-8

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

#### 5.2.1 获取当前用户
**GET /api/auth/session**

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
  },
  "meta": { "timestamp": "2026-04-20T10:00:00Z" }
}
```

#### 5.2.2 更新身份标签
**PUT /api/users/identities**

请求：
```json
{
  "identities": [
    { "label": "急诊科医生", "verified": true },
    { "label": "业余编剧", "verified": false }
  ]
}
```

### 5.3 脑洞接口

#### 5.3.1 获取脑洞列表
**GET /api/brainholes**

查询参数：
```typescript
{
  page?: number;        // 默认 1
  limit?: number;       // 默认 10
  tags?: string[];      // 标签筛选
  difficulty?: string;  // 难度筛选
  sort?: 'newest' | 'hot' | 'random';  // 排序
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

#### 5.3.2 获取脑洞详情
**GET /api/brainholes/:id**

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
    "myReaction": null  // 或当前用户的反应
  }
}
```

#### 5.3.3 创建脑洞
**POST /api/brainholes**

请求：
```json
{
  "title": "新情境标题",
  "scenario": "冲突情境描述...",
  "context": {
    "time": "...",
    "location": "...",
    "characters": ["..."]
  },
  "tags": ["标签1", "标签2"],
  "difficulty": "medium"
}
```

### 5.4 反应接口

#### 5.4.1 提交反应
**POST /api/reactions**

请求：
```json
{
  "brainholeId": "bh_001",
  "roomId": null,           // 单人模式为 null，双人模式为房间ID
  "content": "先推肾上腺素，准备除颤仪...",
  "identity": "急诊科医生",
  "mediaUrl": null,         // 语音文件URL（如使用语音输入）
  "mediaDuration": 12.5     // 语音时长（秒）
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

#### 5.4.2 获取反应列表
**GET /api/reactions**

查询参数：
```typescript
{
  brainholeId: string;    // 必填
  roomId?: string;        // 可选
  page?: number;
  limit?: number;
}
```

### 5.5 匹配接口

#### 5.5.1 请求匹配
**POST /api/match/request**

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

#### 5.5.2 查询匹配状态
**GET /api/match/:matchId**

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
    "brainhole": {
      "id": "bh_001",
      "title": "凌晨2点的急诊室"
    }
  }
}
```

#### 5.5.3 取消匹配
**DELETE /api/match/:matchId**

### 5.6 房间接口

#### 5.6.1 获取房间信息
**GET /api/rooms/:roomId**

响应：
```json
{
  "success": true,
  "data": {
    "id": "room_001",
    "type": "duet",           // duet | group
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

#### 5.6.2 标记火花
**POST /api/rooms/:roomId/spark**

请求：
```json
{
  "messageId": "msg_001"
}
```

### 5.7 AI 催化接口

#### 5.7.1 获取 AI 催化问题
**GET /api/ai/prompt**

查询参数：
```typescript
{
  brainholeId: string;
  roomId?: string;
  lastMessages?: string;  // 最近几条消息的JSON（用于上下文）
}
```

响应：
```json
{
  "success": true,
  "data": {
    "prompt": "如果时间只剩1分钟，你还会坚持气管插管吗？",
    "category": "道德困境",
    "suggestedIdentities": ["急诊科医生", "家属"]
  }
}
```

#### 5.7.2 故事串联生成
**POST /api/ai/story-weave**

请求：
```json
{
  "sparkIds": ["msg_001", "msg_003", "msg_005"],
  "roomId": "room_001",
  "format": "script",   // script | outline | story
  "style": "现实主义"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "title": "凌晨2点的选择",
    "content": "【场景：急诊科抢救室】\n\n李医生：（急促）先推肾上腺素...",
    "wordCount": 1200,
    "sparksUsed": 3
  }
}
```

### 5.8 素材库接口

#### 5.8.1 获取我的素材
**GET /api/library**

查询参数：
```typescript
{
  type?: 'reactions' | 'sparks' | 'stories';  // 默认全部
  page?: number;
  limit?: number;
}
```

#### 5.8.2 保存故事草稿
**POST /api/library/stories**

请求：
```json
{
  "title": "凌晨2点的选择",
  "content": "...",
  "sourceRoomId": "room_001",
  "sparkIds": ["msg_001", "msg_003"]
}
```

### 5.9 错误处理

**错误响应格式：**
```json
{
  "success": false,
  "error": {
    "code": "MATCH_TIMEOUT",
    "message": "匹配超时，暂时没有找到合适的对戏伙伴",
    "details": {
      "waitedSeconds": 60,
      "suggestion": "可以先进行单人反应，稍后系统会通知你匹配结果"
    }
  },
  "meta": { "timestamp": "2026-04-20T10:02:00Z", "requestId": "req_123" }
}
```

**常见错误码：**
- `UNAUTHORIZED`: 未登录
- `IDENTITY_REQUIRED`: 需要选择身份标签
- `MATCH_TIMEOUT`: 匹配超时
- `MATCH_CANCELLED`: 匹配已取消
- `ROOM_NOT_FOUND`: 房间不存在
- `ROOM_CLOSED`: 房间已关闭
- `NOT_YOUR_TURN`: 多人模式中不是当前用户的回合
- `ALREADY_SPARKED`: 消息已被标记为火花
- `RATE_LIMITED`: 操作过于频繁

---

## 六、数据模型设计

### 6.1 Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
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
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联
  accounts     Account[]
  sessions     Session[]
  identities   UserIdentity[]
  reactions    Reaction[]
  roomParticipants RoomParticipant[]
  stories      StoryDraft[]
  brainholes   Brainhole[]     @relation("BrainholeAuthor")
}

model UserIdentity {
  id        String   @id @default(cuid())
  userId    String
  label     String   // "急诊科医生"
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, label])
}

// ==================== 标签系统 ====================

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String?  // "医疗", "法律" 等分类
  createdAt DateTime @default(now())

  brainholes BrainholeTag[]
}

// ==================== 脑洞（冲突情境） ====================

model Brainhole {
  id          String   @id @default(cuid())
  title       String
  scenario    String   // 冲突情境描述
  contextTime String?  // 情境时间
  contextLocation String?  // 情境地点
  contextCharacters String?  // JSON 数组
  difficulty  String   @default("medium") // easy | medium | hard
  source      String   @default("user")   // user | ai | admin
  status      String   @default("active") // active | pending | archived
  reactionCount Int    @default(0)
  sparkCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联
  authorId String?
  author   User?   @relation("BrainholeAuthor", fields: [authorId], references: [id])
  
  tags       BrainholeTag[]
  reactions  Reaction[]
  rooms      Room[]
  matches    MatchRequest[]

  @@index([status])
  @@index([difficulty])
}

model BrainholeTag {
  id          String @id @default(cuid())
  brainholeId String
  tagId       String

  brainhole Brainhole @relation(fields: [brainholeId], references: [id], onDelete: Cascade)
  tag       Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([brainholeId, tagId])
}

// ==================== 反应 ====================

model Reaction {
  id            String   @id @default(cuid())
  content       String
  identity      String   // 用户选择的身份标签
  mediaUrl      String?  // 语音文件URL
  mediaDuration Float?   // 语音时长（秒）
  isSpark       Boolean  @default(false)
  sparkMarkedBy String?  // 谁标记的火花
  sparkMarkedAt DateTime?
  createdAt     DateTime @default(now())

  // 关联
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  brainholeId String
  brainhole   Brainhole @relation(fields: [brainholeId], references: [id])
  roomId      String?
  room        Room?     @relation(fields: [roomId], references: [id])
  message     RoomMessage?

  @@index([brainholeId, createdAt])
  @@index([roomId, createdAt])
  @@index([userId])
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

  @@index([status, brainholeId])
  @@index([userId, status])
}

// ==================== 房间 ====================

model Room {
  id          String   @id @default(cuid())
  type        String   @default("duet") // duet | group
  brainholeId String
  status      String   @default("created") // created | active | closed | archived
  scene       String?  // 多人模式当前场景
  round       Int      @default(0)  // 多人模式当前回合
  createdAt   DateTime @default(now())
  closedAt    DateTime?

  brainhole    Brainhole         @relation(fields: [brainholeId], references: [id])
  participants RoomParticipant[]
  messages     RoomMessage[]
  reactions    Reaction[]

  @@index([status, type])
}

model RoomParticipant {
  id        String    @id @default(cuid())
  roomId    String
  userId    String
  identity  String
  role      String    @default("actor") // actor | director
  isOnline  Boolean   @default(false)
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?

  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
}

model RoomMessage {
  id        String   @id @default(cuid())
  roomId    String
  senderId  String
  content   String
  isSpark   Boolean  @default(false)
  createdAt DateTime @default(now())

  room     Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  reaction Reaction? @relation(fields: [reactionId], references: [id])
  reactionId String? @unique

  @@index([roomId, createdAt])
}

// ==================== 故事草稿 ====================

model StoryDraft {
  id          String   @id @default(cuid())
  userId      String
  title       String
  content     String
  format      String   @default("script") // script | outline | story
  sourceRoomId String?
  sparkIds    String?  // JSON 数组，引用的反应ID
  status      String   @default("draft") // draft | published | archived
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId, status])
}
```

---

## 七、TDD 测试策略

### 7.1 测试工具

- **Vitest**：单元测试 + API 测试
- **React Testing Library**：组件测试
- **Playwright**：E2E 测试（关键流程）
- **MSW (Mock Service Worker)**：API Mock

### 7.2 测试原则

- **TDD 流程**：先写测试 → 测试失败（Red）→ 写最少代码通过（Green）→ 重构（Refactor）
- **测试命名**：`should [expected behavior] when [condition]`
- **覆盖率目标**：核心逻辑 ≥ 80%，API 接口 100% 覆盖

### 7.3 核心测试用例

#### 7.3.1 组件测试

**BrainholeCard 组件：**
```typescript
describe('BrainholeCard', () => {
  it('should render title and scenario correctly', () => {
    // 渲染卡片，验证标题和描述显示正确
  });

  it('should call onSkip when swiped left beyond threshold', () => {
    // 模拟左滑 > 80px，验证 onSkip 被调用
  });

  it('should call onCollect when swiped right beyond threshold', () => {
    // 模拟右滑 > 80px，验证 onCollect 被调用
  });

  it('should not trigger action when swipe distance is below threshold', () => {
    // 模拟滑动 < 80px，验证无回调触发，卡片回弹
  });

  it('should display tags as pill badges', () => {
    // 验证标签正确渲染为药丸样式
  });

  it('should be accessible with keyboard navigation', () => {
    // 验证键盘可访问性（Tab、Enter、方向键）
  });
});
```

**ReactionInput 组件：**
```typescript
describe('ReactionInput', () => {
  it('should start recording on long press (>300ms)', async () => {
    // 长按麦克风按钮 300ms 以上，验证开始录音
  });

  it('should not start recording on quick tap (<300ms)', async () => {
    // 快速点击，验证不触发录音
  });

  it('should stop recording and show preview on release', async () => {
    // 松开手指，验证停止录音，显示文字预览
  });

  it('should disable submit when content is empty', () => {
    // 空内容时，发送按钮禁用
  });

  it('should clear input after successful submit', async () => {
    // 提交成功后，输入框清空
  });

  it('should show error when recording exceeds 60 seconds', async () => {
    // 录音超过 60 秒，提示并自动停止
  });
});
```

**ChatRoom 组件：**
```typescript
describe('ChatRoom', () => {
  it('should append new message to the bottom of list', () => {
    // 收到新消息，自动追加到列表底部
  });

  it('should scroll to bottom on new message', () => {
    // 新消息到达，自动滚动到底部
  });

  it('should show spark indicator on sparked message', () => {
    // 火花消息显示 🔥 图标和金色边框
  });

  it('should show AI prompt banner after 30s inactivity', () => {
    // 30 秒无消息，显示 AI 催化提示
  });

  it('should mark message as spark on long press', async () => {
    // 长按消息，弹出菜单，选择标记火花
  });

  it('should show opponent online status', () => {
    // 显示对方在线/离线状态
  });
});
```

#### 7.3.2 API 测试

**脑洞列表 API：**
```typescript
describe('GET /api/brainholes', () => {
  it('should return paginated list of active brainholes', async () => {
    // 返回分页的活跃脑洞列表
  });

  it('should filter by tags when provided', async () => {
    // 按标签筛选，只返回匹配的脑洞
  });

  it('should sort by hot when sort=hot', async () => {
    // 按热度排序
  });

  it('should return empty array when no brainholes match', async () => {
    // 无匹配结果，返回空数组
  });
});

describe('POST /api/brainholes', () => {
  it('should create brainhole with valid data', async () => {
    // 有效数据，返回 201 和新脑洞
  });

  it('should return 401 when user is not authenticated', async () => {
    // 未登录，返回 401
  });

  it('should return 400 when title is missing', async () => {
    // 缺少标题，返回 400
  });

  it('should return 400 when scenario exceeds 2000 chars', async () => {
    // 情境描述超过 2000 字，返回 400
  });
});
```

**反应提交 API：**
```typescript
describe('POST /api/reactions', () => {
  it('should create reaction with identity tag', async () => {
    // 提交反应，包含身份标签
  });

  it('should require identity to be provided', async () => {
    // 缺少身份标签，返回 400
  });

  it('should associate reaction with room when roomId provided', async () => {
    // 提供 roomId，反应关联到房间
  });

  it('should return 404 when brainhole does not exist', async () => {
    // 脑洞不存在，返回 404
  });

  it('should rate limit to 10 reactions per minute', async () => {
    // 1 分钟内超过 10 条，返回 429
  });
});
```

**匹配 API：**
```typescript
describe('POST /api/match/request', () => {
  it('should create match request and return matchId', async () => {
    // 创建匹配请求，返回 matchId
  });

  it('should require identity to be set', async () => {
    // 未设置身份，返回 400
  });

  it('should not allow multiple active match requests', async () => {
    // 已有活跃匹配请求，返回 409
  });
});

describe('GET /api/match/:matchId', () => {
  it('should return matched status when opponent found', async () => {
    // 匹配成功，返回 matched 状态和对方信息
  });

  it('should return timeout status after expiry', async () => {
    // 超时后，返回 timeout 状态
  });

  it('should return 403 when querying other user match', async () => {
    // 查询不属于自己的匹配，返回 403
  });
});
```

**房间 API：**
```typescript
describe('POST /api/rooms/:roomId/spark', () => {
  it('should mark message as spark', async () => {
    // 标记消息为火花
  });

  it('should return 400 if message already sparked', async () => {
    // 消息已被标记，返回 400
  });

  it('should return 403 if user is not in room', async () => {
    // 非房间成员，返回 403
  });
});
```

#### 7.3.3 E2E 测试（Playwright）

```typescript
// tests/e2e/duet-flow.spec.ts
describe('双人对戏完整流程', () => {
  it('should complete full duet flow from match to spark wall', async () => {
    // 1. 用户A登录，设置身份，浏览脑洞，右滑收藏
    // 2. 用户A发起匹配
    // 3. 用户B登录，设置身份，浏览同一脑洞，右滑收藏
    // 4. 用户B发起匹配
    // 5. 双方匹配成功，进入房间
    // 6. 用户A发送消息
    // 7. 用户B收到消息，回复
    // 8. 用户A长按标记火花
    // 9. 一方离开房间
    // 10. 双方查看火花墙
  });
});
```

---

## 八、项目目录结构

```
qunxiang-xinghuo/
├─ package.json
├─ next.config.ts
├─ tsconfig.json
├─ tailwind.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ .env.local
├─ .env.example
├─ README.md
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts                    # 种子数据（初始脑洞、标签）
│
├─ public/
│  ├─ uploads/                   # 用户上传（语音文件）
│  ├─ assets/
│  │  ├─ images/                 # 静态图片
│  │  └─ sounds/                 # 音效
│  └─ favicon.ico
│
├─ src/
│  ├─ app/                       # Next.js App Router
│  │  ├─ layout.tsx              # 根布局（全局导航、主题）
│  │  ├─ page.tsx                # 首页：脑洞大厅
│  │  ├─ providers.tsx           # 全局 Provider 聚合
│  │  │
│  │  ├─ (auth)/                 # 认证相关（路由组）
│  │  │  ├─ login/
│  │  │  │  └─ page.tsx
│  │  │  └─ register/
│  │  │     └─ page.tsx
│  │  │
│  │  ├─ brainhole/
│  │  │  └─ [id]/
│  │  │     └─ page.tsx          # 脑洞详情页（单人模式）
│  │  │
│  │  ├─ match/
│  │  │  └─ page.tsx             # 随机匹配页
│  │  │
│  │  ├─ room/
│  │  │  └─ [roomId]/
│  │  │     ├─ page.tsx          # 双人对戏房间
│  │  │     └─ spark/
│  │  │        └─ page.tsx       # 火花墙
│  │  │
│  │  ├─ multiplayer/
│  │  │  ├─ page.tsx             # 多人副本大厅
│  │  │  └─ [roomId]/
│  │  │     └─ page.tsx          # 导演控场页
│  │  │
│  │  ├─ library/
│  │  │  └─ page.tsx             # 个人素材库
│  │  │
│  │  ├─ profile/
│  │  │  └─ page.tsx             # 个人中心
│  │  │
│  │  ├─ api/                    # API Routes (Route Handlers)
│  │  │  ├─ auth/
│  │  │  │  └─ [...nextauth]/
│  │  │  │     └─ route.ts       # NextAuth.js 配置
│  │  │  ├─ brainholes/
│  │  │  │  ├─ route.ts          # GET / POST 脑洞
│  │  │  │  └─ [id]/
│  │  │  │     └─ route.ts       # GET / PUT / DELETE 单个脑洞
│  │  │  ├─ reactions/
│  │  │  │  └─ route.ts          # GET / POST 反应
│  │  │  ├─ match/
│  │  │  │  ├─ route.ts          # POST 请求匹配
│  │  │  │  └─ [matchId]/
│  │  │  │     └─ route.ts       # GET 查询匹配状态 / DELETE 取消
│  │  │  ├─ rooms/
│  │  │  │  ├─ route.ts          # POST 创建房间
│  │  │  │  └─ [roomId]/
│  │  │  │     ├─ route.ts       # GET 房间信息
│  │  │  │     ├─ messages/
│  │  │  │     │  └─ route.ts    # POST 发送消息
│  │  │  │     └─ spark/
│  │  │  │        └─ route.ts    # POST 标记火花
│  │  │  ├─ ai/
│  │  │  │  ├─ prompt/
│  │  │  │  │  └─ route.ts       # GET AI 催化问题
│  │  │  │  └─ story-weave/
│  │  │  │     └─ route.ts       # POST 故事串联
│  │  │  └─ library/
│  │  │     └─ route.ts          # GET / POST 素材库
│  │  │
│  │  └─ socket/                 # Socket.io 服务端（可选）
│  │     └─ route.ts
│  │
│  ├─ components/                # React 组件
│  │  ├─ ui/                     # shadcn/ui 基础组件
│  │  │  ├─ button.tsx
│  │  │  ├─ card.tsx
│  │  │  ├─ input.tsx
│  │  │  ├─ badge.tsx
│  │  │  ├─ dialog.tsx
│  │  │  ├─ toast.tsx
│  │  │  └─ ...
│  │  │
│  │  ├─ layout/                 # 布局组件
│  │  │  ├─ BottomNav.tsx        # 底部 Tab 导航
│  │  │  ├─ TopBar.tsx           # 顶部导航栏
│  │  │  └─ MobileContainer.tsx  # 移动端安全区域容器
│  │  │
│  │  ├─ brainhole/              # 脑洞相关
│  │  │  ├─ BrainholeCard.tsx    # 脑洞卡片（支持滑动手势）
│  │  │  ├─ BrainholeStack.tsx   # 卡片堆叠容器
│  │  │  ├─ TagFilter.tsx        # 标签筛选栏
│  │  │  └─ ScenarioReader.tsx   # 情境阅读器（展开/收起）
│  │  │
│  │  ├─ reaction/               # 反应相关
│  │  │  ├─ ReactionInput.tsx    # 反应输入（语音/文字）
│  │  │  ├─ VoiceRecorder.tsx    # 语音录制器（波形动画）
│  │  │  ├─ ReactionList.tsx     # 反应列表
│  │  │  └─ SparkButton.tsx      # 火花标记按钮
│  │  │
│  │  ├─ match/                  # 匹配相关
│  │  │  ├─ MatchCard.tsx        # 匹配卡片（自己 vs 对手）
│  │  │  ├─ MatchTimer.tsx       # 匹配计时器
│  │  │  └─ MatchSuccessModal.tsx # 匹配成功弹窗
│  │  │
│  │  ├─ room/                   # 房间相关
│  │  │  ├─ ChatRoom.tsx         # 聊天室核心组件
│  │  │  ├─ MessageBubble.tsx    # 消息气泡
│  │  │  ├─ AIPromptBanner.tsx   # AI 催化提示横幅
│  │  │  ├─ SparkWall.tsx        # 火花墙
│  │  │  ├─ ParticipantList.tsx  # 参与者列表
│  │  │  └─ DirectorControls.tsx # 导演控场按钮
│  │  │
│  │  ├─ identity/               # 身份相关
│  │  │  ├─ IdentitySelector.tsx # 身份选择器
│  │  │  ├─ IdentityBadge.tsx    # 身份标签徽章
│  │  │  └─ IdentitySetupModal.tsx # 身份设置弹窗
│  │  │
│  │  ├─ library/                # 素材库相关
│  │  │  ├─ StoryCard.tsx        # 故事卡片
│  │  │  ├─ SparkCollection.tsx  # 火花合集
│  │  │  └─ StoryWeaver.tsx      # 故事串联生成器
│  │  │
│  │  └─ profile/                # 个人中心
│  │     ├─ UserStats.tsx        # 用户统计
│  │     ├─ LevelBadge.tsx       # 等级徽章
│  │     └─ AchievementList.tsx  # 成就列表
│  │
│  ├─ hooks/                     # 自定义 Hooks
│  │  ├─ useBrainhole.ts         # 脑洞数据管理
│  │  ├─ useReaction.ts         # 反应提交与查询
│  │  ├─ useMatch.ts            # 匹配逻辑（轮询/WebSocket）
│  │  ├─ useRoom.ts             # 房间消息实时同步
│  │  ├─ useVoiceRecorder.ts    # 语音录制
│  │  ├─ useSwipe.ts            # 滑动手势封装
│  │  └─ useAuth.ts             # 认证状态
│  │
│  ├─ lib/                       # 工具库
│  │  ├─ db.ts                   # Prisma 客户端单例
│  │  ├─ auth.ts                 # NextAuth.js 配置
│  │  ├─ socket.ts               # Socket.io 客户端
│  │  ├─ ai/                     # AI 服务封装
│  │  │  ├─ prompt-generator.ts  # 催化问题生成
│  │  │  ├─ story-weaver.ts      # 故事串联生成
│  │  │  └─ speech-to-text.ts    # 语音转文字（多提供商）
│  │  ├─ validators/             # 数据校验
│  │  │  ├─ brainhole.ts
│  │  │  ├─ reaction.ts
│  │  │  └─ match.ts
│  │  └─ utils.ts                # 通用工具（cn 等）
│  │
│  ├─ types/                     # TypeScript 类型定义
│  │  ├─ api.ts                  # API 请求/响应类型
│  │  ├─ models.ts               # 数据模型类型
│  │  ├─ components.ts           # 组件 Props 类型
│  │  └─ enums.ts                # 枚举常量
│  │
│  ├─ server/                    # 服务端逻辑（非 API 路由）
│  │  ├─ match-engine.ts         # 匹配引擎
│  │  ├─ room-manager.ts         # 房间管理
│  │  ├─ ai-catalyst.ts         # AI 催化调度器
│  │  └─ rate-limiter.ts        # 限流器
│  │
│  ├─ styles/
│  │  └─ globals.css             # 全局样式 + Tailwind 指令
│  │
│  └─ __tests__/                 # 测试文件
     ├─ unit/
     │  ├─ components/
     │  │  ├─ BrainholeCard.test.tsx
     │  │  ├─ ReactionInput.test.tsx
     │  │  ├─ ChatRoom.test.tsx
     │  │  └─ SparkWall.test.tsx
     │  ├─ hooks/
     │  │  ├─ useSwipe.test.ts
     │  │  └─ useVoiceRecorder.test.ts
     │  └─ lib/
     │     ├─ match-engine.test.ts
     │     └─ validators.test.ts
     ├─ integration/
     │  ├─ api/
     │  │  ├─ brainholes.test.ts
     │  │  ├─ reactions.test.ts
     │  │  ├─ match.test.ts
     │  │  └─ rooms.test.ts
     │  └─ ai/
     │     └─ prompt-generator.test.ts
     └─ e2e/
        ├─ duet-flow.spec.ts
        ├─ solo-reaction.spec.ts
        └─ multiplayer-flow.spec.ts
```

---

## 九、开发里程碑（MVP）

### Phase 1：基础搭建（Week 1）
- [x] 项目初始化（Next.js + Tailwind + shadcn）
- [x] Prisma + SQLite 配置，Schema 设计
- [x] NextAuth.js 认证接入
- [x] 基础布局组件（BottomNav、TopBar）
- [ ] **TDD**：先写 BrainholeCard 测试 → 实现组件

### Phase 2：单人模式（Week 2）
- [ ] 脑洞列表 API + 页面
- [ ] 脑洞详情页（身份选择 + 反应输入）
- [ ] 语音输入（Web Speech API）
- [ ] 个人素材库页面
- [ ] **TDD**：反应提交 API 测试 → 实现

### Phase 3：双人模式（Week 3）
- [ ] 匹配引擎 + 匹配页面
- [ ] Socket.io 房间实时通信
- [ ] 对戏聊天室 UI
- [ ] 火花标记 + 火花墙
- [ ] **TDD**：房间消息同步测试 → 实现

### Phase 4：AI 与串联（Week 4）
- [ ] AI 催化问题生成
- [ ] 故事串联生成
- [ ] 多人模式基础框架（导演控场）
- [ ] **TDD**：AI 服务测试 → 实现

### Phase 5： polish（Week 5）
- [ ] 交互动画优化
- [ ] E2E 测试覆盖核心流程
- [ ] 性能优化（图片懒加载、虚拟列表）
- [ ] 部署准备

---

## 十、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| AI API 不稳定/昂贵 | AI 催化、故事串联不可用 | 设计本地兜底问题库；大模型可配置切换 |
| 语音转文字精度差 | 用户体验受损 | 优先浏览器原生 API；提供文字编辑修正 |
| 匹配池用户不足 | 双人模式匹配不到人 | 接入 AI 机器人对手；单人模式优先打磨 |
| SQLite 并发瓶颈 | 多人模式卡顿 | 开发期够用；生产环境迁移到 PostgreSQL |
| 用户留存低 | MVP 验证失败 | 强游戏化设计（等级、成就、火花数）；简化流程 |

---

## 十一、总结

《群像·星火》v1.0 MVP 设计文档覆盖了**单人反应、双人对戏、多人共创**三条核心路径，以"真实职业经验碰撞"为差异化卖点，通过 TDD 模式确保代码质量。

**核心优势：**
1. **真实反应资产化**：每条反应带身份标签和时间戳，可追溯、可复用
2. **低门槛高表达**：语音输入为主，左滑右滑游戏化交互
3. **AI 辅助而非替代**：AI 负责催化提问和串联整理，人类负责真实反应
4. **渐进式复杂**：从单人→双人→多人，逐步提升创作复杂度
5. **技术可演进**：SQLite → PostgreSQL、轮询 → WebSocket、单机 → 集群

**关键决策：**
- 身份标签采用"自我声明 + 社区认证"双轨制，降低门槛同时保证质量
- 双人匹配优先基于"同一脑洞 + 不同职业"，确保碰撞效果
- 火花机制由人工标记（而非 AI 判断），保留人类审美
- 故事串联提供多种格式输出，满足不同创作场景

---

*文档版本：v1.0*  
*最后更新：2026-04-28*  
*技术栈：Next.js 15 + App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma + SQLite + Socket.io*
