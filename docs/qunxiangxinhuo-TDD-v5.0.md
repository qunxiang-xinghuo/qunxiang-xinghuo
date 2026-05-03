# 群像·星火 (Qunxiang Xinghuo) 产品需求文档 — v6.0 泡泡脑洞版

**项目名称：** 群像·星火  
**版本：** v6.0（泡泡脑洞版 · 四级智能匹配）  
**日期：** 2026年5月2日  
**目标：** 泡泡一键匹配 + 四级降级策略 + 社交信号 + 沉浸式等待体验  
**状态：** 已开发完成，待部署验证

---

## 一、v6.0 核心设计理念（50年PM + 美术经理 + 技术经理）

### 产品诊断
1. **路径过长**：泡泡→详情→选模式→选身份→等待，5步才能匹配，流失率60%+
2. **等待无感知**：15秒纯等待，用户不知道系统在做什么，焦虑感强
3. **匹配无降级**：同brainhole没人就硬等，没有B计划
4. **泡泡无社交信号**：不知道这个脑洞有几个人在玩，冷场感强

### 新设计原则
- **泡泡 = 匹配入口**：不是内容展示，而是社交撮合的起点
- **四级降级 = 不放弃**：每3秒升一级策略，确保最大匹配概率
- **社交信号 = 信任**：显示"X人在线想聊"，让热门话题自带吸引力
- **等待可视化 = 安心**：用户知道系统在做什么，等待不再焦虑

---

## 二、泡泡系统重设计

### 2.1 视觉设计

**泡泡本体：**
- 尺寸：40-68px（根据热度微调）
- 质感：玻璃/水晶 + 分类色
- **v6.0新增：参与人数徽章**（右上角，绿色圆点，>2人时显示）

**Hover浮层（v6.0重设计）：**
```
┌────────────────────────────┐
│ [医疗] [中等]     5人在线   │  ← 分类+难度+社交信号
│                            │
│ 急诊室里的道德困境          │  ← 标题（16px加粗）
│                            │
│ 凌晨2点，一位急诊科医生...  │  ← scenario摘要
│                            │
│ [🔥85] [详情→] [⚡立即匹配]│  ← 热度+详情+金色匹配按钮
└────────────────────────────┘
```

**浮层按钮优先级：**
- 「⚡立即匹配」金色渐变按钮（主按钮，最醒目）
- 「详情→」灰色按钮（次按钮）

### 2.2 交互设计

**点击泡泡：** 进入脑洞详情页（保留旧行为，供浏览用）
**点击"立即匹配"：** 直接进入 `duo-match?brainholeId=xxx&from=bubble`

**数据流：**
```
泡泡Cloud → GET /api/brainholes/bubble?limit=20
  → 返回 { brainholes: [{ id, title, scenario, hotScore, category, difficulty, source, matchCount, reactionCount, engagedCount }] }
  → Bubble组件显示参与人数徽章
  → Hover浮层显示"X人在线"+"立即匹配"按钮
```

### 2.3 API设计

**GET /api/brainholes/bubble?limit=20**

**新增字段：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `matchCount` | number | 该brainhole的匹配请求数 |
| `reactionCount` | number | 该brainhole的反应数 |
| `engagedCount` | number | 总参与人数（match+reaction，保底hotScore/15） |

**参与人数统计逻辑：**
1. 从数据库统计每个brainhole的matchRequest数和reaction数
2. 数据库无记录时，使用 `hotScore/15` 作为保底（让新brainhole也有社交信号）
3. 前端显示 `engagedCount > 2` 时显示徽章

---

## 三、双人模式重设计 — 四级智能匹配

### 3.1 匹配引擎架构（v6.0）

```
用户发起匹配（带brainholeId + identity）
  ↓
[阶段1] 同brainhole精确匹配（0-3秒）
  ├─ 查找也在等待同brainhole的用户
  ├─ 找到 → 立刻匹配，strategy="same_brainhole"
  └─ 未找到 → 进入阶段2
  ↓
[阶段2] 同分类兴趣匹配（3-6秒）
  ├─ 查找等待中且brainhole分类相同的用户
  ├─ 找到 → 立刻匹配，strategy="same_category"
  └─ 未找到 → 进入阶段3
  ↓
[阶段3] 任意用户 + 已参与的热门brainhole（6-10秒）
  ├─ 查找任意等待中的用户
  ├─ 从"已有人参与"的brainhole中随机选（排除双方已参与的）
  ├─ 找到 → 立刻匹配，strategy="random_engaged"
  └─ 未找到 → 进入阶段4
  ↓
[阶段4] 扩大搜索 + 等待（10-15秒）
  ├─ 无等待用户
  ├─ 为用户分配一个热门brainhole作为等待话题
  └─ 返回waiting，strategy="waiting_for_any"
```

### 3.2 匹配引擎API

**POST /api/match**

**请求体：**
```json
{
  "identity": "急诊科医生",
  "preferDifferent": true,
  "brainholeId": "xxx",  // 可选，从泡泡来的会带
  "mode": "quick",
  "timeoutMinutes": 1
}
```

**响应（匹配成功）：**
```json
{
  "success": true,
  "data": {
    "matchId": "xxx",
    "roomId": "xxx",
    "status": "matched",
    "strategy": "same_brainhole",  // same_brainhole | same_category | random_engaged
    "brainholeId": "xxx",
    "brainholeTitle": "急诊室里的道德困境",
    "message": "找到同样对这个话题感兴趣的人",
    "matchedUserId": "xxx",
    "matchedUserIdentity": "辩护律师"
  }
}
```

**响应（等待中）：**
```json
{
  "success": true,
  "data": {
    "matchId": "xxx",
    "status": "waiting",
    "strategy": "waiting_for_any",
    "brainholeId": "xxx",
    "brainholeTitle": "急诊室里的道德困境",
    "message": "waiting"
  }
}
```

### 3.3 等待页设计（v6.0 可视化）

```
┌─────────────────────────────────────┐
│ ← 返回        寻找对撞人             │
├─────────────────────────────────────┤
│                                     │
│         🦊 刘看山（思考动画）         │  ← 中心焦点
│                                     │
├─────────────────────────────────────┤
│  [对撞话题] 急诊室里的道德困境        │  ← brainhole卡片
├─────────────────────────────────────┤
│  ◎ ◎ ◎ ◎                           │  ← 四级策略指示灯
│  同话题  同类  热门  扩大           │
│  ═══════════                        │  ← 策略进度条
├─────────────────────────────────────┤
│  正在搜索同话题的对撞人...          │  ← 实时文案
│  刘看山已派出 45 个信号波           │  ← 趣味数据
├─────────────────────────────────────┤
│              12                     │  ← 倒计时
│  ═══════════                        │  ← 时间进度条
├─────────────────────────────────────┤
│  [信号正常] [已发起匹配]            │  ← 状态标签
└─────────────────────────────────────┘
```

**四级策略指示灯：**
| 阶段 | 时间 | 图标 | 文案 |
|------|------|------|------|
| 同话题匹配 | 0-3秒 | Target | 正在搜索同话题的对撞人... |
| 同类兴趣 | 3-6秒 | BrainCircuit | 同话题暂无匹配，正在寻找同类兴趣... |
| 热门话题 | 6-10秒 | Globe | 正在从热门参与话题中为你匹配... |
| 扩大搜索 | 10-15秒 | Search | 正在扩大搜索范围... |

**指示灯状态：**
- 当前阶段：金色高亮 + 发光
- 已完成：绿色
- 未到达：灰色

### 3.4 超时页设计（v6.0）

```
┌─────────────────────────────────────┐
│ ← 返回        匹配结果              │
├─────────────────────────────────────┤
│                                     │
│         🦊 刘看山（ sleepy ）        │
│                                     │
├─────────────────────────────────────┤
│    四级匹配策略已用尽               │
│    已尝试：同话题→同类兴趣→        │
│            热门话题→扩大搜索        │
│    是否与刘看山一起探讨？           │
├─────────────────────────────────────┤
│  [🟡 与刘看山对戏]                  │  ← 主按钮
│  [⚪ 继续扩大搜索]                  │  ← 次按钮（第1次）
│  [⚪ 返回首页]                      │  ← 次按钮（第2次）
└─────────────────────────────────────┘
```

---

## 四、身份选择页（v6.0 优化）

**从泡泡来的用户：**
- URL: `/duo-match?brainholeId=xxx&from=bubble`
- 顶部显示预选brainhole卡片（金色边框）
- 标题改为"确认身份，即刻对撞"
- 副标题改为"话题已选好，选一个身份就开始"
- 按钮改为"确认身份，开始匹配 →"

**普通入口：**
- URL: `/duo-match`
- 保持原有设计

---

## 五、数据库设计

**无需Schema变更**，v6.0复用已有模型：
- `Brainhole.matchCount` / `reactionCount` — 已有字段
- `MatchRequest.brainholeId` — 已有字段
- `MatchRequest.identity` — 已有字段

**新增查询模式：**
```typescript
// 统计brainhole参与人数
prisma.matchRequest.groupBy({ by: ['brainholeId'], _count: true })
prisma.reaction.groupBy({ by: ['brainholeId'], _count: true })

// 同分类匹配
prisma.matchRequest.findMany({
  where: { brainhole: { category: userBrainhole.category } }
})

// 已有人参与的brainhole
prisma.brainhole.findMany({
  where: {
    status: "approved",
    OR: [
      { reactionCount: { gt: 0 } },
      { collectionCount: { gt: 0 } },
    ],
  },
  orderBy: { hotScore: "desc" },
})
```

---

## 六、文件变更清单

| 文件 | 变更 | 说明 |
|------|------|------|
| `src/server/match-engine.ts` | 重写 | 四级降级策略匹配引擎 |
| `src/app/api/match/route.ts` | 修改 | 返回strategy + brainholeTitle |
| `src/app/api/brainholes/bubble/route.ts` | 修改 | 增加参与人数统计 |
| `src/components/bubble-cloud/types.ts` | 修改 | 增加matchCount/reactionCount/engagedCount |
| `src/components/bubble-cloud/Bubble.tsx` | 重写 | 参与人数徽章 + "立即匹配"按钮 |
| `src/components/bubble-cloud/BubbleCloud.tsx` | 修改 | onMatch回调 + engagedCount |
| `src/app/duo-match/page.tsx` | 修改 | 支持from=bubble + 预选brainhole卡片 |
| `src/app/duo-waiting/page.tsx` | 重写 | 四级策略进度可视化 |
| `src/app/duo-timeout/page.tsx` | 修改 | 降级策略文案 |
| `src/app/home/page.tsx` | 修改 | 模式文案 + 版本号 |

---

## 七、测试策略

### 7.1 泡泡系统测试
- [ ] Hover浮层显示"X人在线"
- [ ] 参与人数徽章 >2人时显示
- [ ] 点击"立即匹配"跳转duo-match?brainholeId=xxx
- [ ] 点击泡泡本体跳转brainhole详情
- [ ] Emergency fallback显示engagedCount

### 7.2 匹配引擎测试
- [ ] 同brainhole匹配 → strategy="same_brainhole"
- [ ] 同分类匹配 → strategy="same_category"
- [ ] 随机热门匹配 → strategy="random_engaged"
- [ ] 无匹配 → strategy="waiting_for_any" + brainholeTitle
- [ ] 匹配响应包含brainholeId和brainholeTitle

### 7.3 等待页测试
- [ ] 四级策略指示灯随时间变化
- [ ] 策略进度条正确填充
- [ ] 实时文案随策略阶段变化
- [ ] 匹配成功显示对应策略文案
- [ ] 超时后正确跳转超时页

### 7.4 Build测试
- [ ] 本地 `npm run build` 47/47通过
- [ ] 静态资源curl 200
- [ ] 首页/泡泡API/匹配API 200

---

## 八、部署检查清单

- [ ] 本地 `npm run build` 47/47通过
- [ ] `git commit` + `git push origin dev`
- [ ] 服务器 `git reset --hard origin/dev`
- [ ] `npm install && npx prisma generate`
- [ ] `rm -rf .next && NODE_ENV=production npm run build`
- [ ] `pm2 restart qunxiang-xinghuo && pm2 save`
- [ ] curl 验证首页 `/home` 200
- [ ] curl 验证静态JS/CSS 200
- [ ] curl 验证泡泡API `/api/brainholes/bubble` 返回数据
- [ ] curl 验证匹配API POST `/api/match` 返回strategy
- [ ] 更新 `ProblemLog.md`
- [ ] 更新 `IMPORTANT.md`

---

*文档版本：v6.0 泡泡脑洞版 | 开发完成 | 2026-05-02*
