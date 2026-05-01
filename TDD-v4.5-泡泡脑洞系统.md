# TDD v4.5 - 群像·星火 泡泡脑洞系统

> 版本: v4.5
> 日期: 2026-05-01
> 状态: 已部署

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
