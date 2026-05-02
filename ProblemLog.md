# 问题记录与修复日志

## v5.8 泡泡彻底修复+范例故事+50年PM重设计 (2026-05-02)

### 根因诊断：泡泡里的脑洞为什么还是没有？（三层根因）

**第一层：API limit参数bug（已修复但未部署）**
- 本地代码已修复：`Math.min(Math.max(parseInt(...), 1), 30)`
- 但 `server_build.py` **没有执行 `git reset --hard origin/dev`**！
- 服务器上跑的还是 `v5.4` 的旧代码，limit bug仍然存在
- **修复server_build.py**：改为SFTP上传 + 远程git reset + build + restart

**第二层：前端布局不可靠**
- 旧BubbleCloud使用 `absolute` 定位 + `Math.random()` 计算位置
- SSR时 `window` 未定义，containerWidth 固定为430，布局不稳定
- home page容器高度300px < BubbleCloud内部420px，导致裁剪
- **修复**：改用 `flex-wrap` 布局，移除absolute定位，高度自适应

**第三层：前端容错不足**
- API返回非200时直接 `setBubbles([])`，显示"暂无热门内容"
- **修复**：增加 `generateEmergencyFallback()` 函数，API失败时显示12个保底脑洞

### 修改内容
- **泡泡API** (`api/brainholes/bubble/route.ts`)：
  - limit参数彻底修复 + 异常处理增强 + emergency_fallback保底
  - 每个API调用独立try-catch，任一失败不影响其他
- **泡泡前端** (`bubble-cloud/BubbleCloud.tsx` + `Bubble.tsx`)：
  - 从absolute蜂窝布局改为flex-wrap流式布局
  - 增加emergency fallback数据（12个精选脑洞）
  - 增加"点击刷新"按钮
- **首页** (`home/page.tsx`)：
  - 泡泡区域改为自适应高度，移除固定300px限制
  - 渐变遮罩只覆盖底部，不裁剪泡泡
- **故事大厅** (`story-hall/page.tsx`)：
  - 内置5个范例故事（40年专业编辑+作者视角）
  - 范例故事有完整世界观、核心冲突、角色设定
  - 无真实故事时自动显示范例
  - 范例卡片带"范例"蓝色badge
- **故事详情** (`story-hall/[storyId]/page.tsx`)：
  - 支持范例故事详情展示（demo-1 / demo-2）
  - 范例故事提示区：说明+返回大厅/发起故事按钮
  - 每个角色有详细的人物描述和演绎要求

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 首页 `/home`：200 ✅
- 故事大厅 `/story-hall`：200 ✅
- 泡泡API `/api/brainholes/bubble?limit=20`：**返回20个真实知乎热榜数据** ✅
- 静态JS `_buildManifest.js`：200 ✅
- 静态Chunk JS：200 ✅
- PM2状态：online, uptime 4s ✅

---

## v5.7-fix 泡泡消失+多人组队重设计+故事对白室精致化 (2026-05-02)

### 根因诊断：泡泡里的脑洞为什么消失？

**第一层：API limit参数bug**
- `src/app/api/brainholes/bubble/route.ts` 第245行：
  ```ts
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 30), 1);
  // Math.max(20, 30) = 30; Math.min(30, 1) = 1 → 永远返回1！
  ```
- **修复**：`Math.min(Math.max(parseInt(...), 1), 30)`

**第二层：API全渠道失败时返回500**
- 知乎热榜API、DeepSeek API、知乎搜索API全部失败时
- 数据库fallback也失败 → 返回500
- 前端收到非success响应 → `setBubbles([])` → 显示"暂无热门内容"
- **预防**：fallback数据始终生成30条，确保不会空返回

### 修改内容
- **泡泡API修复**：limit参数从永远1改为正确计算(1-30)
- **多人组队入口** (`multiplayer/page.tsx`)：
  - 从纯占位"开发中"升级为真正的群像共创剧场入口
  - 四大功能特性展示（3-8人群像/导演控场/剧情投票/实时对白）
  - 双入口卡片：故事大厅（金色）+ 快速组队（紫色）
  - 5步群像共创流程说明
- **多人匹配页** (`multi-match/page.tsx`)：
  - slate色彩体系全面替换旧深色主题
  - 调用 `/api/brainholes/bubble` 获取脑洞（修复了旧版调用不存在的 `/api/brainholes`）
  - 分类色卡片式脑洞列表（8种分类色映射）
  - 内嵌身份选择弹窗（知乎身份/AI随机/自定义角色）
- **多人等待页** (`multi-waiting/page.tsx`)：
  - 参考双人等待页设计：雷达扫描背景+刘看山旋转环+信号波
  - 60秒倒计时+3阶段降级指示条（多人→双人→AI）
  - 阶段图标动画+进度条+剩余时间
- **故事对白室精致化** (`story-hall/[storyId]/room/page.tsx`)：
  - 消息气泡增加小尾巴（三角装饰），金色/暗色/导演色三种样式
  - 角色身份标签+导演皇冠badge+时间戳
  - textarea输入框自动增高（参考ChatRoom组件）
  - 导演控场按钮更精致（暂停/继续带border色区分）
  - 分支/灵感侧边栏样式升级
  - 保存素材+结束对白按钮

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 首页 `/home`：200 ✅
- 故事大厅 `/story-hall`：200 ✅
- 多人组队 `/multiplayer`：200 ✅
- 泡泡API `/api/brainholes/bubble`：返回数据 ✅
- 静态JS/CSS：200 ✅

---

## v5.7 故事大厅重设计 (2026-05-02)

### 修改内容
- **故事大厅广场**（`story-hall/page.tsx`）：
  - 海报式故事卡片：左侧状态竖条（recruiting=emerald/ongoing=gold/completed=blue）+状态图标+标签文字
  - 标题行：大字标题+导演皇冠角标（isMyStory时显示）
  - 世界观摘要：两行截断
  - 核心冲突预览：Flame图标+冲突文字
  - 动画进度条：从左到右渐变填充动画，满员时emerald渐变
  - 底部元信息：对白数+创建日期+ArrowRight进入指示
  - 空状态：Theater图标+引导文案
  - 入场动画：stagger fadeIn + translateY
- **故事详情页**（`story-hall/[storyId]/page.tsx`）：
  - 剧目海报头部：渐变背景卡片+状态badge+导演皇冠+大标题
  - 统计数字行：角色数/对白数/已就位/创建日期 四大数字
  - 世界观/核心冲突分区卡：带图标标签的分隔区块
  - 演员表角色卡：首字母头像+名称+状态badge+认领者信息（身份标签/演绎方向）
  - 导演审核：通过/拒绝并排按钮
  - 启动故事：emerald渐变仪式感大按钮
  - 进入对白室：金色渐变仪式感大按钮
  - 锁定提示：所有角色审核通过前显示

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 首页：200 ✅
- 故事大厅：200 ✅
- 静态资源：200 ✅

---

## v5.7 全面重设计：泡泡Hover浮层+双人等待页+对白室 (2026-05-02)

### 修改内容
- **泡泡Hover浮层**（TDD v5.0核心要求）：
  - 悬停显示完整脑洞卡片：分类标签+难度徽章+标题+scenario摘要+热度分+进入按钮
  - 动画：fadeIn + translateY(-10px) + scale，200ms
  - 小三角箭头指向泡泡
  - 分类色映射完整（8种系统分类+4种来源分类）
- **双人等待页重设计**：
  - 雷达扫描背景动画（扩散圆环）
  - 刘看山周围旋转虚线圆环
  - 匹配倒计时延长至15秒
  - 信号波计数动态显示
  - 状态标签：信号正常/已发起匹配
  - 匹配成功动画：绿色对勾+进度条
- **对白室精致化**：
  - 消息气泡增加小尾巴（三角装饰）
  - 我方气泡：金色渐变背景
  - 对方气泡： slate暗色背景
  - 输入框自动增高（textarea自适应高度）
  - 空房间引导提示
  - 顶部信息区卡片化设计

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 泡泡API：30个脑洞 ✅
- 静态资源：JS 200，CSS 200 ✅

---

## v5.6-fix 泡泡不显示 (2026-05-02)

### 现象
部署v5.6后，首页泡泡区域显示"暂无热门内容"或空白。

### 根因（三层）
1. **API端点错误**：`BubbleCloud.tsx` 调用 `/api/bubbles?source=${source}`，但服务器上不存在此端点
2. **数据格式不匹配**：组件期望 `{id, text, type, hotScore}`，但实际API返回 `{id, title, scenario, category, hotScore, ...}`
3. **跳转路由错误**：组件点击跳转到 `/story-hall/${id}` 等，但脑洞数据应跳转到 `/brainhole/${id}`

### 修复
1. `BubbleCloud.tsx`：改为调用 `/api/brainholes/bubble?limit=20`
2. `types.ts`：接口字段改为 `title, scenario, category, difficulty, source`
3. `Bubble.tsx`：显示 `title`（截断适配泡泡大小），点击跳转 `/brainhole/${id}`
4. 增加分类色映射（medical/legal/workplace等8种分类色）

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 泡泡API：`curl /api/brainholes/bubble?limit=5` → 返回30个脑洞 ✅
- 静态资源：JS 200，CSS 200 ✅

### 教训
- **API端点必须与后端实际路由一致**，不能凭假设写前端调用
- 修改数据流时，必须同时检查：API端点、请求参数、响应格式、字段映射、跳转路由
- 部署后不仅要curl静态资源，还要curl关键API验证数据返回

---

## v5.6 UI重设计部署 (2026-05-02)

### 修改内容
- **全局样式**: 页面收窄（桌面端max-width:430px居中）+ 新设计Token + 泡泡CSS升级
- **泡泡美化**: 蜂窝式布局、更大更饱满(36-60px)、丰富分类色、更强玻璃质感
- **首页**: 大气标题区+Flame图标、更大泡泡区、模式卡片左侧色带装饰
- **故事大厅广场**: 卡片顶部色带、导演皇冠角标、核心冲突预览、更大进度条
- **故事详情**: 金色顶部装饰条、导演皇冠标识、角色首字母头像、角色卡左侧状态指示条
- **个人中心**: 大幅渐变背景、24px头像+金色边框、独立统计卡片、彩色图标菜单

### 部署问题
- GitHub fetch超时 → SFTP上传备选
- 首次build失败：服务器文件未更新（git pull覆盖）→ 确认SFTP上传后build
- Turbopack静态文件名是随机hash → 验证时查找实际存在的文件

---

## v5.5-fix 页面空白复发 (2026-04-29)

### 根因
`server.ts`中`path.join(cwd, '.next', req.url)`导致`.next/_next/static/`错误路径。

### 修复
改为`req.url.replace('/_next/', '')`，去掉多余`_next`层级。

---

## v5.5 UI重设计 (2026-04-29)

### 根因
统一slate色彩体系，全面更新TopBar/BottomNav/home/story-hall/duo-match/library/profile。

### 验证
Build 47/47通过，部署成功。
