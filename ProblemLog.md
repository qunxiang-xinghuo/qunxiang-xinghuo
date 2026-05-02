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
