# 问题记录与修复日志

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
