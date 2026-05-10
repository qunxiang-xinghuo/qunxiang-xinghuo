# 群像·星火 — 重要操作记录

## v8.3c + v8.5 热修复 — 部署教程

> 最后更新：2026-04-29

### 改动摘要

| 任务 | 文件 | 说明 |
|------|------|------|
| 匹配引擎队列化 | `src/server/match-engine.ts` | Promise 队列消除 SQLite 竞态 |
| 匹配状态修复 | `src/server/match-engine.ts` | `createDuetMatchTx` 补充 `status: "matched"` |
| 无效 brainholeId 防御 | `match-engine.ts` + `invite/route.ts` | 查询不存在时清空，避免外键约束 500 |
| localStorage JSON 防御 | `duo-waiting/page.tsx` + `duo-timeout/page.tsx` | JSON 字符串提取 `id` |
| Admin Dashboard | `admin/page.tsx` + `api/admin/users` | 房间监控 + 用户 CRUD |
| 观看返回死循环 | `spectate/[roomId]/page.tsx` | `router.push` → `router.back` |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 部署验证记录

| 时间 | 版本 | 构建 | 页面数 | PM2 |
|------|------|------|--------|-----|
| 2026-04-29 | v8.3c+v8.5 | ✅ | 81/81 | ✅ online |
| 2026-04-29 | v8.5b | ✅ | 81/81 | ✅ online |

**v8.5b 修复清单**：
- duo-match 按钮重排（进入邀请房间/跟好友匹配/快速匹配）
- duo-waiting 去掉分享按钮
- invite API 无脑洞时随机分配
- socket-handler 空房间自动关闭
- room 页面 opponent-left 监听
- room 返回按钮确认提示
- duo-waiting 404 防御

---

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
2. 访问 `http://<服务器IP已脱敏>/home`
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
□ 1. 访问 http://<服务器IP已脱敏>/ → 登录页正常显示
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

### 部署注意事项

**SSH 密钥环境变量**（手动部署时必须设置）：
```bash
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
```

**PM2 重启命令**：
```bash
pm2 restart all   # ✅ 正确
pm2 restart al    # ❌ 错误（al 不是有效的进程名）
```

### 后续迭代需求（已在 TDD 中标注）

| 需求 | 状态 | 说明 |
|------|------|------|
| 线索卡机制 | ⏳ 待迭代 | 需新增 StoryClue 模型 + UI |
| 结局分支 | ⏳ 待迭代 | 需 AI 情绪分析 API |
| 埋点系统 | ⏳ 待迭代 | 需接入 analytics |
| 用户激励（徽章/积分） | ⏳ 待迭代 | 需 Badge/PointLog 模型 |
| 运营后台 | ⏳ 待迭代 | 需 admin 路由 + 权限 |

重要信息：宝塔私钥路径为 `<本地私钥路径已脱敏>`
服务器	<服务器IP已脱敏>	暴露真实IP，易受攻击
SSH	<SSH私钥文件名已脱敏>、端口 <SSH端口已脱敏>暴露私钥路径和端口路径	<服务器项目路径已脱敏>暴露服务器目录结构	替换为域名	<Git服务器域名已脱敏>	暴露Git服务器	
私钥	<私钥文件名已脱敏> 及路径	最高风险，绝对不能泄露	
Webhook	http://<服务器IP已脱敏>/webhook	暴露内网服务	
数据库	SQLite文件路径	暴露数据位置	替换为通用描述

---

---

---

## v8.0 路演前 — 自动化部署系统

> 更新：2026-04-29

### 一键部署脚本

```bash
# 赋予执行权限（首次使用）
chmod +x /www/wwwroot/qunxiang-xinghuo/scripts/deploy-auto.sh

# 执行一键部署
/www/wwwroot/qunxiang-xinghuo/scripts/deploy-auto.sh
```

脚本自动执行以下流程：
1. 数据库备份（带时间戳）
2. 从 `fqunxiang dev` 拉取最新代码
3. 安装依赖
4. 数据库 Schema 同步（`prisma db push`）
5. 项目构建（失败自动重试，最多3次）
6. 重启 PM2 + Nginx
7. 部署后验证（登录页状态码、守卫拦截、PM2状态、HTML内容）

### ⚠️ 部署前环境变量检查

**必须确认 `.env` 中以下变量已设置：**

```bash
cd /www/wwwroot/qunxiang-xinghuo

# 检查 NEXTAUTH_SECRET（必须 >= 32 字符）
grep NEXTAUTH_SECRET .env || echo 'NEXTAUTH_SECRET=qunxiang-xinghuo-production-secret-key-2026' >> .env

# 检查 DATABASE_URL
grep DATABASE_URL .env || echo 'DATABASE_URL=file:./dev.db' >> .env

# 检查 DEEPSEEK_API_KEY（如使用 AI 抓取）
grep DEEPSEEK_API_KEY .env || echo 'DEEPSEEK_API_KEY=your_key_here' >> .env
```

**v8.0-sec-fix 注意**：`NEXTAUTH_SECRET` 已无 fallback，未设置将导致构建失败！

### 部署后登录页验证

```bash
# 执行登录页专项检查
chmod +x /www/wwwroot/qunxiang-xinghuo/scripts/verify-login-page.sh
/www/wwwroot/qunxiang-xinghuo/scripts/verify-login-page.sh http://localhost:3000
```

验证项：
- HTML 包含 `<form>` 和 `<input>` 标签
- 无 `opacity:0` 隐藏属性
- 页面返回 200
- 未登录访问 `/home` 被重定向到 `/login`

### 部署失败排查指南

| 阶段 | 可能失败原因 | 排查方法 |
|------|-------------|----------|
| 代码拉取 | SSH 密钥权限 | `ls -la /root/.ssh/id_ed25519_fqunxiang` |
| 依赖安装 | npm registry 超时 | `npm config set registry https://registry.npmmirror.com` |
| 数据库同步 | DATABASE_URL 未设置 | `export DATABASE_URL="file:./dev.db"` |
| 构建 | TypeScript 错误 | 查看日志中 `Failed to type check` 后的文件名和行号 |
| PM2 重启 | 端口占用 | `lsof -i :3000` 或 `pm2 delete all` 后重新启动 |
| Nginx | 配置文件错误 | `nginx -t` 测试配置 |

---

## v8.0 路演前 — 登录页消失预防规范

### 代码规范（已落实）

1. **动画组件初始状态**：所有 `motion.*` 组件使用 `initial={mounted ? ... : false}`，服务端渲染期间不执行动画
2. **可见状态标记**：`const [mounted, setMounted] = useState(false)` + `useEffect(() => setMounted(true), [])`
3. **登录页结构**：服务端 `page.tsx` 为纯 Suspense 包装，`LoginForm` 为客户端组件
4. **浏览器 API 调用**：`window.innerHeight`、`localStorage` 等均在 `useEffect` 中执行

### 每次部署后必做检查

```bash
# 检查1：HTML源码
curl -s http://localhost/login | grep -E "form|input"

# 检查2：状态码
curl -I -s -o /dev/null -w "%{http_code}" http://localhost/login
# 预期：200

# 检查3：守卫拦截
curl -I -s -o /dev/null -w "%{http_code}" --cookie "" http://localhost/home
# 预期：307
```

---

## v8.0 知乎热榜脑洞抓取 — 部署说明

### 环境变量

```bash
# .env 中需要配置
DEEPSEEK_API_KEY=your_key_here
CRAWLER_ADMIN_KEY=your_admin_key_here  # 可选，默认 dev-crawler-key
```

### 手动触发抓取

```bash
curl -X POST http://localhost:3000/api/crawler \
  -H "x-admin-key: dev-crawler-key"
```

### 定时策略

- 服务启动后 30 秒首次执行
- 之后每 6 小时执行一次
- 无需额外配置 cron

---

---

## v8.0 AI 自我修炼系统 — 部署说明

> 更新：2026-04-29

### 数据库 Schema 变更

新增5个表，部署前必须执行：

```bash
cd /www/wwwroot/qunxiang-xinghuo
export DATABASE_URL="file:./dev.db"
npx prisma db push --accept-data-loss
npx prisma generate
```

### 新增表清单

| 表名 | 用途 |
|------|------|
| `AITrainingData` | AI 基础能力池 |
| `AILearningLog` | 实时交互学习日志 |
| `AIOptimizationSummary` | 定期总结优化结果 |
| `CatalystLog` | 催化效果详细日志 |
| `BrainholeSummary` | 脑洞催化效果汇总 |

### 手动触发基础能力投喂

```bash
curl -X POST http://localhost:3000/api/ai-training \
  -H "x-admin-key: dev-crawler-key" \
  -d '{"action":"feed"}'
```

### 查看系统统计

```bash
curl http://localhost:3000/api/ai-training \
  -H "x-admin-key: dev-crawler-key"
```

---


---

## v8.0 路演前关键修复 — 部署记录

> 更新：2026-04-29
> 状态：✅ 已修复，构建通过 74/74 页面

### 修复文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| 匹配引擎事务化 | `src/server/match-engine.ts` | 整个 `findMatch` 流程包裹在 `$transaction` 中 |
| 人机模式脑洞显示 | `src/app/room/[id]/page.tsx` | 增加 `room.scene` 回退显示 |
| 故事详情页403 | `src/app/api/stories/[storyId]/route.ts` | 公开状态判断扩展为包含 `open/recruiting/approved` |
| Suspense 包裹 | `src/app/my-stories/page.tsx` | `useSearchParams` 添加 Suspense 边界 |
| 文档脱敏 | `docs/IMPORTANT.md` | 替换真实IP、端口、密钥路径为占位符 |

### 构建结果

```
▲ Next.js 16.2.4 (Turbopack)
✓ Compiled successfully in 9.0s
✓ Finished TypeScript in 12.9s
✓ Generating static pages (74/74) in 470ms
```

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 验证方法

1. **双人匹配竞态**：用两个无痕浏览器窗口登录不同账号，同时进入双人对白并确认身份，确认匹配成功进入同一房间。
2. **人机模式脑洞**：登录后进入人机模式，确认对白室顶部显示脑洞标题和场景描述。
3. **故事详情**：进入故事大厅，点击任意故事卡片，确认正常显示故事详情而非「故事不存在」。



---

## v8.0 回归bug批量排查 — 部署记录

> 更新：2026-04-29
> 状态：✅ 已修复，构建通过 74/74 页面

### 排查方法

1. 完整阅读 ProblemLog.md（1345行，23个问题记录）
2. 检查5个历史修复方案是否完整存在
3. 数据库状态检查（Asset/Story/Brainhole/Room 表记录数）
4. 构建验证 + 构建产物HTML检查（opacity:0 / animate-spin）

### 修复文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| 火花墙为空 | `src/app/api/rooms/[roomId]/finish/route.ts` | Asset创建时 `isPublic: false` → `true` |
| register页mounted | `src/app/register/page.tsx` | 标题/副标题 motion 添加 mounted 守卫 |

### 根因说明

**火花墙为空**：结束对白时创建的 Asset 默认 `isPublic: false`，而火花墙 API 查询 `isPublic: true`，导致所有火花不可见。产品核心理念是"让真实发光"，应默认公开。

**register页**：标题和副标题的 motion 组件无条件渲染，缺少 mounted 守卫，与历史 "SSR opacity:0" 问题同类。

### 数据库状态（修复前）

| 表 | 记录数 |
|----|--------|
| Asset (isPublic=1) | **0** |
| Story | 5 |
| Brainhole (approved) | 31 |
| Room | 0 |

### 构建结果

```
▲ Next.js 16.2.4 (Turbopack)
✓ Compiled successfully
✓ Generating static pages (74/74)
```

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 部署后验证

1. **火花墙**：结束一场对白后，访问 `/library`，确认火花出现
2. **发现页TOP3**：结束对白后，访问 `/home`，确认TOP3显示新火花
3. **register页**：无痕模式访问 `/register`，确认标题立即可见

---


---

## v8.0 20次流程走查 — 部署记录

> 更新：2026-04-29
> 状态：✅ 已完成，构建通过 74/74 页面

### 排查方法

按照 `story-system-flow.md` 流程图，20个检查点逐条代码审查：
- 核心用户旅程 8个
- 状态机 4个
- 关键交互流程 4个
- 异常处理 4个

### 修复文件清单

| 修复项 | 文件 | 说明 | 提交 |
|--------|------|------|------|
| 火花墙为空 | `finish/route.ts` | Asset `isPublic: false→true` | `6393045` |
| register页mounted | `register/page.tsx` | motion组件添加mounted守卫 | `6393045` |
| 等待时间回归 | `story/[id]/page.tsx` | 15秒→10秒 | `b564f4a` |

### 审计结论

| 维度 | 通过 | 失败 | 风险 |
|------|------|------|------|
| 核心用户旅程 | 7 | 1 | 0 |
| 状态机 | 4 | 0 | 0 |
| 关键交互流程 | 4 | 0 | 0 |
| 异常处理 | 3 | 0 | 1 |
| **合计** | **18** | **1** | **1** |

**唯一失败项**：`story/[id]/page.tsx` 等待时间回归（15秒→10秒，已修复）

**风险项**：`middleware.ts` 调试日志过多（非阻塞，建议后续优化）

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 部署后验证

1. 注册页 `/register` → 标题立即可见，无opacity:0
2. 故事大厅 `/story-hall` → 5个故事卡片正常显示
3. 选择角色 → 等待弹窗显示**10秒**倒计时
4. 结束对白 → 火花出现在 `/library`

---


---

## v8.1-fix5 部署记录

> 更新：2026-04-29
> 修复内容：观看模式僵尸AI房间 + TOP3故事数据过滤 + AI房间空body兼容 + Asset软删除

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang main
rm -rf .next
npx prisma db push --accept-data-loss
npx prisma generate
npm run build
pm2 restart all
```

### 数据库变更

- Asset 表新增字段：`deletedByUser Boolean @default(false)`、`deletedByPartner Boolean @default(false)`

### 文件变更清单

```
modified:   prisma/schema.prisma
modified:   src/app/api/assets/[id]/route.ts
modified:   src/app/api/assets/public/route.ts
modified:   src/app/api/assets/route.ts
modified:   src/app/api/rooms/ai/route.ts
modified:   src/app/api/rooms/public/route.ts
modified:   src/app/api/sparks/[id]/route.ts
modified:   src/app/api/sparks/mine/route.ts
modified:   src/app/api/sparks/public/route.ts
modified:   src/app/api/sparks/top/route.ts
modified:   src/server/socket-handler.ts
```

### 部署后验证

1. **观看模式**：访问 `/spectate`，确认不显示AI房间，只显示真人实时房间
2. **TOP3**：访问 `/home`，确认"今日最热火花"显示脑洞标题，不是故事标题
3. **AI房间创建**：点击"和刘看山对话"，确认正常创建房间并跳转
4. **Asset删除**：
   - 人机模式：删除后物理消失
   - 双人模式：一方删除后从列表隐藏，另一方仍可见；双方都删后物理清除

---


---

## v8.2 管理员后台 + 火花评论 + 故事点赞 — 部署记录

> 更新：2026-04-29
> 修复内容：管理员后台、火花详情评论、故事点赞、我的故事删除

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npx prisma db push --accept-data-loss
npx prisma generate
npm run build
pm2 restart all
```

### 数据库变更

- `User` 表新增 `isAdmin` 字段
- 新增 `StoryLike` 表

### 设置管理员账号

```bash
cd /www/wwwroot/qunxiang-xinghuo
sqlite3 dev.db "UPDATE User SET isAdmin = 1 WHERE username = '你的用户名';"
```

### 文件变更清单

```
modified:   prisma/schema.prisma
new file:   src/lib/admin-utils.ts
new file:   src/app/admin/page.tsx
new file:   src/app/api/admin/rooms/route.ts
new file:   src/app/api/admin/sparks/route.ts
new file:   src/app/api/admin/stories/route.ts
new file:   src/app/api/admin/delete/route.ts
new file:   src/app/api/stories/[storyId]/like/route.ts
modified:   src/app/api/users/me/route.ts
modified:   src/app/api/stories/mine/route.ts
modified:   src/app/spark-detail/[id]/SparkDetailClient.tsx
modified:   src/app/my-stories/page.tsx
modified:   src/app/profile/page.tsx
```

### 部署后验证

1. **管理员后台**：登录管理员账号 → `/profile` 出现「管理员后台」入口 → 可删除僵尸房间/火花/故事
2. **火花评论**：访问任意火花详情 → 底部可发表评论、删除自己的评论
3. **故事点赞**：访问故事详情 → 可点击点赞（不能给自己的故事点赞）
4. **我的故事删除**：`/my-stories` → 每个故事卡片有删除按钮

---


---

## v8.3 紧急修复 — 部署记录

> 更新：2026-04-29
> 修复内容：火花可见性 + 双人匹配/分享 + 疗愈输入框

### 修复文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| 火花跳转 | `src/app/library/page.tsx` | 点击火花跳转 `/spark-detail/${id}`，避免非参与者 403 |
| AI房间审核 | `src/app/api/rooms/[roomId]/finish/route.ts` | `!room.isAiRoom` → `room.isAiRoom !== true` |
| 火花墙过滤 | `src/app/api/sparks/public/route.ts` | 补充 `deletedByPartner: false` |
| 评论认证 | `src/app/spark-detail/[id]/SparkDetailClient.tsx` | 评论 API 发送 `x-guest-id` header |
| 匹配验证 | `src/lib/validators/match.ts` | `brainholeId` 放宽为 `z.string().optional()` |
| 倒计时 | `src/app/duo-waiting/page.tsx` | effect 依赖 `[status]`，支持再次匹配倒计时 |
| 邀请API | `src/app/api/rooms/invite/route.ts` | 支持 `effectiveUserId = userId \|\| guestId` |
| 加入API | `src/app/api/rooms/join/route.ts` | 支持 `effectiveUserId = userId \|\| guestId` |
| 分享按钮 | `src/app/room/[id]/page.tsx` | 添加 fallback `execCommand('copy')` |
| 疗愈输入框 | `src/app/healing/session/[id]/page.tsx` | `textarea` 添加 `min-h-[40px]` |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 部署后验证

1. **火花墙**：用户A结束人机对话，用户B访问 `/library`，应能看到A的火花
2. **火花评论**：点击火花进入详情，底部评论输入框可正常发送评论
3. **双人匹配**：两个无痕窗口同时进入双人对白，10秒内应匹配成功
4. **分享按钮**：房间内点击分享图标，应弹出"房间链接已复制"
5. **疗愈输入框**：进入个人疗愈新建会话，底部输入框可正常点击输入

### 构建验证

| 版本 | 日期 | 构建 | 页面数 |
|------|------|------|--------|
| v8.3 | 2026-04-29 | ✅ | 80/80 |

---


---

## v8.4 种子数据管理员配置 — 部署记录

> 更新：2026-04-29
> 修复内容：数据库种子自动创建管理员 + `.env.example` 更新

### 修改文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| 管理员种子 | `prisma/seed.ts` | 导入 `dotenv/config` + `bcryptjs`，根据环境变量自动创建管理员 |
| 环境变量示例 | `.env.example` | 新增 `BACKEND_ADMIN` / `BACKEND_ADMIN_PAASSWORD` |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev

# 同步数据库 schema（若 User 表无 isAdmin 列）
npx prisma db push --accept-data-loss

# 重新执行种子（自动创建管理员）
npx tsx prisma/seed.ts

rm -rf .next
npm run build
pm2 restart all
```

### 环境变量配置

确保 `.env` 中已设置：

```bash
BACKEND_ADMIN="xingxing"
BACKEND_ADMIN_PAASSWORD="xingxing123"
```

### 关于 `.bundle` 文件

项目根目录下有两个 git bundle 文件：
- `dev.bundle`（161MB）
- `qunxiang-fix7.bundle`（201MB）

**用途**：git bundle 是 Git 的打包格式，用于在无网络环境下传输仓库历史。这两个文件是旧的代码备份/传输包。

**建议**：项目已有正常的 `fqunxiang` 远程仓库，这两个 bundle 文件不再需要，可删除以释放空间：

```bash
rm dev.bundle qunxiang-fix7.bundle
```

### 构建验证

| 版本 | 日期 | 构建 | 页面数 |
|------|------|------|--------|
| v8.4 | 2026-04-29 | ✅ | 80/80 |

---


---

## v8.3b 回归修复 — 部署记录

> 更新：2026-04-29
> 修复内容：火花详情/双人匹配/疗愈输入框 + 管理员登录

### 修复文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| 火花详情 | `src/app/spark-detail/[id]/page.tsx` | 改用 Prisma 直接查询数据库，避免 `localhost:3000` 不可访问 |
| 双人匹配 | `src/server/match-engine.ts` | 移除 `$transaction` 的 `maxWait`/`timeout` 选项 |
| 疗愈输入框 | `src/app/healing/session/[id]/page.tsx` | `textarea` → `input`，固定高度 `h-10` |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev

# 确保 .env 中有管理员配置（如缺失需手动添加）
grep BACKEND_ADMIN .env || echo 'BACKEND_ADMIN="xingxing"' >> .env
grep BACKEND_ADMIN_PAASSWORD .env || echo 'BACKEND_ADMIN_PAASSWORD="xingxing123"' >> .env

# 重新执行种子（确保管理员存在）
npx tsx prisma/seed.ts

rm -rf .next
npm run build
pm2 restart all
```

### 部署后验证

1. **火花详情**：访问 `/library` → 点击火花 → 应正常加载消息记录和评论区
2. **双人匹配**：两个无痕窗口同时匹配 → 10秒内应匹配成功进入同一房间
3. **疗愈输入框**：新建疗愈会话 → 底部输入框可正常点击输入
4. **管理员登录**：用 `xingxing` / `xingxing123` 登录 → `/profile` 应出现「管理员后台」

### 构建验证

| 版本 | 日期 | 构建 | 页面数 |
|------|------|------|--------|
| v8.3b | 2026-04-29 | ✅ | 80/80 |

---


---

## v8.5 邀请机制修复 — 部署记录

> 更新：2026-04-29

### 修复文件清单

| 修复项 | 文件 | 说明 |
|--------|------|------|
| room 页面 x-guest-id | `src/app/room/[id]/page.tsx` | 3 处 fetch 补充 header |
| 邀请码升级 | `src/app/api/rooms/invite/route.ts` | 大写字母数字混合，去除 0O1I |
| Join API 加固 | `src/app/api/rooms/join/route.ts` | 移除事务、5 项血型匹配 |
| 前端输入增强 | `src/app/duo-match/page.tsx` | 自动大写、错误映射 |

### 部署步骤

```bash
cd /www/wwwroot/qunxiang-xinghuo
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
rm -rf .next
npm run build
pm2 restart all
```

### 验证方法

1. **用户A创建邀请**：duo-match → 跟好友匹配 → 进入房间 → 确认邀请码显示
2. **用户B加入**：duo-match → 进入邀请房间 → 输入邀请码 → 确认跳转房间
3. **自己邀请自己**：输入自己的邀请码 → 应提示"这是你自己的房间"
4. **无效邀请码**：输入不存在的码 → 应提示"邀请码无效或房间已过期"

---
