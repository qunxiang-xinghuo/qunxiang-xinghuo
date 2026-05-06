# 群像·星火 — 重要操作记录

## v8.0 登录系统强制守卫修复 — 部署教程

> 最后更新：2026-05-06

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
