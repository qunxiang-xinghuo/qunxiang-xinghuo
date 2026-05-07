# 群像·星火 — 重要操作记录

## v8.1 + v8.1b 改造 — 部署教程

> 最后更新：2026-05-06

### 改动摘要

| 任务 | 文件 | 说明 |
|------|------|------|
| TOP3 极简列表 | `src/app/home/page.tsx` | 排名+脑洞标题+身份+火花数，点击跳转 `/room/[id]` |
| 对白详情只读 | `src/app/room/[id]/page.tsx` | 微信气泡、火花金色边框+发光、评论区 |
| 评论 API | `src/app/api/room-comments/*.ts` | GET列表 / POST创建 / DELETE删除 |
| 职业分类 | `src/app/library/page.tsx` | 横向标签栏(医疗/法律/教育/服务/技术/生活) |
| 分类筛选 API | `src/app/api/sparks/public/route.ts` | 新增 `category` 参数 |
| 全局 Flame | 15 个文件 | Heart/ThumbsUp → Flame，已赞金色 `#e2b04a`+发光 |
| Prisma | `prisma/schema.prisma` | 新增 `RoomComment` 模型 |
| 多人愿景页 | `src/app/multiplayer/page.tsx` | 改为纯文字愿景介绍页，无按钮 |
| 人机改名 | `home/page.tsx`, `solo-match/page.tsx` | "人机交互模式"/"人机模式" → "和刘看山对话" |
| 故事系统 | `prisma/schema.prisma` | Story/StoryRole/Room 扩展，5个太仓解密故事 |
| 故事大厅 | `src/app/story-hall/page.tsx` | 故事卡片列表 + 长期连载入口 |
| 故事详情 | `src/app/story/[id]/page.tsx` | 角色选择 + 15秒匹配 + AI兜底弹窗 |
| 对白室 | `src/app/room/[id]/page.tsx` | 故事信息 + AI催化 + 实时/只读双模式 |
| 我的故事 | `src/app/my-stories/page.tsx` | 我参与的 / 我发起的 |
| 长期连载 | `src/app/story-hall/long-term/page.tsx` | 愿景介绍页 |
| 故事API | `src/app/api/stories/[storyId]/*` | join/join-ai/catalyst/mine |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss   # 生产环境（无 migration baseline）
npm run build
pm2 restart all
```

### 部署验证记录

| 时间 | 版本 | 构建 | 页面数 | PM2 |
|------|------|------|--------|-----|
| 2026-05-06 | v8.1+v8.1b | ✅ | 68/68 | ✅ online |
| 2026-05-06 | v8.0 story | ✅ | 70/70 | ✅ online (pid 772606) |

---

## v8.0 登录系统强制守卫修复 — 部署教程

> 更新：2026-05-06

---

### 🔴 关键问题1：代码源不对

你之前执行的命令：
```bash
git pull origin dev   # ❌ 错误！origin 是 GitHub，代码不是最新的
```

**正确命令**：
```bash
git pull fqunxiang dev   # ✅ 正确！fqunxiang 是自建服务器，有最新 v8.0 修复
```

---

### 🔴 关键问题2：SSH 密钥权限

如果你遇到：
```
git@fqunxiang.x404.online: Permission denied (publickey).
```

**原因**：服务器上没有配置访问 `fqunxiang` 的 SSH 私钥。

**解决**：使用 deploy.sh 中配置的 SSH 命令：
```bash
# 方法1：设置环境变量后拉取
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev

# 方法2：直接用 SSH 命令拉取
GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222' git pull fqunxiang dev

# 方法3：如果用不了 SSH，改用 HTTPS（需要密码）
# git pull https://fqunxiang.x404.online:2222/qunxiang/qunxiang-xinghuo.git dev
```

---

### ✅ 正确的完整部署步骤（在服务器上执行）

```bash
# 1. 进入项目目录
cd /www/wwwroot/qunxiang-xinghuo

# 2. 从正确的远程拉取最新代码（fqunxiang，不是 origin）
git pull fqunxiang dev

# 3. 完全清除 Next.js 构建缓存（防止任何缓存残留）
rm -rf .next

# 4. 安装依赖（如果有新增包）
npm install

# 5. 重新构建
npm run build

# 6. 重启 PM2 进程
pm2 restart all

# 7. 确认服务状态
pm2 status
```

---

### 📋 验证登录守卫是否生效

**方法1：用 curl 测试（无 cookie）**
```bash
# 未登录访问受保护页面 → 应该返回 307 重定向到 /login
curl -I -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --cookie "" http://localhost/home
curl -I -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --cookie "" http://localhost/spectate
curl -I -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --cookie "" http://localhost/library

# 预期输出：
# 307 /login
# 307 /login
# 307 /login
```

**方法2：用浏览器测试**
1. 打开浏览器的无痕/隐私模式
2. 访问 `http://81.70.59.228/home`
3. 必须自动跳转到登录页，且**看不到任何页面内容**（空白后直接跳转）
4. 登录页上**绝对不能有底部导航栏**

---

### 🔧 常见问题排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 未登录还能看到页面内容 | AppShell 守卫失效 | 检查 `src/components/layout/AppShell.tsx` 是否存在 |
| 登录页有底部导航栏 | BottomNav 未隐藏 | 检查 `src/components/layout/BottomNav.tsx` 是否有 `/login` 判断 |
| 退出登录后还能访问 | Token 未服务器端失效 | 检查 `prisma/schema.prisma` 是否有 `tokenRevokedAt` 字段 |
| 构建失败 | TypeScript 错误 | 执行 `npm run build` 查看具体错误 |
| PM2 启动失败 | 端口占用 | `pm2 delete all && pm2 start npm --name "qunxiang-xinghuo" -- start` |

---

### 📁 文件变更清单（v8.0）

```
modified:   middleware.ts                          # 添加 no-store 头
modified:   next.config.ts                         # /spectate 禁用缓存
modified:   prisma/schema.prisma                    # 新增 tokenRevokedAt
modified:   scripts/deploy.sh                       # 完全清除 .next + Nginx 重启
modified:   src/app/api/users/me/route.ts           # Token 撤销检查
modified:   src/app/home/page.tsx                   # useRequireAuth 门禁
modified:   src/app/library/page.tsx                # useRequireAuth 门禁
modified:   src/app/profile/page.tsx                # useRequireAuth + 登出增强
modified:   src/app/settings/page.tsx               # useRequireAuth 门禁
modified:   src/app/spectate/page.tsx               # 服务端守卫 + 客户端重定向
modified:   src/app/spectate/SpectateClient.tsx     # useRequireAuth 门禁
modified:   src/components/layout/AppShell.tsx       # 渲染级空白屏守卫
modified:   src/components/layout/BottomNav.tsx      # /login 最优先返回 null
new file:   src/app/api/auth/logout/route.ts        # 服务器端登出 API
new file:   src/hooks/useRequireAuth.ts             # 统一认证门禁 hook
new file:   src/lib/auth-utils.ts                   # Token 撤销辅助函数
```

---

### 🖥️ 服务器部署操作记录

**2026-05-06 服务器手动部署**
```bash
# 1. 进入目录
cd /www/wwwroot/qunxiang-xinghuo

# 2. 设置 SSH 密钥环境变量（解决 Permission denied）
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'

# 3. 从自建服务器拉取最新代码
git pull fqunxiang dev
# 结果：Already up to date

# 4. 完全清除 Next.js 构建缓存
rm -rf .next

# 5. 安装依赖
npm install
# 结果：up to date in 4s

# 6. 构建
npm run build
# 结果：✓ Compiled successfully in 18.2s
#        ✓ 66 pages + 所有 API routes

# 7. 重启 PM2
pm2 restart all
# 结果：[qunxiang-xinghuo](0) ✓ online pid=694021
```

**服务器验证测试**
```bash
curl -I -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --cookie "" http://localhost/home
# 结果：307 http://localhost/login ✅

curl -I -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --cookie "" http://localhost/spectate
# 结果：307 http://localhost/login ✅
```

### 🧪 测试记录

**2026-05-06 v8.0 最终测试**
- 构建状态：✅ 66 pages + 所有 API routes 全部通过
- 无 cookie 访问测试（15个受保护页面）：全部 307 → `/login`
- 公开页面测试（/, /login, /register）：全部 200
- API 测试：`/api/users/me` 无 cookie → 401，`/api/auth/logout` → 200
- 服务器部署状态：✅ 已部署，PM2 online

---

## v8.0 TOP3 火花墙改造 — 部署记录

**2026-05-06 v8.0-spark-wall 部署**
```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm install
npm run build
pm2 restart all
```

**新增文件清单**
- `src/app/api/sparks/top/route.ts` — TOP3 火花排行榜 API
- `src/app/api/sparks/[id]/route.ts` — 火花详情 API
- `src/app/spark-detail/[id]/page.tsx` — 火花详情页（服务端）
- `src/app/spark-detail/[id]/SparkDetailClient.tsx` — 微信聊天风格展示

**修改文件清单**
- `src/app/home/page.tsx` — TOP3 从脑洞排行改为火花排行
- `middleware.ts` — 添加 `/spark-detail` 路由保护

**验证结果**
- 构建：✅ 67 pages 全部通过
- 公开页面：✅ / /login /register 全部 200
- 登录守卫：✅ /home /library /profile /settings /spectate /solo-match /duo-match /healing /story-hall 全部 307→/login
- 已知问题：✅ opacity:0 / BottomNav / findUnique / useSearchParams 无复现


---

## v8.0 故事系统代码审查修复 — 部署记录

> 更新：2026-05-06

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss   # 生产环境（无 migration baseline）
npm run build
pm2 restart all
```

### 新增/修改的文件清单

```
modified:   src/app/api/rooms/[roomId]/finish/route.ts      # 幂等检查+事务+观众权限
modified:   src/app/api/stories/[storyId]/join/route.ts     # 乐观锁+活跃房间检查+防重复房间
modified:   src/app/api/stories/[storyId]/join-ai/route.ts  # 防重复AI房间
modified:   src/app/api/stories/[storyId]/catalyst/route.ts # room-story关联验证
modified:   src/app/room/[id]/page.tsx                      # setTimeout清理+off替代removeAllListeners+hasJoinedRef+防御式编程+AbortController
modified:   src/app/story/[id]/page.tsx                     # 轮询防并发pollInProgress
modified:   src/app/home/page.tsx                           # 我的故事入口（前期已提交）
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript 编译 | ✅ 通过 |
| 静态页面生成 | ✅ 70/70 |
| API 路由 | ✅ 全部通过 |
| 竞态条件修复 | ✅ join 乐观锁 + finish 事务 |
| 内存泄漏修复 | ✅ setTimeout 清理 + AbortController |
| 防御式编程 | ✅ userId?.startsWith + 观众权限 |
| 幂等性 | ✅ finish 重复调用安全 |

---


---

## v8.0 故事系统 UX 优化 — 部署记录

> 更新：2026-05-06

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss
npm run build
pm2 restart all
```

### 新增/修改的文件清单

```
modified:   src/app/room/[id]/page.tsx           # openingInfo 30秒折叠 + 结束确认卡片 + 再来一局 + AI story context
modified:   src/app/story/[id]/page.tsx           # 🎲 随机角色 + 详情展开 + 10秒等待
modified:   src/app/story-hall/page.tsx           # 空状态引导
modified:   src/components/layout/AppShell.tsx    # Error Boundary
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript 编译 | ✅ 通过 |
| 静态页面生成 | ✅ 70/70 |
| openingInfo 折叠逻辑 | ✅ 30秒自动 + 手动展开 |
| 结束确认卡片 | ✅ 替代 confirm |
| 随机分配角色 | ✅ 从未选角色中随机 |
| AI story context | ✅ system prompt 含角色+故事线 |
| Error Boundary | ✅ 渲染错误时显示刷新按钮 |

---


---

## v8.0 故事系统全方位建议实现 — 部署记录

> 更新：2026-05-06

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss
# 如需更新种子数据：npx tsx prisma/seed-stories.ts
npm run build
pm2 restart all
```

### 新增/修改的文件清单

```
modified:   prisma/seed-stories.ts                    # 剧本杀化 openingInfo + description
modified:   src/app/api/stories/[storyId]/catalyst/route.ts  # 叙事风格催化提示
modified:   src/app/room/[id]/page.tsx                 # placeholder/动画/折叠/确认卡片/再来一局/AI context
modified:   src/app/story-hall/page.tsx                # 分类标签筛选（全部/古风/民国/现代）
modified:   src/app/story/[id]/page.tsx                # 随机角色/详情展开/10秒等待/加载遮罩
modified:   docs/story-system-flow.md                  # 6处流程图修正
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript 编译 | ✅ 通过 |
| 静态页面生成 | ✅ 70/70 |
| 种子数据剧本杀化 | ✅ 10个角色 openingInfo 悬念化 |
| 催化提示叙事化 | ✅ 环境事件风格（烛火/脚步声/空气凝固） |
| 分类标签筛选 | ✅ 古风/民国/现代 |
| 随机分配角色 | ✅ 从未选角色中随机 |
| 加载全局遮罩 | ✅ joinLoading 时显示 |
| Error Boundary | ✅ 渲染错误时显示刷新按钮 |

---


---

## v8.0 生产部署最终记录

> 更新：2026-05-06
> 状态：✅ 已部署，PM2 online

### 部署步骤（实际执行）

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss
npm run build
pm2 restart all
```

### 种子数据执行

```bash
# 注意：需先设置 DATABASE_URL，否则连接到空数据库
cd /www/wwwroot/qunxiang-xinghuo
export DATABASE_URL="file:./dev.db"
npx prisma db push --accept-data-loss
npx tsx prisma/seed-stories.ts
```

### 生产环境陷阱

| 陷阱 | 说明 | 解决 |
|------|------|------|
| DATABASE_URL 环境变量 | shell 中 `DATABASE_URL` 为空，`.env` 文件不被 `process.env` 读取 | 执行前必须 `export DATABASE_URL="file:./dev.db"` |
| 种子重复执行 | 脚本执行了两次，产生 10 个故事 | `sqlite3 dev.db "DELETE FROM Story WHERE id NOT IN (SELECT MAX(id) FROM Story GROUP BY title);"` |
| dev.db vs prisma/dev.db | 根目录 dev.db 为空，prisma/dev.db 有旧数据 | 统一使用 `file:./dev.db` |

### 验证结果

| 检查项 | 结果 |
|--------|------|
| 构建 | ✅ 70/70 |
| PM2 | ✅ online (pid 815133) |
| Story 表 | ✅ 5 个故事 |
| 种子数据 | ✅ 剧本杀化 openingInfo |

---


---

## v8.0 登录/注册服务器错误修复 — 部署记录

> 更新：2026-05-06

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 修复文件清单

```
modified:   src/lib/auth.ts                 # 移除 PrismaAdapter + NEXTAUTH_SECRET fallback
modified:   src/lib/db.ts                   # 全局单例修复
modified:   src/app/api/auth/register/route.ts  # 错误处理增强
```

### 根因说明

**问题**：`@auth/prisma-adapter` v2.x 与 `next-auth` v4.x 不兼容

**原因**：
- 项目使用 `next-auth` v4.24.14（旧版）
- `@auth/prisma-adapter` v2.11.2 是为 next-auth v5 (Auth.js) 设计的
- 两者 API 不兼容，导致 `/api/auth/[...nextauth]` 初始化失败
- 所有认证路由返回 HTTP 500

**解决**：移除 `PrismaAdapter`。项目使用 JWT strategy + CredentialsProvider，根本不需要数据库存储 session/account。

### 验证步骤

```
□ 1. 访问 http://81.70.59.228/ → 登录页正常显示
□ 2. 点击「去注册」→ 注册页正常
□ 3. 输入用户名/密码 → 点击注册 → 注册成功
□ 4. 返回登录 → 输入用户名/密码 → 登录成功 → 跳转 /home
□ 5. 访问 /story-hall → 故事列表正常
```

---

## v8.0 登录 cookie secure 修复 + 发现页 TOP3 恢复 + 数据库路径统一

> 更新：2026-05-06

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 修复文件清单

```
modified:   src/lib/auth.ts                      # cookie secure=false（HTTP 环境兼容）
new file:   src/app/api/sparks/top/route.ts      # TOP3 火花排行榜 API
```

### 问题1：登录成功但会话未建立（cookie secure 陷阱）

**根因**：生产环境使用 HTTP，`secure: true` 的 cookie 被浏览器拒绝发送。

**修复**：`src/lib/auth.ts` 中 cookie options 的 `secure` 改为 `false`。

**验证**：注册 → 登录 → 跳转 `/home` → 显示用户名 ✅

### 问题2：发现页 TOP3 火花列表为空

**根因**：`/api/sparks/top` API 路由缺失（v8.1 改造时未创建）。

**修复**：新建 `src/app/api/sparks/top/route.ts`，从 Asset 表按 hotScore 降序取前 3。

**验证**：登录后访问 `/home` → "今日最热火花"显示 TOP3 数据 ✅

### 问题3：生产数据库路径混乱

**现状**：
- 根目录 `dev.db`：实际使用（516KB+）
- `prisma/dev.db`：旧数据（2.4MB），需清理

**解决**：
```bash
cd /www/wwwroot/qunxiang-xinghuo
# 备份（如需要保留旧数据）
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)
# 删除旧文件
rm -f prisma/dev.db
# 确认根目录 dev.db 正常
sqlite3 dev.db ".tables"
```

### 改动2：发现页第三个模式改为「多人模式」

**改动**：`home/page.tsx` 第三个模式从「故事大厅」→「多人模式」
- 路径：`/story-hall` → `/multiplayer`
- 故事大厅入口保留在底部导航「故事」tab

### 改动3：「我的故事」拆分为两个菜单项

**profile 页面**：
- 「我发起的故事」→ `/my-stories?tab=created`
- 「我参与的故事」→ `/my-stories?tab=participated`

### 改动4：发起故事到审核流程

**流程设计**：
1. 作者进入 `/story/create`
2. 填写故事信息（标题、时代背景、分类、简介）
3. 设定 2-6 个角色（名称、设定、开场信息）
4. 提交后 status = `pending_review`
5. 在「我发起的故事」列表查看审核状态
6. 审核通过后出现在故事大厅

**审核状态**：draft → pending_review → approved → recruiting → ongoing → completed

### 改动5：对白室 brainhole 显示恢复 + AI 去套话 + DM 催化

**文件**：
- `src/app/room/[id]/page.tsx` — brainhole 显示 + AI prompt 改进
- `src/lib/ai/personas.ts` — 新增 `liukanshan` persona
- `src/app/api/stories/[storyId]/catalyst/route.ts` — AI 驱动四幕催化

**AI 改进要点**：
1. 新增 `liukanshan` persona：有情绪、有立场、像真实的人，禁止套话
2. room 页面 AI system prompt 结合刘看山角色 + 故事上下文 + DM 推进目标
3. 催化 API 调用 DeepSeek/知乎直答生成沉浸式环境事件
4. 四幕推进：act1 建立信任 → act2 抛出疑点 → act3 引入转折 → act4 引导真相

### 后续迭代需求（已在 TDD 中标注）

| 需求 | 状态 | 说明 |
|------|------|------|
| 线索卡机制 | ⏳ 待迭代 | 需新增 StoryClue 模型 + UI |
| 结局分支 | ⏳ 待迭代 | 需 AI 情绪分析 API |
| 埋点系统 | ⏳ 待迭代 | 需接入 analytics |
| 用户激励（徽章/积分） | ⏳ 待迭代 | 需 Badge/PointLog 模型 |
| 运营后台 | ⏳ 待迭代 | 需 admin 路由 + 权限 |

---

---
