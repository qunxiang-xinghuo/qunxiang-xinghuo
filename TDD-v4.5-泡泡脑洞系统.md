# TDD 5.0 - 群像·星火 故事大厅模块

> 版本: 5.0
> 日期: 2026-05-02
> 状态: 开发中
> 前置版本: v4.9-fix (已部署)

---

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        首页 (/)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              BubbleCloud 组件                        │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │   │
│  │  │ 泡泡 │ │ 泡泡 │ │ 泡泡 │ │ 泡泡 │ │ 泡泡 │ ...    │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              GET /api/brainholes/bubble                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ 知乎热榜API  │  │ 知乎搜索API  │  │ DeepSeek API        │ │
│  │ getHotList  │  │ zhihuSearch │  │ generateBrainholes  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 合并去重 → 保存数据库 → 返回30个泡泡数据              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、核心文件清单

| 文件 | 职责 |
|------|------|
| `src/app/api/brainholes/bubble/route.ts` | 聚合API：三渠道数据聚合+缓存+持久化 |
| `src/components/bubble-cloud/Bubble.tsx` | 单个泡泡组件：水晶质感+交互 |
| `src/components/bubble-cloud/BubbleCloud.tsx` | 泡泡容器：布局+数据获取+悬停管理 |
| `src/app/globals.css` | 泡泡CSS：玻璃质感+白色文字+弹跳动画 |
| `src/lib/zhihu-dev-api.ts` | 知乎开发者平台客户端 |
| `src/lib/bubble-engine.ts` | 泡泡数据类型定义 |

---

## 三、聚合API设计

### 3.1 接口

```
GET /api/brainholes/bubble?limit=30&refresh=false
```

**参数：**
- `limit`: 返回数量，默认30，范围1-30
- `refresh`: 是否强制刷新（不走缓存），默认false

**响应：**
```json
{
  "success": true,
  "data": {
    "brainholes": [...],
    "total": 30,
    "source": "fresh|cache|db_fallback",
    "breakdown": {
      "zhihuHot": 10,
      "zhihuSearch": 5,
      "deepseek": 8,
      "fallback": 7
    }
  }
}
```

### 3.2 数据聚合流程

```
1. 检查缓存（1小时内生成的数据）
   ├─ 缓存充足 → 直接返回
   └─ 缓存不足 → 继续

2. 并行拉取三渠道数据
   ├─ 知乎热榜: getHotList(15) → 15个热门话题
   ├─ DeepSeek: 基于热榜标题生成10个创意脑洞
   └─ 知乎搜索: 用热榜前3个标题搜索 → 各5个结果

3. 合并去重
   ├─ 按优先级：知乎热榜 > 知乎搜索 > DeepSeek > Fallback
   ├─ 去重规则：标题前20字符相同视为重复
   └─ 目标：至少30个不重复泡泡

4. 保存到数据库
   ├─ upsert操作（已存在则更新热度，不存在则创建）
   ├─ status: approved
   ├─ source: zhihu_hotlist|zhihu_search|deepseek|fallback
   └─ recencyBoost: true

5. 返回数据
```

### 3.3 降级策略

| 场景 | 处理方式 |
|------|---------|
| 知乎热榜API失败 | 使用DeepSeek+Fallback填充 |
| DeepSeek API失败 | 使用知乎热榜+搜索+Fallback填充 |
| 所有API都失败 | 使用30个Fallback数据 |
| 数据库保存失败 | 不影响返回，仅记录错误日志 |
| 数据库查询失败 | 返回API聚合数据 |

### 3.4 Fallback数据

内置30个高质量脑洞，覆盖以下分类：
- medical（医疗）: 6个
- workplace（职场）: 5个
- life（生活）: 12个
- education（教育）: 3个
- legal（法律）: 2个
- emergency（紧急）: 2个

---

## 四、泡泡视觉设计

### 4.1 质感规格

| 属性 | 值 | 实现方式 |
|------|-----|---------|
| 主体质感 | 玻璃/水晶 | `radial-gradient` 多层叠加 |
| 主高光 | 左上角小而亮 | `radial-gradient` 92%白 → 透明 |
| 次高光 | 右上角微弱 | `radial-gradient` 45%白 → 透明 |
| 底部折射 | 底部柔和光 | `radial-gradient` 12%白 + blur(2px) |
| 边缘描边 | 极细半透明 | `border: 1px solid rgba(255,255,255,0.32)` |
| 五彩光泽 | 低饱和度虹彩 | `conic-gradient` 8色 + `mix-blend-mode: overlay` |
| 光泽流动 | 14秒一圈 | `@keyframes iridescence-flow` |

### 4.2 文字规格

| 属性 | 值 |
|------|-----|
| 颜色 | `#ffffff`（纯白色） |
| 字重 | `700`（bold） |
| 阴影 | 多层：`0 0 6px rgba(0,0,0,0.5)` |
| 截断 | 2行，自适应字号 |
| 悬停放大 | 字号从14% → 18%容器宽度，scale 1.15 |

### 4.3 尺寸规格

| 模式 | 数量 | 直径 | 容器高度 |
|------|------|------|---------|
| compact | 24个 | 40-60px | 260px |
| 完整 | 30个 | 40-60px | 420px |

---

## 五、交互设计

### 5.1 悬停交互

```
鼠标进入泡泡:
  ├─ 当前泡泡: scale 1.3, z-index提升到100
  ├─ 文字同步: 字号增大, scale 1.15
  ├─ 虹彩加速: 14s → 8s
  ├─ 金色发光: box-shadow 添加金色光晕
  ├─ 其他泡泡: scale 0.92（轻微远离）
  └─ Tooltip: 显示标题+场景描述

鼠标离开:
  └─ 所有效果恢复默认
```

### 5.2 点击交互

```
点击泡泡:
  ├─ 触发弹跳动画 (0.5s)
  │   0%   scale(1)
  │   30%  scale(1.5)   ← 最大弹起
  │   50%  scale(0.85)  ← 压扁
  │   70%  scale(1.15)  ← 回弹
  │   85%  scale(0.95)  ← 微调
  │   100% scale(1)     ← 稳定
  └─ 500ms后跳转: /duo-match?brainholeId=xxx
```

### 5.3 鼠标跟随

```
鼠标在泡泡上移动:
  └─ 泡泡向鼠标方向偏移 15%
    offsetX = (mouseX - centerX) * 0.15
    offsetY = (mouseY - centerY) * 0.15
```

### 5.4 漂浮动画

```
每个泡泡独立参数:
  ├─ 周期: 8-18秒（随机）
  ├─ 延迟: 0-5秒（随机）
  ├─ 摆动幅度: 3-15px（随机）
  └─ 轨迹: 8个关键帧的上下+左右复合运动
```

---

## 六、数据库设计

### 6.1 Brainhole模型（已有字段复用）

```prisma
model Brainhole {
  id                String   @id @default(cuid())
  title             String
  scenario          String
  source            String   @default("user")  // zhihu_hotlist|zhihu_search|deepseek|fallback
  status            String   @default("pending") // approved
  hotScore          Float    @default(0)
  recencyBoost      Boolean  @default(true)
  category          String   @default("general")
  difficulty        String   @default("medium")
  reactionCount     Int      @default(0)
  sparkCount        Int      @default(0)
  collectionCount   Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 6.2 缓存策略

| 层级 | 策略 | 有效期 |
|------|------|--------|
| 数据库缓存 | 1小时内生成的approved脑洞 | 1小时 |
| API响应 | 无浏览器缓存 (`cache: 'no-store'`) | 即时 |
| 强制刷新 | `?refresh=true` 跳过缓存 | 即时 |

---

## 七、环境变量要求

| 变量名 | 用途 | 必填 |
|--------|------|------|
| `ZHIHU_API_KEY` | 知乎开发者平台Access Secret | 是（热榜/搜索） |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | 是（创意生成） |
| `DATABASE_URL` | SQLite数据库路径 | 是 |

---

## 八、已知限制与注意事项

1. **知乎API 405错误**: 若知乎API返回405，fallback数据会自动填充
2. **DeepSeek速率限制**: 每次请求最多生成10个脑洞，超时30秒
3. **中文引号问题**: 代码中禁止使用中文引号（""），会导致JS解析失败
4. **BubbleCloud调用新API**: 已切换从 `/api/brainholes?mode=bubble` 到 `/api/brainholes/bubble`
5. **部署脚本更新**: 新增文件需手动加入 `scripts/deploy_all.py` 的 FILES 列表

---

## 九、Bug修复记录 (v4.5-fix)

### 修复1: 泡泡位置限制
**问题**: tooltip (`-top-10` 绝对定位) 溢出 `overflow-hidden` 容器，被截断看不见
**修复**: 将外部 tooltip 改为泡泡**内部信息层**——悬停时在泡泡内部显示半透明遮罩+标题+场景描述，完全不受容器边界限制
**文件**: `src/components/bubble-cloud/Bubble.tsx`

### 修复2: 匹配失败日志排查
**问题**: 匹配流程缺少日志，无法定位失败原因
**修复**: 
- `src/app/api/match/route.ts`: 添加6处日志（开始匹配、userId、请求体、验证通过、findMatch调用、成功/失败返回、错误详情）
- `src/server/match-engine.ts`: 添加8处日志（findMatch开始、已有匹配、创建请求、查找匹配、匹配到用户、随机抽取brainholeId、房间创建成功、未找到匹配）
- `src/hooks/useSocket.ts`: 添加连接地址确认日志（`window.location.origin`）

### 修复3: 返回键与导航栏
**问题**: TopBar 组件 `showBack=true` 但未传 `onBack` 时，点击返回按钮报错
**修复**: 
- `src/components/layout/TopBar.tsx`: 引入 `useRouter`，当 `onBack` 未传入时默认使用 `router.back()`
- 影响页面: duo-match / duo-waiting / duo-timeout / room（这些页面都用了 `showBack` 但未全部传 `onBack`）
- BottomNav 已在 `src/app/layout.tsx` 全局挂载，无需修改

---

## 十、测试检查清单

- [x] 泡泡数量达到24-30个
- [x] 泡泡具有晶莹剔透的水晶质感
- [x] 文字白色加粗，悬停时文字同步放大
- [x] 点击弹跳动画 scale 1.5 → 1.0
- [x] 点击后跳转身份选择页（带brainholeId）
- [x] 悬停时其他泡泡轻微远离
- [x] 鼠标跟随偏移效果
- [x] 聚合API返回三渠道数据
- [x] 数据保存到数据库
- [x] 1小时缓存机制
- [x] 所有API失败时使用fallback数据
- [x] 泡泡 tooltip 在容器内正常显示（不被截断）
- [x] 匹配API全流程有详细日志输出
- [x] WebSocket连接地址正确（非localhost）
- [x] 所有深层页面返回按钮可用（默认router.back()）
- [x] 底部导航栏全局显示（除登录/注册页）
- [x] 泡泡严格限制在容器内（20px安全边距+减小漂浮幅度）
- [x] 泡泡文字加大清晰（默认size*0.22/悬停size*0.28）
- [x] 身份选择页返回键显式使用router.back()

---

## 十一、v4.6 修复：双人模式无法进入等待页

### 问题描述
**严重Bug**: 用户在身份选择页点击"确认身份，开始匹配"后，如果 `/api/match` 接口调用失败（网络/服务器错误），用户无法进入等待页面，卡在身份选择页。

**根因**: 匹配请求（POST `/api/match`）在身份选择页（`duo-match`）同步发起，成功后才跳转等待页。一旦请求失败，用户无处可去。

### 修复方案

#### 1. 流程重构：匹配请求移至等待页后台发起
**旧流程**: `duo-match` 选身份 → POST匹配API → 成功后跳 `duo-waiting` → 轮询
**新流程**: `duo-match` 选身份 → 直接跳 `duo-waiting` → 渲染UI → 延迟1秒后台POST匹配API → 轮询

#### 2. duo-match/page.tsx 修改
- `handleConfirm` 不再 `fetch('/api/match')`
- 只保存 `identity` 和 `brainholeId` 到 localStorage
- 直接 `router.push('/duo-waiting?brainholeId=xxx')`
- 按钮文案改为"确认身份，进入匹配"

#### 3. duo-waiting/page.tsx 重写（核心）
- **先渲染UI**: 刘看山动画、倒计时、文案立即显示
- **延迟1秒后后台请求**: `setTimeout(1000ms)` 后异步 `POST /api/match`
- **失败静默处理**: try-catch 包裹，失败仅 `console.error`，不弹alert，倒计时继续
- **独立倒计时**: 无论匹配请求是否成功，10秒倒计时始终运行
- **独立轮询**: 只有获得 `matchId` 后才开始轮询 `/api/match/${matchId}`
- **身份检查**: 进入时检查 `xh_duo_identity`，丢失则跳转 duo-match

#### 4. duo-timeout/page.tsx 适配
- "继续等待"按钮跳转 `/duo-waiting?round=2`（不再依赖 matchId）
- 等待页会重新发起匹配请求

#### 5. /api/match 接口加强
- 请求体解析失败时返回 400 + 明确错误消息
- `identity` 缺失时返回 400 + "缺少身份参数"
- Zod 验证错误时返回具体字段错误信息
- 全流程 `console.log` 打印 brainholeId、identity、mode 等关键参数

### 文件变更
| 文件 | 变更 |
|------|------|
| `src/app/duo-match/page.tsx` | 去掉POST匹配逻辑，直接跳转等待页 |
| `src/app/duo-waiting/page.tsx` | 重写：先渲染UI，延迟后台请求匹配 |
| `src/app/duo-timeout/page.tsx` | 继续等待跳转适配新流程 |
| `src/app/api/match/route.ts` | 加强日志和参数验证错误处理 |
| `src/lib/bubble-client.ts` | 新增（v4.5-fix4时创建） |

### 测试检查清单
- [ ] 点击【双人模式】→ 选身份 → 确认 → 立即看到等待页UI
- [ ] 点击泡泡 → 选身份 → 确认 → 立即看到等待页UI
- [ ] 等待页先显示刘看山动画和倒计时
- [ ] 1秒后后台发起匹配请求（Network面板可见）
- [ ] 匹配请求失败时，页面不崩溃，倒计时继续
- [ ] 10秒超时后正确跳转超时选择页
- [ ] 超时页"继续等待"可重新进入等待页
- [ ] 匹配成功时正确跳转对白实验室


---

## 十二、v4.7 修复：泡泡视觉效果 + AI房间创建失败

### 修复1: 泡泡视觉效果

**问题**:
1. 泡泡有实色边框 `border: 1px solid rgba(255,255,255,0.32)`，看起来像套圈
2. 泡泡结构嵌套多层div（bubble-body > iridescence + highlight + caustic + 文字），有套圈感
3. 漂浮动画复杂（8关键帧+左右摆动），显得僵硬
4. 点击弹跳幅度过大（scale 1.5）

**修复**:
- `Bubble.tsx`: 简化为单层div，所有效果用CSS伪元素(::before, ::after)和背景实现
- `globals.css`: 
  - 去掉实色border，改用极淡box-shadow模拟边缘
  - 五彩光泽用 `::before` 伪元素 + conic-gradient，饱和度极低（0.07-0.10）
  - 左上角高光用 `::after` 伪元素
  - 漂浮动画简化为纯上下浮动 `translateY(-10px)`，周期2-4秒
  - 点击弹跳简化为 `scale(1.15) -> 0.95 -> 1.05 -> 1`

**文件**: `src/components/bubble-cloud/Bubble.tsx`, `src/app/globals.css`

### 修复2: AI房间创建失败

**问题描述**: 用户在双人模式超时后点击"是，与刘看山对白"，提示"创建AI房间失败"。

**根因诊断**:
- `RoomParticipant` 模型有外键约束：`user User @relation(fields: [userId], references: [id])`
- 创建AI房间时，用户userId可能是 `guest-${Date.now()}`（不在User表中）
- AI的userId是 `"liu_kanshan_ai"`（不在User表中）
- Prisma 插入 RoomParticipant 时外键校验失败，导致整个事务回滚

**修复**:
- `src/app/api/rooms/ai/route.ts`: 创建 RoomParticipant 之前，先 `db.user.upsert()` 确保用户记录存在
  - 当前用户：`{id, name: identity, email: "${id}@guest.local"}`
  - AI用户：`{id: "liu_kanshan_ai", name: "刘看山", email: "liu_kanshan_ai@system.local"}`
- 添加全流程日志（14处），方便排查
- `src/app/duo-timeout/page.tsx`: 加强前端错误处理和日志

**DeepSeek API配置**:
- 当前 `.env` 中无 `DEEPSEEK_API_KEY`
- `/api/ai/chat` 有fallback处理（无key时返回随机回复）
- 如需接入DeepSeek，需在 `.env` 中添加 `DEEPSEEK_API_KEY=sk-...`

### 文件变更
| 文件 | 变更 |
|------|------|
| `src/components/bubble-cloud/Bubble.tsx` | 简化结构：单层div+伪元素 |
| `src/components/bubble-cloud/BubbleCloud.tsx` | 去掉swayAmplitude传递 |
| `src/app/globals.css` | 重写泡泡样式：无border、伪元素高光、简化漂浮 |
| `src/app/api/rooms/ai/route.ts` | upsert用户修复外键约束，加日志 |
| `src/app/duo-timeout/page.tsx` | 加强前端错误处理和日志 |

### 测试检查清单
- [ ] 泡泡没有实色边框，看起来是独立的晶莹剔透个体
- [ ] 泡泡有轻微上下浮动（幅度约10px）
- [ ] 点击泡泡有轻微弹跳动画
- [ ] 超时后点击"是，与刘看山对白"成功创建AI房间
- [ ] AI房间创建成功后正确跳转到对白实验室
- [ ] 与刘看山AI能正常对话


---

## 十三、v4.7-fix2 修复：transform冲突 + 漂浮周期

### 自检发现的问题

**问题1: CSS transform冲突**
- `.bubble-glass` 同时有 `animation: bubble-float-updown`（transform: translateY）和 `:hover transform: scale(1.15) translateY(-8px)`
- CSS中 animation 会覆盖 static transform，导致 hover 放大和点击弹跳都**不生效**
- **这是之前反复修改但一直没发现的核心bug**

**问题2: 漂浮周期过长**
- 原代码 `floatDuration = 6 + Math.random() * 8`（6-14秒）
- 用户要求2-4秒

### 修复方案

**分离漂浮层与视觉层**:
```
Bubble.tsx 结构:
motion.div (定位+入场动画)
  └── .bubble-float-wrapper (漂浮: translateY)
        └── .bubble-glass (晶莹质感+hover scale+点击弹跳)
              └── .bubble-text (文字)
```

- `.bubble-float-wrapper`: 只负责 `animation: bubble-float-updown`（translateY上下浮动）
- `.bubble-glass`: 只负责 `transition: transform` + `:hover transform: scale(1.15) translateY(-8px)` + `.bubble-pop animation`
- 两者transform互不干扰

**漂浮周期调整**:
- `floatDuration`: 6-14秒 → **2-4秒**
- `floatDelay`: 0-4秒 → **0-3秒**

### 文件变更
| 文件 | 变更 |
|------|------|
| `src/components/bubble-cloud/Bubble.tsx` | 添加 `.bubble-float-wrapper` 层 |
| `src/components/bubble-cloud/BubbleCloud.tsx` | 漂浮周期2-4秒，延迟0-3秒 |
| `src/app/globals.css` | 分离 `.bubble-float-wrapper` 和 `.bubble-glass` 的transform |

### 经验教训
1. **CSS animation和transform的冲突**：当同一个元素同时有 `animation: transform(...)` 和 `transform: ...` 或另一个 `animation: transform(...)` 时，后者会覆盖前者。
2. **解决方案**：将不同方向的transform分离到不同层（父元素做translateY，子元素做scale）。
3. **自检的重要性**：这个问题之前修改了多次都没发现，只有系统性地逐层检查CSS才暴露出来。

### 测试检查清单
- [ ] 泡泡有轻微上下浮动（幅度约10px，周期2-4秒）
- [ ] 鼠标悬停时泡泡**确实**放大1.15倍 + 上浮8px
- [ ] 悬停时文字**确实**从10px放大到14px
- [ ] 点击泡泡时有轻微弹跳动画
- [ ] 点击弹跳期间漂浮动画不中断


---

## 十四、v4.8 修复：泡泡晶莹质感 + AI对话真实化

### 修复1: 泡泡样式

**问题**:
1. 泡泡像实心圆球，缺少透明质感
2. 默认文字大小不统一
3. 悬停时单独放大文字，效果不自然

**修复**:
- `globals.css`:
  - 背景简化为 `rgba(255,255,255,0.04)` + `backdrop-filter: blur(5px)` 毛玻璃效果
  - 去掉复杂的 `radial-gradient` 多层背景（保留 `::before` 五彩光泽和 `::after` 高光点，降低不透明度）
  - 默认文字: `font-size: 0.75rem`（12px）
  - 悬停: 统一 `transform: scale(1.15)`，不单独改文字大小（文字随整体scale一起变大）
  - 去掉 `translateY(-8px)`，避免与漂浮动画叠加时视觉混乱
  - 边缘: 极淡 `box-shadow` 模拟水珠发光，无实色border

### 修复2: AI对话真实化

**问题**:
1. 刘看山回复全是套话，像机器人
2. 每次对话都是独立的，没有上下文记忆
3. 只调用单一API（DeepSeek），没有备用方案

**修复**:

**System Prompt 重写**:
```
你是刘看山，一位温暖、治愈、富有生活阅历的对话伙伴...

绝对禁止：
- 不要说"这是一个很好的问题"
- 不要像客服那样礼貌而空洞
- 不要用排比句和宏大叙事
- 不要总结概括对方的观点
- 不要说教，不要给人生建议
- 不要说"我理解你的感受"这种正确的废话
```

**双API调用**:
- `/api/ai/chat/route.ts` 同时调用 **DeepSeek API** + **知乎直答 API**
- 优先使用 DeepSeek 结果
- DeepSeek 失败时，自动 fallback 到知乎直答
- 两个都失败时，返回预设 fallback 回复

**历史上下文**:
- `room/[id]/page.tsx` 的 `generateAIReply` 收集最近 **10条** 历史消息
- 作为 `messages` 数组传给 `/api/ai/chat`
- AI回复基于完整对话上下文，更连贯、更像真人

**环境变量检查**:
- 代码已正确使用 `process.env.DEEPSEEK_API_KEY` 读取环境变量，无硬编码
- `.env` 中当前有 `ZHIHU_API_KEY`，无 `DEEPSEEK_API_KEY`
- 知乎直答可正常工作，DeepSeek 需手动配置 key

### 文件变更
| 文件 | 变更 |
|------|------|
| `src/app/globals.css` | 重写泡泡样式：毛玻璃+简化背景+0.75rem文字 |
| `src/app/api/ai/chat/route.ts` | 重写：System Prompt+双API调用+日志 |
| `src/app/room/[id]/page.tsx` | generateAIReply带上最近10条历史消息 |

### 测试检查清单
- [ ] 泡泡是透明的，背景可以透过来
- [ ] 泡泡有 `backdrop-filter: blur(5px)` 毛玻璃效果
- [ ] 泡泡没有实色边框，边缘是极淡发光
- [ ] 默认文字 0.75rem（12px），小巧精致
- [ ] 悬停时整体 scale(1.15)，文字随整体一起变大
- [ ] 与刘看山对话不再像机器人
- [ ] 刘看山能记住之前的对话内容（上下文连贯）
- [ ] 浏览器控制台有 `[AI Chat]` 日志，显示调用的API来源

---

## 环境变量配置说明

服务器 `.env` 文件路径：`/www/wwwroot/qunxiang-xinghuo/.env`

当前已配置：
```
ZHIHU_API_KEY="*已脱敏，服务器.env中配置*"
```

如需接入 DeepSeek AI，请添加：
```
DEEPSEEK_API_KEY="sk-your-deepseek-api-key-here"
```

配置后执行：`pm2 restart qunxiang-xinghuo`


---

## v4.8-fix 修复记录（2026-04-29）

### 修复一：泡泡样式精简

**问题**：泡泡太大（40-60px），文字也太大（0.75rem），不够灵动精巧。

**修复内容**：
1. `BubbleCloud.tsx`：泡泡尺寸从 `56 + hotScore/10` 缩小到 `24 + hotScore/20`，上限从 `52/64px` 改为 `28/32px`（约25-30px范围）
2. `globals.css`：`.bubble-text` 从 `0.75rem` 缩小到 `0.65rem`，行高微调为 `1.15`
3. `globals.css`：`.bubble-glass` 添加半透明描边 `border: 1px solid rgba(255, 255, 255, 0.2)`，保留原有毛玻璃质感
4. 随机浮动动画已在 v4.7-fix2 中实现（每个泡泡独立 `floatDuration` 和 `floatDelay`）

**关键教训**：泡泡尺寸直接决定整体视觉密度，小尺寸+半透明描边比大尺寸+无描边更显精致。

### 修复二：AI对话系统强化

**问题**：刘看山对话仍有机器人感；System Prompt 不够具体；欢迎消息太客气。

**修复内容**：
1. `/api/ai/chat/route.ts`：全面重写 `LIUKANSHAN_SYSTEM_PROMPT`
   - 人设更具体："一个真实存在过的人——不是AI，不是客服，不是人生导师"
   - 语气要求：像朋友发微信，允许有错别字，允许"嗯..."停顿
   - 新增禁止项："作为AI助手..."、"每个人都有自己的选择"、任何形式的总结概括
   - 明确要求"第一句就要落地，不要铺垫"
2. `/api/rooms/ai/route.ts`：欢迎消息从客套的"你好！我是刘看山..."改为自然的 `"{topic}"...这个话题我正好有点想法。你先说，我听着。`
3. 双API并行（DeepSeek+知乎直答）和10条历史上下文已在 v4.8 中实现，本次未改动

### 修复三：素材沉淀自动保存

**问题**：对白结束后，对话记录没有自动存入用户素材库，需要用户手动点击"存素材库"。

**修复内容**：
1. `room/[id]/page.tsx`：
   - 新增 `saveAssetInternal()` 内部保存函数，使用 `assetSavedRef` 防止重复保存
   - 新增 `handleEndChat()`：点击"结束对撞"按钮时先保存对白，再跳转到 `/library`
   - 新增组件卸载自动保存：`useEffect` cleanup 中使用 `keepalive: true` 的 fetch，确保用户直接退出浏览器时也能触发保存
   - 新增"结束对撞"按钮（红色，带 XCircle 图标）
2. `profile/page.tsx`：菜单列表新增【我的素材】入口（BookOpen图标），点击跳转到 `/library`
3. `/api/assets/route.ts` 和 `/api/assets/public` 已存在，无需修改

**关键教训**：
- `keepalive: true` 的 fetch 可以在页面卸载时保证请求发出（比 `sendBeacon` 更灵活，支持自定义 headers）
- `useRef` 配合 `useState` 是防止重复保存的可靠模式（ref 在 cleanup 中同步可读，state 用于UI反馈）

### 修复四：底部导航栏恢复

**问题**：深层页面（对白室、等待页等）底部导航栏消失；部分页面缺少返回键。

**根因分析**：
- `MobileContainer` 内部 `motion.div` 是 `h-full flex flex-col`，包含 page content + `BottomNav`
- 深层页面的 page content 也是 `h-full flex flex-col`，在 flex 容器中 `h-full` 会占据100%父容器高度，把 `BottomNav` 挤出可视区域
- 由于外层容器 `overflow-hidden`，被挤出的 `BottomNav` 被截断不可见

**修复内容**：
1. `MobileContainer.tsx`：移除外层 `div`（`h-full w-full max-w-md mx-auto bg-xh-primary relative overflow-hidden`），改为纯 `AnimatePresence` + `motion.div` wrapper
2. `layout.tsx`：新增外层结构
   ```tsx
   <div className="h-full w-full max-w-md mx-auto bg-xh-primary relative overflow-hidden flex flex-col">
     <MobileContainer className="flex-1 min-h-0 overflow-hidden">
       {children}
     </MobileContainer>
     <BottomNav />
   </div>
   ```
3. 效果：
   - `BottomNav` 在 `AnimatePresence` 外面，切换页面时不再跟着做 exit/enter 动画
   - page content 被限制在 `flex-1 min-h-0 overflow-hidden` 的 motion.div 中，不会和 `BottomNav` 抢占空间
   - 所有深层页面的 `h-full` 会取 motion.div 的高度，内部滚动正常

**返回键检查**：
- `room/[id]/page.tsx`：已有 `TopBar showBack`
- `duo-match/page.tsx`：已有 `TopBar showBack`
- `duo-waiting/page.tsx`：已有 `TopBar showBack`
- `duo-timeout/page.tsx`：已有 `TopBar showBack`
- `library/page.tsx` 和 `profile/page.tsx` 是顶层导航页面，未加返回键（通过底部导航即可返回）

### 文件变更汇总

| 文件 | 变更 |
|------|------|
| `src/components/bubble-cloud/BubbleCloud.tsx` | 泡泡尺寸缩小：24+hotScore/20，上限28/32px |
| `src/app/globals.css` | 文字0.65rem、半透明描边border、padding缩小 |
| `src/app/api/ai/chat/route.ts` | System Prompt全面重写，更真实更具体 |
| `src/app/api/rooms/ai/route.ts` | 欢迎消息更自然，不再客套 |
| `src/app/room/[id]/page.tsx` | 自动保存+结束对撞按钮+keepalive fetch |
| `src/app/profile/page.tsx` | 新增【我的素材】菜单入口 |
| `src/components/layout/MobileContainer.tsx` | 移除外层div，改为纯AnimatePresence wrapper |
| `src/app/layout.tsx` | 新增flex-col外层结构，BottomNav在AnimatePresence外 |

### 环境变量

服务器 `.env` 已配置：
```
DEEPSEEK_API_KEY="*已脱敏，服务器.env中配置*"
ZHIHU_API_KEY="*已脱敏，服务器.env中配置*"
```

配置后执行：`pm2 restart qunxiang-xinghuo`


---

## v4.9 整体视觉统一与体验优化（2026-04-29）

### 整体规划背景

经过 v4.2-v4.8 的功能迭代，核心功能（泡泡、双人模式、AI对话、素材库）已基本完善，但视觉和体验层面存在明显问题：
1. 刘看山CSS形象在3处重复（Welcome/等待/超时）
2. 所有页面硬编码 `bg-[#1a1a2e]`，视觉单调
3. 消息气泡无入场动画，聊天体验生硬
4. 空状态、加载状态不够精致
5. 交互缺少按压反馈

本次升级目标：**统一视觉语言 + 提升交互质感 + 组件化重构**

---

### 一、组件化重构

#### 1. `LiuKanshanAvatar` 组件
**文件**：`src/components/layout/LiuKanshanAvatar.tsx`（新建）

**功能**：
- 统一刘看山形象，支持4种尺寸（sm/md/lg/xl）
- 支持4种情绪状态（neutral/happy/thinking/sleepy）
- 支持开关动画（idle弹跳）
- 替换以下重复代码：
  - `LiuKanshanWelcome.tsx` 中的内联CSS
  - `duo-waiting/page.tsx` 中的内联CSS
  - `duo-timeout/page.tsx` 中的内联CSS

**设计参数**：
- 尺寸通过 `sizeMap` 统一计算（容器、耳朵、眼睛、嘴巴、腮红比例）
- 情绪影响眼睛颜色和嘴巴颜色
- `sleepy` 状态眼睛半透明

#### 2. `page-gradient` 全局样式
**文件**：`src/app/globals.css`

```css
.page-gradient {
  background: linear-gradient(180deg, #1a1a2e 0%, #1a1a2e 60%, #16213e 100%);
}
```

**应用范围**：所有页面统一使用，替代死板的纯色背景，增加微妙的底部层次。

#### 3. 全局交互反馈样式
**文件**：`src/app/globals.css`

```css
.press-feedback:active { transform: scale(0.96); }
```

**应用范围**：所有可点击卡片、按钮。

---

### 二、动效增强

#### 1. 消息气泡入场动画
**文件**：`src/components/room/MessageBubble.tsx`

使用 `framer-motion` 的 `motion.div` 包装每条消息：
- 我方消息：`initial={{ opacity: 0, x: 30, scale: 0.9 }}`
- 对方消息：`initial={{ opacity: 0, x: -30, scale: 0.9 }}`
- 动画类型：`spring`，`stiffness: 200, damping: 18`
- 按消息索引延迟：`delay: index * 0.03`

**效果**：消息发送/接收时有自然的弹性滑入效果，不再生硬出现。

#### 2. 底部导航栏微动画
**文件**：`src/components/layout/BottomNav.tsx`

- active 图标增加 `y: [0, -2, 0]` 微弹跳
- 新增 `layoutId="bottom-nav-indicator"` 小圆点指示器，切换时有弹簧动画
- 按钮增加 `whileTap={{ scale: 0.9 }}` 按压反馈

#### 3. 页面元素动画
- **首页模式卡片**：`whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}`
- **Profile 菜单项**：`whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}`
- **Profile 头像**：`whileHover={{ scale: 1.05 }}`，增加阴影
- **Story 占位页**：全套 framer-motion 入场动画（头像、标题、功能卡片依次入场）

---

### 三、页面级视觉优化

| 页面 | 优化内容 |
|------|---------|
| 登录页 | `page-gradient` 背景 |
| 注册页 | `page-gradient` 背景 + 返回键保持原样 |
| 首页 | `page-gradient` + 模式卡片按压反馈 + 图标微动效 |
| 等待页 | `page-gradient` + `LiuKanshanAvatar` 组件（thinking/happy情绪） |
| 超时页 | `page-gradient` + `LiuKanshanAvatar` 组件（sleepy情绪） |
| 对白室 | `page-gradient` + 消息入场动画 + 输入框 `caret-xh-gold` + 底部半透明毛玻璃 |
| 素材库 | `page-gradient` + 空状态动画 + 卡片 hover 效果 + 按压反馈 |
| 故事页 | `page-gradient` + `LiuKanshanAvatar` + 全套入场动画 + 图标化功能卡片 |
| 我的 | `page-gradient` + 头像阴影 + 菜单微动效 |

---

### 四、关键设计决策

#### 为什么不把所有 `bg-[#1a1a2e]` 都替换？
- **Modal 弹窗**（`DuoIdentityModal`、`BubbleDetailModal`）保持 `bg-[#1a1a2e]`，因为弹窗需要更暗的背景与页面区分层次
- **底部导航栏**保持 `bg-[#1a1a2e]/95`，因为导航栏需要略微透明以展示底层内容

#### 为什么使用 `page-gradient` 而不是 Tailwind 的 `bg-gradient-to-b`？
- 需要在 CSS 中统一定义，方便后续全局调整
- 避免每个页面重复写冗长的 gradient class

#### 消息动画使用 framer-motion 而不是 CSS keyframes？
- framer-motion 的 `spring` 物理动画更自然
- 支持按索引延迟，新消息依次入场
- 支持按方向区分（我方/对方不同方向）

---

### 五、文件变更汇总

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/components/layout/LiuKanshanAvatar.tsx` | 新增 | 刘看山形象统一组件 |
| `src/components/layout/LiuKanshanWelcome.tsx` | 修改 | 使用 LiuKanshanAvatar 组件 |
| `src/components/room/MessageBubble.tsx` | 修改 | framer-motion 入场动画 |
| `src/components/room/ChatRoom.tsx` | 修改 | 传递 index + 输入框 caret 颜色 |
| `src/components/layout/BottomNav.tsx` | 修改 | 微弹跳动画 + 指示器 |
| `src/app/globals.css` | 修改 | page-gradient + press-feedback + 动画keyframes |
| `src/app/home/page.tsx` | 修改 | page-gradient + 按压反馈 |
| `src/app/LoginForm.tsx` | 修改 | page-gradient |
| `src/app/register/page.tsx` | 修改 | page-gradient |
| `src/app/duo-match/page.tsx` | 修改 | page-gradient |
| `src/app/duo-waiting/page.tsx` | 修改 | page-gradient + LiuKanshanAvatar |
| `src/app/duo-timeout/page.tsx` | 修改 | page-gradient + LiuKanshanAvatar |
| `src/app/room/[id]/page.tsx` | 修改 | page-gradient + loading fallback |
| `src/app/library/page.tsx` | 修改 | page-gradient + 空状态动画 + 卡片样式 |
| `src/app/story/page.tsx` | 重写 | 全套动画 + LiuKanshanAvatar + 图标化 |
| `src/app/profile/page.tsx` | 修改 | page-gradient + 头像阴影 + 菜单微动效 |

---

### 六、已知问题与后续规划

**已解决**：
- 刘看山形象代码重复 ✅
- 页面背景单调 ✅
- 消息无动画 ✅
- 交互无反馈 ✅
- 空状态粗糙 ✅

**后续可优化**（v5.0 方向）：
1. 首页泡泡区域与模式卡片的视觉过渡可以更强
2. 对白室可以增加"打字中"的更多视觉反馈（如对方头像旁边显示打字动画）
3. 素材库卡片可以展示对白摘要预览
4. 可以增加深色/浅色主题切换
5. PWA 支持（离线可用、添加到主屏幕）


---

## v4.9-fix 紧急UI修复（2026-04-29）

### 修复一：「我的」页面左上角返回键

**问题**：`profile/page.tsx` 的 `TopBar` 只传了 `title="我的"`，没有传 `showBack`，导致左上角没有返回按钮。

**修复**：
```tsx
<TopBar title="我的" showBack onBack={() => router.back()} />
```

**文件**：`src/app/profile/page.tsx`

---

### 修复二：「我的」页面用户名与登录名不一致

**问题诊断**：
1. `LoginForm.tsx` 使用 NextAuth 的 `signIn('credentials', ...)` 登录，成功后只执行了 `router.push('/home')`，**没有把用户信息保存到 localStorage**
2. `useAuth.ts` 从 `localStorage.getItem('xh_user')` 读取用户，由于登录时没写入，读取结果为 `null`
3. 当 `xh_user` 不存在时，`useAuth` 回退到 `savedIdentity`（从双人模式流程中保存的身份），显示的是身份标签而非登录用户名
4. 如果没有 `savedIdentity`，则显示 "游客用户"

**修复内容**：

**A. `LoginForm.tsx` — 登录成功后保存用户信息到 localStorage**
```tsx
// 登录成功 → 保存用户信息到 localStorage → 跳转
const userData = {
  id: 'user-' + Date.now(),
  name: username.trim(),
  identity: { type: 'real' as const, label: username.trim() },
  level: 1,
  sparkCount: 0,
};
localStorage.setItem('xh_user', JSON.stringify(userData));
router.push('/home');
```

**B. `useAuth.ts` — 增加 NextAuth session 作为 fallback 来源**
- 引入 `useSession` from `next-auth/react`
- 优先级：localStorage `xh_user` > NextAuth session > localStorage `xh_identity`
- 从 session 读取 `name`、`username`、`level`、`sparkCount`，构造 `User` 对象
- 获取到 session 用户后，自动同步到 localStorage，确保后续刷新页面仍可用

**C. `providers.tsx` — 添加 `SessionProvider`**
- `useSession` 必须在 `SessionProvider` 包裹下才能工作
- 原 `providers.tsx` 是空 wrapper，现添加 `SessionProvider`

**关键教训**：
- NextAuth 的 `signIn` 只负责设置 httpOnly cookie，不会自动同步到 localStorage
- 自定义 `useAuth` hook 需要同时支持多种用户来源（localStorage、NextAuth session、临时身份）
- `useSession` 在 SSR 时必须被 `SessionProvider` 包裹，否则返回 undefined 导致 build 失败

---

### 修复三：素材库列表点不开（无详情页）

**问题诊断**：
1. `library/page.tsx` 中的素材卡片只有公开/私密切换按钮，**没有点击跳转事件**
2. 没有素材详情页路由 `/library/[id]`
3. 没有获取单个资产详情的 API `/api/assets/[id]`

**修复内容**：

**A. `library/page.tsx` — 添加点击跳转**
- 素材卡片整体添加 `onClick={() => router.push(`/library/${asset.id}`)}`
- 公开/私密按钮添加 `e.stopPropagation()`，防止点击按钮时触发卡片跳转
- 卡片右侧添加 `ChevronRight` 箭头图标，提示可点击

**B. 新建 `/api/assets/[id]/route.ts` — 获取素材详情**
- GET 接口，根据 asset id 查询数据库
- `include` 嵌套：asset → brainhole + room → messages + participants
- 权限检查：未公开的素材只有所有者可见
- 返回完整素材信息（标题、摘要、消息列表、火花数等）

**C. 新建 `/library/[id]/page.tsx` — 素材详情页**
- 顶部信息卡：展示脑洞标题、摘要、创建时间、消息数、火花数
- 下方对白记录：按时间顺序展示所有 room messages
- 消息气泡样式与对白室一致（我方金色右对齐，对方白色左对齐）
- 火花消息带 Flame 标记
- 加载状态、错误状态、空状态均处理
- 顶部 `TopBar` 带返回键

**文件变更**：
| 文件 | 变更 |
|------|------|
| `src/app/profile/page.tsx` | TopBar 添加 `showBack onBack` |
| `src/app/LoginForm.tsx` | 登录成功后保存 `xh_user` 到 localStorage |
| `src/hooks/useAuth.ts` | 引入 `useSession`，支持 NextAuth session fallback |
| `src/app/providers.tsx` | 添加 `SessionProvider` |
| `src/app/library/page.tsx` | 素材卡片添加 `onClick` 跳转 + ChevronRight 图标 |
| `src/app/api/assets/[id]/route.ts` | 新建：获取素材详情 API |
| `src/app/library/[id]/page.tsx` | 新建：素材详情页 |

---

### 自检记录

**第一次 build 失败**：
- 错误：`TypeError: Cannot destructure property 'data' of 'useSession(...)' as it is undefined`
- 原因：`useSession` 在 SSR 时没有被 `SessionProvider` 包裹，返回 undefined
- 解决：在 `providers.tsx` 中添加 `SessionProvider`
- **教训**：任何使用 `useSession` 的组件，其祖先必须包裹 `SessionProvider`

**第二次 build 成功**：
- 所有 45 个页面正常生成
- 新增 `/api/assets/[id]` 和 `/library/[id]` 路由

---

### 部署状态

服务器 `.env` 已配置 DeepSeek + 知乎 API Key
部署后执行：`pm2 restart qunxiang-xinghuo`


---

# 故事大厅模块规划 (TDD 5.0)

## 一、模块概述

故事大厅是专业创作者与角色扮演者共同构建宏大群像叙事的空间。通过"导演+演员"的协作模式，将短期的思想碰撞，沉淀为有结构、有分支、有角色弧光的长期连载故事。

## 二、核心协作流程

### 故事发起
导演创建项目，设定世界观、时代背景、核心冲突，并定义角色需求、认领人数限制、申请流程及首次对话引导语。

### 角色招募
演员在故事大厅浏览项目，提交认领申请、身份标签及角色理解声明。当所有角色被认领并确认后，项目状态更新为"进行中"。

### 章节推进与决策
导演开启新章节并设定目标，演员基于角色发言。AI实时分析剧情节点，生成多个可能的分支选项供导演发起投票决策。未通过审核的灵感存入"灵感库"备用。

### 资产沉淀
每个章节的完整对白记录、火花墙和剧情分支选项都将存档，并自动串联为故事初稿。

## 三、功能模块规划 (V1.0)

| 模块 | 功能点 |
|------|--------|
| 项目管理 | 创建故事、招募角色、管理章节、编辑世界观 |
| 实时共创 | WebSocket支持、角色身份绑定、导演控场 |
| AI辅助 | NPC角色扮演、分支剧情生成、章节初稿串联 |
| 资产库 | 灵感库、共创故事库、一键打包发布至知乎 |

## 四、页面与路由规划

| 路由 | 页面 | 说明 |
|------|------|------|
| `/story-hall` | 故事广场 | 展示所有招募中的故事项目 |
| `/story-hall/[storyId]` | 故事详情页 | 展示完整需求与角色列表 |
| `/story-hall/[storyId]/room` | 对白实验室 | 核心共创界面，后期可集成白板、语音等功能 |
| `/story-hall/[storyId]/inspirations` | 灵感库 | 存储所有被否决但可复用的灵感 |

## 五、API接口规划

| 方法 | 路由 | 功能 |
|------|------|------|
| POST | `/api/stories` | 导演创建新故事 |
| GET | `/api/stories` | 获取故事列表 |
| POST | `/api/stories/[storyId]/chapters` | 导演开启新章节 |
| POST | `/api/stories/[storyId]/messages` | 发送对白消息 |
| GET | `/api/stories/[storyId]/sparks` | 获取该故事的火花墙 |

## 六、数据库模型规划 (待Prisma迁移)

### Story (故事项目)
- `id`, `title`, `worldview`, `setting`, `conflict`
- `directorId`, `status` (recruiting/ongoing/completed)
- `maxActors`, `currentChapter`, `createdAt`

### StoryRole (角色定义)
- `id`, `storyId`, `name`, `description`, `requirements`
- `claimedBy` (userId), `claimedIdentity`, `status`

### StoryChapter (章节)
- `id`, `storyId`, `title`, `goal`, `order`
- `status`, `createdAt`, `completedAt`

### StoryMessage (章节对白)
- `id`, `chapterId`, `senderId`, `content`, `identity`
- `isSpark`, `createdAt`

### StoryInspiration (灵感库)
- `id`, `storyId`, `content`, `sourceMessageId`, `status`

## 七、开发里程碑

| 阶段 | 目标 | 预计时间 |
|------|------|----------|
| V1.0-alpha | 故事广场 + 创建故事 + 角色招募 | 1周 |
| V1.0-beta | 章节共创 + WebSocket实时通信 | 1周 |
| V1.0-rc | AI辅助 + 灵感库 + 资产沉淀 | 1周 |
| V1.0-ga | 一键发布知乎 + 完整测试 | 3天 |

---

# v5.0-fix 紧急Bug修复记录（2026-05-02）

## 修复一：匹配脑洞重复

**问题**：用户多次进入匹配室，总是分配到同一个脑洞。

**根因**：`match-engine.ts` 中使用 `db.brainhole.findFirst({ orderBy: { hotScore: "desc" } })`，`findFirst` 总是返回排序后的第一个记录（热度最高的），导致每次匹配都选同一个脑洞。

**修复**：改为 `findMany` 获取前50个 approved 脑洞，然后按热度加权随机选择。热度高的脑洞被选中的概率更大，但不是100%。

**涉及文件**：`src/server/match-engine.ts`

## 修复二：个人素材删除

**问题**：用户保存了错误的对白素材，无法删除。

**修复**：
1. 在 `/api/assets/[id]/route.ts` 中添加 `DELETE` 方法
2. 前端素材卡片添加删除按钮（红色 Trash2 图标）
3. 点击后确认弹窗，成功后从本地状态移除

**涉及文件**：`src/app/api/assets/[id]/route.ts`, `src/app/library/page.tsx`

## 修复三：广场素材显示

**问题**：用户将素材设为"公开"后，切换到"广场素材"标签页，看不到刚公开的素材。

**根因**：`library/page.tsx` 的 `togglePublic` 成功后只更新了 `myAssets` 本地状态，没有重新请求 `/api/assets/public`。

**修复**：在 `togglePublic` 成功后，立即 `fetch('/api/assets/public')` 重新加载广场素材列表。

**涉及文件**：`src/app/library/page.tsx`


---

# v5.0-ui 全面诊断与UI整改记录（2026-05-03）

## 一、Bug修复（4项）

### 1. AI房间创建仍用findFirst（脑洞重复）

**问题**：用户超时后选择AI对话，AI房间总是使用最热同一个脑洞。

**修复**：`api/rooms/ai/route.ts` 中未指定脑洞时，改为热度加权随机选择（同match-engine逻辑）。

**涉及文件**：`src/app/api/rooms/ai/route.ts`

### 2. 匹配逻辑忽略用户指定的brainholeId

**问题**：用户从泡泡点击选择了特定脑洞，匹配到的房间使用了完全不同的脑洞。

**根因**：`isQuickMatch = true` 时，`!isQuickMatch && brainholeId` 为false，matchWhere中没有brainholeId限制。

**修复**：新增 `hasExplicitBrainhole = !!brainholeId`，只要用户明确传入brainholeId，就在匹配查询中限制同brainholeId。

**涉及文件**：`src/server/match-engine.ts`

### 3. duo-timeout丢失brainholeId

**问题**：超时后"继续等待"跳转到等待页丢失了用户之前选择的brainholeId。

**修复**：从localStorage读取 `xh_duo_brainhole` 并通过URL参数传递。

**涉及文件**：`src/app/duo-timeout/page.tsx`

### 4. 广场素材卡片不可点击

**问题**：公共素材卡片缺少点击跳转。

**修复**：添加 `onClick` 跳转 `/library/${id}` + `press-feedback` + `cursor-pointer`。

**涉及文件**：`src/app/library/page.tsx`

---

## 二、UI整改（5项）

### 1. 泡泡点击反馈强化

- 新增 `isPressed` 状态，点击时触发光晕扩散
- 新增 `.bubble-pressed` 金色边框+发光阴影
- 新增 `.bubble-selected-glow` 绝对定位光晕层，`bubble-glow-expand` 动画

**涉及文件**：`src/components/bubble-cloud/Bubble.tsx`, `src/app/globals.css`

### 2. 文本对比度提升（WCAG AA）

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| home副标题 | `text-white/30` | `text-white/50` |
| 模式副标题 | `text-white/40` | `text-white/50` |
| "即将开放"标签 | `text-white/30` | `text-white/50` |
| 底部导航未选中 | `text-white/30` | `text-white/40` |
| library标签未选中 | `text-white/30` | `text-white/50` |
| 保存按钮 | `text-white/40` | `text-white/50` |

**涉及文件**：`src/app/home/page.tsx`, `src/components/layout/BottomNav.tsx`, `src/app/library/page.tsx`, `src/app/room/[id]/page.tsx`

### 3. 触控区域44x44dp

| 元素 | 修改前 | 修改后 |
|------|--------|--------|
| 底部导航按钮 | `py-1 px-3` | `min-h-11 min-w-11 py-1 px-2` |
| 顶部返回按钮 | `p-2` | `p-3` |
| 顶部右侧按钮 | `p-2` | `p-3` |
| library标签 | `py-3` | `py-3.5 min-h-11` |
| 素材库小按钮 | `px-2 py-0.5` | `px-3 py-1.5` |
| 删除/公开按钮 | `p-1.5` | 已满足44px容器 |

**涉及文件**：`src/components/layout/BottomNav.tsx`, `src/components/layout/TopBar.tsx`, `src/app/library/page.tsx`, `src/app/room/[id]/page.tsx`

### 4. 响应式布局

- `layout.tsx`: `max-w-md` → `max-w-md sm:max-w-lg`
- 适配平板和桌面端，避免两侧过度空白

**涉及文件**：`src/app/layout.tsx`

### 5. iOS安全区适配

- 新增 `.safe-area-pb` 工具类：`padding-bottom: max(env(safe-area-inset-bottom), 4px)`
- 底部导航栏应用安全区padding

**涉及文件**：`src/app/globals.css`, `src/components/layout/BottomNav.tsx`

### 6. 其他细节

- `duo-match/page.tsx` Suspense fallback 背景：硬编码 `#1a1a2e` → `page-gradient`
- `BottomNav` 硬编码背景色 → `bg-xh-primary/95`
- `BottomNav` 指示器位置：`-bottom-2`（超出容器）→ `bottom-0.5`
- 新增 `aria-label` 到 TopBar 按钮

---

## 三、整改验证清单

- [x] Build通过（45/45页面）
- [x] TypeScript无错误
- [x] 泡泡点击有光晕扩散反馈
- [x] 底部导航触控区域 >= 44px
- [x] 文本对比度 >= 4.5:1（WCAG AA）
- [x] 响应式布局 sm:max-w-lg
- [x] iOS安全区适配
- [x] brainholeId在泡泡→匹配→超时→AI全链路不丢失
- [x] AI房间创建使用热度加权随机
- [x] 广场素材卡片可点击



---

# v5.1 故事大厅模块开发记录（2026-05-03）

## 一、模块概述

故事大厅是《群像·星火》的核心共创模块，支持用户发起故事项目、设定世界观和角色、认领角色、多人实时对白共创、AI分支剧情生成、导演控场和资产沉淀。

## 二、数据库模型

### 新增模型（Prisma）

| 模型 | 说明 |
|------|------|
| `Story` | 故事项目：标题、世界观、冲突、状态(recruiting/ongoing/completed)、导演 |
| `StoryRole` | 角色定义：名称、设定、需求、认领者、认领理由 |
| `StoryChapter` | 章节：标题、目标、顺序、状态 |
| `StoryMessage` | 对白消息：发送者、内容、身份、是否导演备注 |
| `StoryInspiration` | 灵感库：内容、来源消息、状态 |
| `StoryBranch` | 剧情分支：内容描述、选项JSON、状态、获胜选项 |

### User模型扩展
```prisma
storiesDirected  Story[]       @relation("StoryDirector")
storyRoles       StoryRole[]   @relation("StoryRoleClaimer")
```

## 三、API接口

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/stories` | 获取故事列表（含角色统计） |
| POST | `/api/stories` | 创建新故事（含角色+第一章节） |
| GET | `/api/stories/[storyId]` | 获取故事详情（含角色、章节、消息） |
| POST | `/api/stories/[storyId]/roles/[roleId]/claim` | 认领角色（一人限一个角色） |
| GET | `/api/stories/[storyId]/messages` | 获取对白消息 |
| POST | `/api/stories/[storyId]/messages` | 发送对白消息 + WebSocket广播 |
| POST | `/api/stories/[storyId]/pause` | 导演暂停（仅导演） |
| POST | `/api/stories/[storyId]/resume` | 导演继续（仅导演） |
| GET | `/api/stories/[storyId]/branches` | 获取分支列表 |
| POST | `/api/stories/[storyId]/branches` | 创建分支提案 |
| POST | `/api/stories/[storyId]/branches/[branchId]/vote` | 投票/导演决议 |
| GET | `/api/stories/[storyId]/inspirations` | 获取灵感库 |
| POST | `/api/stories/[storyId]/inspirations` | 添加灵感 |

## 四、前端页面

| 路由 | 页面 | 功能 |
|------|------|------|
| `/story-hall` | 故事广场 | 项目列表卡片、进度条、发起新故事弹窗 |
| `/story-hall/[storyId]` | 故事详情 | 世界观展示、角色列表、认领弹窗、进入对白室 |
| `/story-hall/[storyId]/room` | 多人对白室 | 实时消息、导演控场、AI分支、灵感库 |

## 五、WebSocket事件（v5.0扩展）

| 事件 | 方向 | 说明 |
|------|------|------|
| `join-story` | C→S | 加入故事房间 |
| `leave-story` | C→S | 离开故事房间 |
| `send-story-message` | C→S | 发送消息（广播） |
| `director-pause` | C→S→C | 导演暂停广播 |
| `director-resume` | C→S→C | 导演继续广播 |
| `branch-proposed` | C→S→C | 分支提案广播 |
| `branch-vote` | C→S→C | 分支投票广播 |
| `story-typing` | C→S→C | 输入中提示 |

## 六、AI分支生成

- 调用 `/api/ai/story-weave` (mode=branch)
- DeepSeek分析最近20条对白，生成剧情分支点 + 3个选项
- 降级方案：内置3个通用分支选项

## 七、核心交互流程

```
1. 发起故事 → POST /api/stories → 创建Story+Role+Chapter
2. 角色认领 → POST /api/stories/.../claim → 更新Role.claimedBy
   → 全部认领后自动更新Story.status="ongoing"
3. 进入对白室 → WebSocket join-story → 实时收发消息
4. 导演控场 → pause/resume API → WebSocket广播全房间
5. AI分支 → DeepSeek分析对白 → 生成分支选项 → 导演决议采纳
6. 灵感沉淀 → 未采纳的分支自动存入灵感库
```

## 八、开发文件清单

### 后端
- `prisma/schema.prisma` - 新增6个模型
- `src/server/socket-handler.ts` - 扩展8个故事大厅事件
- `src/lib/ai/story-weaver.ts` - 新增 `generateBranchOptions`
- `src/app/api/ai/story-weave/route.ts` - 支持mode=branch
- `src/app/api/stories/route.ts` - 列表+创建
- `src/app/api/stories/[storyId]/route.ts` - 详情
- `src/app/api/stories/[storyId]/roles/[roleId]/claim/route.ts` - 认领
- `src/app/api/stories/[storyId]/messages/route.ts` - 消息
- `src/app/api/stories/[storyId]/pause/route.ts` - 暂停
- `src/app/api/stories/[storyId]/resume/route.ts` - 继续
- `src/app/api/stories/[storyId]/branches/route.ts` - 分支
- `src/app/api/stories/[storyId]/branches/[branchId]/vote/route.ts` - 投票
- `src/app/api/stories/[storyId]/inspirations/route.ts` - 灵感

### 前端
- `src/app/story-hall/page.tsx` - 故事广场
- `src/app/story-hall/[storyId]/page.tsx` - 故事详情
- `src/app/story-hall/[storyId]/room/page.tsx` - 对白室
- `src/components/story/CreateStoryModal.tsx` - 发起新故事弹窗
- `src/components/story/ClaimRoleModal.tsx` - 认领角色弹窗
- `src/components/layout/BottomNav.tsx` - 故事导航改为/story-hall

## 九、验证清单

- [x] Build通过（55/55页面，新增10个路由）
- [x] TypeScript无错误
- [x] Prisma db push成功
- [x] 故事广场可创建故事
- [x] 故事详情可认领角色
- [x] 角色满员后自动解锁对白室
- [x] 对白室支持实时消息
- [x] 导演可暂停/继续
- [x] AI可生成分支选项
- [x] 灵感库存储备用灵感


---

# v5.3 全面诊断与整改记录（2026-05-04）

## 一、整改背景

v5.2上线后出现以下问题：
1. 刘看山头像误用写实北极狐照片，不符合知乎官方IP形象
2. 首页"多人组队"入口跳转到不存在的 `/multiplayer`
3. 全平台大量页面文本对比度不足（`text-white/20`~`/30`），部分屏幕难以阅读
4. 泡泡点击反馈不够明显，用户不确定是否触发

## 二、整改内容

### 1. 刘看山形象修正

| 项目 | 修正前 | 修正后 |
|------|--------|--------|
| 图片来源 | Unsplash写实北极狐照片 | 知乎官方卡通头像 `pic1.zhimg.com/da8e974dc.jpg` |
| 尺寸 | 可变 | 640x640（已知可用） |
| 回退 | CSS简笔画 | 保留onError回退到CSS简笔画 |

**文件**: `src/components/layout/LiuKanshanAvatar.tsx`

### 2. 首页导航修正

| 入口 | 修正前 | 修正后 |
|------|--------|--------|
| 多人组队 | `/multiplayer`（404） | `/story-hall`（故事广场） |

**文件**: `src/app/home/page.tsx`

### 3. 全平台对比度修复（WCAG AA）

**修复规则**：
```
text-white/20 → text-white/40  （提示文字、字数统计、placeholder）
text-white/25 → text-white/40  （次要文本、时间戳）
text-white/30 → text-white/50  （描述文字、状态提示、空状态）
```

**涉及文件（25个）**：
- `src/app/LoginForm.tsx`
- `src/app/register/page.tsx`
- `src/app/duo-match/page.tsx`
- `src/app/duo-timeout/page.tsx`
- `src/app/duo-waiting/page.tsx`
- `src/app/multi-match/page.tsx`
- `src/app/multi-waiting/page.tsx`
- `src/app/library/page.tsx`
- `src/app/library/[id]/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/story/page.tsx`
- `src/app/story-hall/page.tsx`
- `src/app/story-hall/[storyId]/page.tsx`
- `src/app/story-hall/[storyId]/room/page.tsx`
- `src/app/zhihu-search/page.tsx`
- `src/app/zhihu-zhida/page.tsx`
- `src/components/bubble-cloud/Bubble.tsx`
- `src/components/home/ModeDock.tsx`
- `src/components/layout/LiuKanshanAvatar.tsx`
- `src/components/match/DuoIdentityModal.tsx`
- `src/components/room/ChatRoom.tsx`
- `src/components/room/MessageBubble.tsx`
- `src/components/story/ClaimRoleModal.tsx`
- `src/app/globals.css`

### 4. 泡泡交互强化

**v5.3新增效果**：

| 效果 | 实现 |
|------|------|
| 按下光晕强化 | box-shadow内发光+外发光+金边，border-color金色 |
| 涟漪扩散 | 点击时渲染 `.bubble-ripple` 层，scale 1→1.5，opacity 0.8→0 |
| 选中光晕增大 | inset -8px → scale 1.6，opacity 0.9→0 |
| 动画时长 | 400ms → 500ms（与涟漪同步） |

**文件**: `src/components/bubble-cloud/Bubble.tsx`, `src/app/globals.css`

## 三、Build验证

```
✓ Compiled successfully in 6.3s
✓ TypeScript in 11.3s
✓ 47/47 static pages generated
✓ No errors
```

## 四、部署状态

- [x] Git commit & push (`dev` branch: `a335d8e`)
- [ ] 服务器部署（SSH连接超时，待网络恢复后执行 `git pull && npm run build && pm2 restart`）
