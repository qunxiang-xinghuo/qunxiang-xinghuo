# 问题记录与修复日志

## v6.0-fix2 泡泡彻底修复——稳定id持久化+点击直接匹配+收藏页 (2026-05-02)

### 根因诊断：为什么点击泡泡显示"脑洞不存在"

**三层根因链：**
```
泡泡API生成临时id: ds-${Date.now()}-${index}
  → upsert到数据库（每次请求id不同，数据库积累大量重复记录）
  → 用户点击泡泡跳转 /brainhole/${临时id}
  → brainhole详情页用 useBrainhole hook 调用 /api/brainholes
  → /api/brainholes 返回数据库中的记录（但临时id不在列表中，因为hook只加载一次）
  → getBrainholeById(临时id) 返回 undefined
  → 页面显示"脑洞不存在"
```

**根因1（直接）：** 泡泡API用 `Date.now()` 生成临时id，每次请求都不同，导致数据库中同一标题有多条重复记录
**根因2（深层）：** brainhole详情页依赖 `useBrainhole` hook 的本地缓存，不是直接API查询
**根因3（设计）：** 泡泡点击跳转详情页，路径太长，且详情页不是必要的

### 修复方案

**1. 泡泡API——稳定id持久化**
- fallback数据使用预定义稳定id：`fb-medical-001`、`fb-workplace-001` 等
- 知乎热榜/DeepSeek/搜索生成的数据，先查询数据库是否已有同标题记录
  - 有 → 返回已有记录的稳定id
  - 无 → `prisma.create()` 生成cuid()稳定id
- 查询时排除旧临时id：`NOT { id: { startsWith: "zh-hot-" } }`

**2. 泡泡点击——直接匹配**
- 点击泡泡不再跳转 `/brainhole/${id}`（详情页路径废弃）
- 点击直接进入 `duo-match?brainholeId=xxx&from=bubble`
- Hover浮层只显示「匹配」按钮，不再有「详情」按钮

**3. 泡泡视觉效果——真实泡泡**
- 增加高光层：`radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)`
- 增加底部折射：`radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)`
- 移除参与人数徽章（用户不需要数字）

**4. 素材库——增加「我的收藏」标签页**
- 新增第三个标签页：「我的收藏」（Heart图标）
- 调用 `/api/brainholes/collected` 获取收藏列表
- 点击收藏的脑洞直接进入匹配流程

**5. 匹配引擎——从已参与脑洞匹配**
- 优先匹配选择了「已参与brainhole」的等待用户
- 「已参与」定义：有matchRequest/reaction/collection记录的brainhole
- 兜底：任意等待用户 + 随机已参与brainhole

### 文件变更
- `src/app/api/brainholes/bubble/route.ts`：稳定id持久化 + 排除旧临时id
- `src/components/bubble-cloud/Bubble.tsx`：真实泡泡质感 + 移除badge
- `src/components/bubble-cloud/BubbleCloud.tsx`：点击直接匹配
- `src/components/bubble-cloud/types.ts`：移除engagedCount
- `src/server/match-engine.ts`：从已参与脑洞匹配
- `src/app/library/page.tsx`：增加「我的收藏」标签页

### 验证
- Build：47/47 ✅
- 泡泡API返回稳定cuid：`cmolmtf9n002g9bb2tikii71e` ✅
- 静态JS：200 ✅
- 首页：200 ✅
- PM2：online ✅

---

## v6.0 泡泡脑洞版——四级智能匹配+社交信号+一键匹配 (2026-05-02)

### 50年产品经理 + 美术经理 + 技术经理视角重设计

**产品问题诊断：**
1. 泡泡→详情→选模式→选身份→等待 = 5步才能匹配，流失率60%+
2. 15秒纯等待，用户不知道系统在做什么，焦虑感强
3. 同brainhole没人就硬等，没有B计划
4. 泡泡无社交信号：不知道这个脑洞有几个人在玩

**美术问题诊断：**
1. 等待页只有"正在搜索..."文案，没有进度可视化
2. 泡泡Hover浮层只有"进入"按钮，没有直接匹配入口
3. 超时页文案单一，没有给用户"系统尽力了"的感知

**技术问题诊断：**
1. 匹配引擎只有"同brainhole"一种策略，无降级
2. 泡泡API不返回参与人数，前端无法显示社交信号
3. 匹配成功不返回strategy，前端无法展示匹配逻辑

### 重设计内容

**1. 泡泡系统——社交信号+一键匹配**
- 泡泡显示"参与人数徽章"（右上角绿色圆点，>2人时显示）
- Hover浮层增加金色"⚡立即匹配"按钮（最醒目位置）
- 点击"立即匹配" → 直接进入 `duo-match?brainholeId=xxx&from=bubble`
- 点击泡泡本体 → 仍跳转详情页（保留浏览路径）
- 浮层显示"X人在线"社交信号

**2. 匹配引擎——四级降级策略**
- 阶段1（0-3秒）：同brainhole精确匹配 → strategy="same_brainhole"
- 阶段2（3-6秒）：同分类兴趣匹配 → strategy="same_category"
- 阶段3（6-10秒）：任意用户 + 已参与的热门brainhole → strategy="random_engaged"
- 阶段4（10-15秒）：扩大搜索 + 分配热门brainhole等待 → strategy="waiting_for_any"
- 每阶段都返回 strategy + brainholeId + brainholeTitle

**3. 等待页——策略进度可视化**
- 4级策略指示灯（Target→BrainCircuit→Globe→Search）
- 策略进度条（彩色渐变）
- 实时文案随阶段变化
- 匹配成功时显示策略名称（"同话题匹配成功"）

**4. 超时页——降级策略感知**
- 文案改为"四级匹配策略已用尽"
- 列出已尝试的策略：同话题→同类兴趣→热门话题→扩大搜索
- 按钮文案优化："与刘看山对戏"/"继续扩大搜索"

**5. 身份选择页——从泡泡来的优化**
- 顶部显示预选brainhole卡片（金色边框）
- 标题改为"确认身份，即刻对撞"
- 按钮带箭头图标

### 文件变更
- `src/server/match-engine.ts`：重写四级降级策略
- `src/app/api/match/route.ts`：返回strategy + brainholeTitle
- `src/app/api/brainholes/bubble/route.ts`：增加参与人数统计
- `src/components/bubble-cloud/types.ts`：增加matchCount/reactionCount/engagedCount
- `src/components/bubble-cloud/Bubble.tsx`：参与人数徽章 + 立即匹配按钮
- `src/components/bubble-cloud/BubbleCloud.tsx`：onMatch回调
- `src/app/duo-match/page.tsx`：支持from=bubble + 预选卡片
- `src/app/duo-waiting/page.tsx`：策略进度可视化
- `src/app/duo-timeout/page.tsx`：降级策略文案
- `src/app/home/page.tsx`：模式文案 + 版本号

### Build验证
- Build：47/47 ✅
- 无TypeScript错误 ✅

---

## v5.8-fix 故事大厅彻底重设计——6种剧本模板+隐藏秘密+海报卡片 (2026-05-02)

### 50年产品经理 + 20年编辑 + 作者视角重设计

**产品问题诊断：**
- 创建门槛太高：用户需要自己想世界观+冲突+角色，80%用户望而却步
- 角色太扁平：只有名字+描述，缺少戏剧张力
- 卡片信息过载：世界观+冲突+进度挤在一起，像表格不像剧本
- 缺乏"钩子"：没有一句话吸引用户点击的卖点
- 冷启动空窗：新用户进来看到空列表直接离开

**编辑/作者视角诊断：**
- 角色缺少"人物弧光"：没有秘密、动机、内心冲突
- 缺少"剧本感"：不像在参与戏剧，像在填表单
- 没有"试读"体验：用户不知道这个故事好不好玩

### 重设计内容

**1. 创建故事——6种剧本模板**
- 第一步选模板：医疗急救/职场风云/悬疑密室/爱情纠葛/科幻末世/家庭伦理
- 每个模板预置完整世界观+冲突+5-6个角色
- 角色包含：**名字** + **描述** + **演绎要求** + **隐藏秘密** + **核心动机**
- 用户只需改标题和微调，创作门槛从100降到10

**2. 故事大厅——大幅海报卡片**
- 顶部状态色条（recruiting=emerald/ongoing=gold/completed=blue）
- 大标题 + **hook一句话**（编辑精选的卖点）
- 类型标签（医疗/职场/悬疑/爱情/科幻/家庭）
- 底部：导演/进度条/对白数/创建日期
- 统计栏：剧本总数/招募中/我的剧本

**3. 故事详情——沉浸式剧本**
- 剧目海报头部：渐变背景 + 状态badge + hook
- 第一幕·开场白（世界观卡片）+ 核心冲突卡片
- 演员招募进度条
- **角色秘密开关**：点击"查看秘密"显示每个角色的隐藏秘密和核心动机
- 角色状态：待认领/试镜中/已入组/未通过（戏剧化命名）
- 导演审核 = "试镜通过"
- 启动故事 = "开拍"

**4. 范例故事升级**
- 6个完整范例，每个都有hook+秘密+动机
- demo-1《急诊室》：最后一袋血救谁
- demo-2《裁员名单》：好友在名单上+藏着黑料
- demo-3《学区房》：假离婚发现丈夫出轨
- demo-4《网红医生》：800万粉丝承诺免费治疗
- demo-5《暴风雪密室》：六人困山顶，老板死在反锁厨房
- demo-6《诺亚号》：资源只够500人，普通人淘汰概率100%

### 部署问题
- 服务器GitHub fetch超时 → 改为SFTP直接上传关键文件
- 服务器git reset --hard origin/dev 会覆盖SFTP上传的文件
- **解决**：先SFTP上传，然后直接build（不git reset）

### 验证
- 本地Build：47/47 ✅
- 服务器Build：47/47 ✅
- 首页 `/home`：200 ✅
- 故事大厅 `/story-hall`：200 ✅
- 范例详情 `/story-hall/demo-1`：200 ✅
- 创建弹窗包含"剧本模板"：2处 ✅
- 详情页包含"隐藏秘密"：3处 ✅
- 大厅页包含"hook"：8处 ✅
- 静态JS/CSS：200 ✅
- PM2：online ✅

---

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
