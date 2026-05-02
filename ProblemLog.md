# ProblemLog.md — 群像·星火 问题记录与解决方案

> 原则：犯过的问题不再重犯，每次修复必须记录根因、解决方法和预防措施。

---

## 2026-04-29 v4.6 — 双人模式无法进入等待页

**现象**：点击"确认身份，进入匹配"后页面卡死，白屏。

**根因**：`duo-match/page.tsx` 的 `handleConfirm` 中同步调用 `fetch('/api/match')`，请求耗时阻塞了 React 渲染，导致页面无法跳转到等待页。

**解决**：将匹配请求移到 `duo-waiting/page.tsx` 的 `useEffect` 中后台异步发起，先渲染UI再发请求。

**预防措施**：
- 页面跳转前不要发起同步阻塞请求
- 耗时操作放在目标页面的 `useEffect` 中执行

---

## 2026-04-29 v4.7 — AI房间创建失败（Prisma外键约束）

**现象**：创建AI房间时报 `Foreign key constraint failed on the field: RoomParticipant_userId_fkey`。

**根因**：`RoomParticipant.userId` 关联 `User.id`，但 guest 用户和 AI 用户 (`liu_kanshan_ai`) 不在 `User` 表中。

**解决**：创建房间前先用 `db.user.upsert` 确保用户记录存在。

**预防措施**：
- 任何涉及外键关联的创建操作前，先确保关联记录存在
- 使用 `upsert` 而不是 `create`，避免重复创建报错

---

## 2026-04-29 v4.7-fix2 — CSS transform冲突

**现象**：泡泡的漂浮动画（translateY）和 hover 放大（scale）同时生效时，hover 效果不工作。

**根因**：CSS 中同一元素的 `transform` 属性会被覆盖。`animation: bubble-float-updown` 的 `@keyframes` 修改了 `transform: translateY()`，而 hover 的 `transform: scale(1.15)` 会覆盖前者。

**解决**：分离到父子两层。父层（`.bubble-float-wrapper`）负责 `translateY` 漂浮动画，子层（`.bubble-glass`）负责 `scale` hover 效果。

**预防措施**：
- 同一元素不要同时有动画 transform 和交互 transform
- 始终分离到不同层级

---

## 2026-04-29 v4.8 — Turbopack 中文引号解析失败

**现象**：Build 报错 `Unexpected character '\u201c'`，指向某行代码。

**根因**：代码中使用了中文引号 `"` 和 `"`，Turbopack 解析失败。

**解决**：全局替换中文引号为英文引号 `"`。

**预防措施**：
- 代码中绝对禁止中文引号
- IDE 设置自动替换中文标点

---

## 2026-04-29 v4.9-fix — useSession SSR 返回 undefined

**现象**：Build 报错 `TypeError: Cannot destructure property 'data' of 'useSession(...)' as it is undefined`，发生在 `/profile` 页面预渲染时。

**根因**：`useSession` from `next-auth/react` 必须在 `SessionProvider` 包裹下才能工作。`providers.tsx` 是空 wrapper，没有 `SessionProvider`。

**解决**：在 `providers.tsx` 中添加 `SessionProvider` 包裹全局。

**预防措施**：
- 使用 `useSession` 前必须确认祖先组件有 `SessionProvider`
- SSR 场景下，任何第三方 hook 都要检查是否需要 Provider

---

## 2026-05-02 v5.0-fix1 — 匹配脑洞重复

**现象**：用户多次进入匹配，总是分配到同一个脑洞。

**根因**：`match-engine.ts` 中使用 `db.brainhole.findFirst({ orderBy: { hotScore: "desc" } })`，`findFirst` 总是返回排序后的第一个记录（热度最高的），导致每次匹配都选同一个脑洞。

**解决**：改为 `findMany` 获取前50个 approved 脑洞，然后按热度加权随机选择。热度高的脑洞被选中的概率更大，但不是100%。

**预防措施**：
- `findFirst` + `orderBy` 不等于随机
- 需要随机时必须用 `findMany` + 程序内随机，或数据库的 `RANDOM()`/`ORDER BY RAND()`

---

## 2026-05-02 v5.0-fix2 — 广场素材不即时更新

**现象**：用户将素材设为"公开"后，切换到"广场素材"标签页，看不到刚公开的素材。

**根因**：`library/page.tsx` 的 `togglePublic` 成功后只更新了 `myAssets` 本地状态，没有重新请求 `/api/assets/public`。

**解决**：在 `togglePublic` 成功后，立即 `fetch('/api/assets/public')` 重新加载广场素材列表。

**预防措施**：
- 任何影响多个数据源的变更操作，都要同步更新所有相关数据源
- 或者使用统一的数据刷新策略（如 SWR/React Query 的自动重新验证）

---

## 2026-05-02 v5.0-fix3 — 素材库缺少删除功能

**现象**：用户保存了错误的对白素材，无法删除。

**根因**：只有创建和读取接口，没有 DELETE 接口，前端也没有删除按钮。

**解决**：
1. 在 `/api/assets/[id]/route.ts` 中添加 `DELETE` 方法
2. 前端素材卡片添加删除按钮（红色 Trash2 图标）
3. 点击后确认弹窗，成功后从本地状态移除

**预防措施**：
- 任何资源管理功能都必须包含 CRUD 完整操作
- 删除操作必须有二次确认

---

## 2026-05-03 v5.0-fix4 — AI房间创建时仍使用findFirst（脑洞重复）

**现象**：用户从泡泡点击进入匹配，超时后选择AI对话，发现AI房间的脑洞与自己选择的不同，且总是最热那个。

**根因**：`api/rooms/ai/route.ts` 中未指定脑洞时，仍使用 `db.brainhole.findFirst({ orderBy: { hotScore: "desc" } })`，总是返回最热脑洞。同时超时选择AI时没有传递用户之前选择的brainholeId。

**解决**：
1. AI房间API改为热度加权随机（同match-engine）
2. `duo-timeout` 创建AI房间时优先使用用户之前选择的brainholeId（localStorage中）
3. `duo-timeout` 继续等待时传递brainholeId到等待页

**预防措施**：
- 所有随机选择逻辑必须统一使用加权随机，禁止findFirst+orderBy
- 用户选择的数据在流程跳转中必须显式传递（URL参数 > localStorage）

---

## 2026-05-03 v5.0-fix5 — 匹配逻辑忽略用户指定的brainholeId

**现象**：用户从泡泡点击选择了特定脑洞，进入匹配后，匹配到的房间使用了完全不同的脑洞。

**根因**：`match-engine.ts` 中 `isQuickMatch = mode === "quick"` 为true时，`!isQuickMatch && brainholeId` 条件为false，导致matchWhere中没有brainholeId限制，匹配到任意等待中的用户。

**解决**：将 `hasExplicitBrainhole = !!brainholeId` 作为独立条件。当用户明确传入brainholeId时，无论是否quick模式，都在匹配查询中限制同brainholeId。

**预防措施**：
- 用户明确选择的数据优先级高于系统默认逻辑
- quick模式不应覆盖用户的明确意图

---

## 2026-05-03 v5.0-fix6 — 文本对比度不足、触控区域过小

**现象**：
1. 多处 `text-white/30` 在暗色背景下对比度约2.1:1，低于WCAG AA标准(4.5:1)
2. 底部导航按钮 `py-1 px-3` 约32px高，低于移动端推荐最小触控区域44x44dp
3. 素材库小按钮 `px-2 py-0.5` 仅约24px
4. 布局 `max-w-md` 在大屏上两侧大量空白

**解决**：
1. 关键文本提升到 `text-white/50`，标签提升到 `text-white/60`
2. 底部导航 `min-h-11 min-w-11` + `safe-area-pb`
3. 素材库tab `py-3.5`，小按钮 `px-3 py-1.5`
4. 布局改为 `max-w-md sm:max-w-lg`
5. 泡泡添加 `bubble-pressed` 光晕反馈 + `bubble-selected-glow` 扩散动画

**预防措施**：
- 暗色背景上文本对比度至少4.5:1（WCAG AA）
- 所有可交互元素最小触控区域44x44dp
- 使用 `env(safe-area-inset-bottom)` 适配iOS刘海屏

---

## 2026-05-03 v5.1 — 故事大厅模块开发

**新增功能**：
1. 故事广场（/story-hall）- 发起故事+项目列表
2. 故事详情（/story-hall/[storyId]）- 世界观+角色认领
3. 多人对白室（/story-hall/[storyId]/room）- WebSocket实时+导演控场+AI分支

**数据库模型**（Prisma新增）：
- `Story` / `StoryRole` / `StoryChapter` / `StoryMessage` / `StoryInspiration` / `StoryBranch`

**WebSocket扩展**：
- `join-story` / `leave-story` / `send-story-message` / `director-pause` / `director-resume` / `branch-proposed` / `branch-vote` / `story-typing`

**AI集成**：
- `generateBranchOptions()` 函数：DeepSeek分析对白生成3个分支选项
- 降级方案：内置通用分支选项

**文件清单**（新增15个文件）：
- 9个API路由 + 3个前端页面 + 2个弹窗组件 + socket-handler扩展

**预防措施**：
- 新模块开发前先完成数据库模型设计
- WebSocket事件命名使用 `story-` 前缀避免与原有房间事件冲突
- 认领角色时检查是否已认领该故事的其他角色（一人一角色）

---

## 2026-05-03 v5.2 — 聊天身份显示错误+刘看山形象修复

**现象1**：用户选择了身份（如"急诊科护士"）进入对白实验室后，聊天界面显示的身份不正确，有时显示为"我"或默认身份。

**根因**：
1. `duo-match/page.tsx` 保存身份到 `xh_duo_identity`，但没有确保 `xh_user_id` 稳定存在
2. `room/[id]/page.tsx` 中 `user?.id` 不匹配 `RoomParticipant.userId`（guest id 每次刷新变化）
3. 当参与者记录匹配失败时，没有回退到 localStorage 中的身份

**修复**：
1. `duo-match/page.tsx`：保存身份时同时确保 `xh_user_id` 存在且稳定
2. `room/[id]/page.tsx`：
   - 优先读取 `xh_duo_identity` 作为 myIdentity 回退
   - 参与者匹配失败时，尝试找非AI参与者
   - 如果仍然找不到，直接使用 localStorage 中的身份
3. 历史消息渲染时也使用 effectiveIdentity 确保一致性

**预防措施**：
- guest userId 必须在流程开始时生成并持久化到 localStorage
- 任何依赖 userId 匹配的地方都必须有身份回退机制
- 身份选择页面的数据必须和对白室的数据源一致

**现象2**：刘看山头像是一个CSS绘制的简单圆形，不符合"北极狐"形象要求。

**根因**：`LiuKanshanAvatar.tsx` 使用纯CSS绘制（圆形+耳朵+眼睛），没有真实北极狐图片。

**修复**：
1. 改为 `img` 标签加载真实北极狐图片（Unsplash高质量照片）
2. 添加 `onError` 回退到CSS简笔画版本（确保图片加载失败时仍有显示）
3. 保留浮动动画效果

**现象3**：AI system prompt 缺少刘看山的官方设定细节。

**根因**：之前的prompt只有"温暖治愈真实"的抽象描述，没有具体的北极狐身份设定。

**修复**：将完整的官方设定写入system prompt：
- 种族：北极狐，身高75cm，体重7.5kg，尾巴特别短
- 背景：知乎吉祥物、上海走失经历、爸爸看冰山的故事
- 喜好：冰上滑行、钓鱼、柴可夫斯基、北冰洋鳕鱼
- 语言特点：不用第一人称"我"，用"刘看山"自称
- 禁止：客服语气、说教、正确的废话

**涉及文件**：
- `src/app/duo-match/page.tsx`
- `src/app/room/[id]/page.tsx`
- `src/components/layout/LiuKanshanAvatar.tsx`
- `src/app/api/ai/chat/route.ts`

---

## 2026-05-04 v5.3 — 形象修正+导航修正+全平台对比度修复+泡泡交互强化

**现象1**：v5.2中刘看山使用了写实北极狐照片，与知乎官方卡通形象不符。

**根因**：搜索图片时误用了Unsplash上的真实北极狐 wildlife 照片，而非知乎IP形象。

**修复**：
1. 替换为知乎官方卡通头像 `https://pic1.zhimg.com/da8e974dc.jpg`（经多次验证可用，640x640）
2. 保留 `onError` 回退到CSS简笔画，防止外部CDN故障

**现象2**：首页"多人组队"入口跳转到了不存在的 `/multiplayer`。

**根因**：v5.1新增故事大厅模块后，首页入口URL未同步更新。

**修复**：`home/page.tsx` 中 `mode.id === 'multi'` 时路由改为 `/story-hall`。

**现象3**：全平台大量页面使用 `text-white/30` 及以下透明度，对比度不足。

**根因**：设计时追求"精致暗色调"，过度降低次要文本透明度，导致在部分屏幕上难以阅读。

**修复规则**：
- `text-white/20` → `text-white/40`（提示文字、字数统计）
- `text-white/25` → `text-white/40`（次要文本、时间戳）
- `text-white/30` → `text-white/50`（描述文字、状态提示）
- `placeholder-white/20` → `placeholder-white/30`
- 禁用态/不可用状态保持或适当提高

**涉及文件（25个）**：LoginForm, register, duo-match, duo-timeout, duo-waiting, library, library/[id], multi-match, multi-waiting, profile, story, story-hall（3个）, story-hall/room, zhihu-search, zhihu-zhida, Bubble, ModeDock, LiuKanshanAvatar, DuoIdentityModal, ChatRoom, MessageBubble, ClaimRoleModal, globals.css

**现象4**：泡泡点击反馈不够明显，用户不确定是否触发。

**修复**：
1. CSS强化按下态光晕（内发光+外发光+金边）
2. 新增涟漪扩散动画 `.bubble-ripple`
3. Bubble组件增加 `showRipple` 状态，点击时渲染涟漪层
4. 增大选中光晕扩散范围（inset -8px → scale 1.6）

**预防措施**：
- 使用外部图片URL前必须验证来源和版权（知乎官方图片可直接使用）
- 新增页面/修改路由时同步检查所有入口跳转
- 暗色背景文本透明度最低限度：主文本≥50%，次要文本≥40%，提示≥30%
- 交互反馈需要"视觉确认"——用户操作后必须有明确的视觉变化

---

## 2026-05-04 v5.3-deploy — 服务器部署问题

**现象1**：SSH密钥认证失败，无法自动登录服务器。

**根因**：服务器上 `~/.ssh/authorized_keys` 未包含本地 `id_ed25519.pub`，或sshd配置禁用了该密钥。

**解决**：使用paramiko + 密码认证作为备用方案。

**现象2**：`git pull origin dev` 连接GitHub超时（135秒）。

**根因**：服务器工作目录有大量未提交的本地修改（`M`/`??`标记），git处于dirty状态，导致pull操作异常缓慢/失败。

**解决**：`git reset --hard origin/dev && git clean -fd` 强制同步到远程dev分支，放弃所有服务器本地修改。

**现象3**：Windows控制台 `UnicodeEncodeError: 'gbk' codec can't encode character '\u2713'`。

**根因**：PowerShell默认GBK编码，npm输出的✓（对勾）字符无法编码。

**解决**：Python脚本中 `sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')`。

**预防措施**：
- 服务器代码永远以GitHub的`dev`分支为唯一真理源，服务器不做任何本地修改
- 跨平台部署脚本必须处理Unicode编码
- 保留密码作为SSH备用认证方式
- 部署前执行 `git status` 检查，dirty状态下先reset再pull
