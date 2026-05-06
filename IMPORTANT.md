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
npx prisma migrate deploy   # 生产环境
npm run build
pm2 restart all
```

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
