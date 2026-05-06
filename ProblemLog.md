# 群像·星火 — 问题排查记录

## v8.0 登录系统修复过程中的关键问题

---

### 问题1：PowerShell Invoke-WebRequest 自动保持 Cookie

**现象**：
- 测试 `/spectate` 时返回 200（已登录状态的页面内容）
- 误以为 Next.js PPR 缓存绕过了守卫
- 花了大量时间排查 Nginx 缓存、PPR 配置、Next.js 预渲染

**根因**：
- PowerShell 的 `Invoke-WebRequest` 命令会自动保持 session cookie
- 之前的 `/api/auth/logout` 测试请求在服务器端设置了 `next-auth.session-token` cookie
- 后续所有 `Invoke-WebRequest` 测试都自动携带了这个 cookie
- 服务器看到 cookie 后认为用户已登录，所以返回了页面内容而不是 307 重定向

**解决**：
- 使用 .NET `HttpWebRequest` 并创建全新的 `CookieContainer` 进行无 cookie 测试
- 命令示例：
  ```powershell
  $request = [System.Net.HttpWebRequest]::Create("http://81.70.59.228/spectate")
  $request.AllowAutoRedirect = $false
  $request.CookieContainer = New-Object System.Net.CookieContainer
  $response = $request.GetResponse()
  ```

**教训**：
- HTTP 客户端工具的 cookie 行为必须了解清楚
- 认证相关的测试必须使用干净的 session
- 遇到"缓存"问题时，先确认不是 cookie 导致的假阳性

---

### 问题2：Next.js PPR (Partial Prerendering) 预渲染

**现象**：
- `/spectate` 响应头中有 `x-nextjs-prerender: 1,1`
- 以为这是导致守卫失效的原因

**根因**：
- Next.js 16 + Turbopack 默认使用 PPR（部分预渲染）
- 即使 `force-dynamic`，PPR 仍会在构建时生成静态外壳
- 但这**不影响守卫逻辑**，因为服务端组件在实际请求时仍会执行
- 有 cookie 的请求会执行服务端组件 → 返回页面内容
- 无 cookie 的请求会执行 `redirect('/login')` → 返回 307

**尝试的解决方案**：
1. `export const dynamic = 'force-dynamic'` — 已存在
2. `export const fetchCache = 'force-no-store'` — 已添加
3. `export const experimental_ppr = false` — 无效
4. `export const ppr = false` — NextConfig 中不支持（非实验性）
5. `unstable_noStore()` — 已添加

**最终方案**：
-  spectate 未登录时返回客户端重定向 HTML：
  ```tsx
  if (!sessionToken) {
    return (
      <html>
        <head>
          <script>window.location.replace("/login")</script>
          <noscript><meta httpEquiv="refresh" content="0;url=/login" /></noscript>
        </head>
        <body />
      </html>
    );
  }
  ```
- 这样即使 PPR 预渲染了此页面，客户端加载后也会立即跳转

---

### 问题3：Git 远程仓库混淆

**现象**：
- 本地推送到了 `fqunxiang` 远程
- 用户在服务器上执行了 `git pull origin dev`
- 服务器代码没有更新到最新

**根因**：
- 项目有两个远程：`origin` (GitHub) 和 `fqunxiang` (自建服务器 x404.online:2222)
- Webhook 自动部署是从 `fqunxiang` 拉取的
- 用户手动操作时使用了 `origin`

**解决**：
- 服务器上必须使用 `git pull fqunxiang dev`
- 或者在服务器上设置默认远程为 `fqunxiang`

---

### 问题4：deploy.sh 缓存清除不足

**现象**：
- 部署后 `/spectate` 仍然返回旧响应
- `rm -rf .next/cache` 不够彻底

**根因**：
- Next.js `output: 'standalone'` 模式下，构建产物分布在多个目录
- `.next/cache` 只清除了缓存目录，但 `.next/standalone` 中可能仍有旧文件
- Nginx `proxy_cache` 可能缓存了响应

**解决**：
- 将 `rm -rf .next/cache` 改为 `rm -rf .next`（完全清除）
- Nginx 重启改为 `nginx -s stop && nginx`（不是 reload）
- 添加多个常见 Nginx proxy_cache 目录的清除

---

### 问题5：Prisma migrate drift

**现象**：
- 添加 `tokenRevokedAt` 字段后，`prisma migrate dev` 失败
- 提示 "Drift detected" 并要求重置数据库

**根因**：
- 之前的 schema 变更没有通过迁移管理，而是直接使用了 `prisma db push`
- 导致迁移历史和实际数据库 schema 不一致

**解决**：
- 开发环境使用 `prisma db push` 直接推送 schema 变更（不创建迁移）
- 生产环境使用 `prisma migrate deploy` 应用已有的迁移

---

### 问题6：服务器 SSH 密钥权限 denied

**现象**：
- 服务器上执行 `git pull fqunxiang dev`
- 报错：`Permission denied (publickey)`

**根因**：
- 服务器上没有配置访问 `fqunxiang.x404.online:2222` 的 SSH 私钥
- deploy.sh 中通过 `GIT_SSH_COMMAND` 环境变量指定了私钥路径
- 手动执行时没有设置这个环境变量

**解决**：
```bash
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
```

---

### 问题7：服务器手动部署 git pull 失败

**现象**：
- 服务器上执行 `git pull fqunxiang dev`
- 报错：`Permission denied (publickey)`

**根因**：
- 手动执行时没有设置 `GIT_SSH_COMMAND` 环境变量
- deploy.sh 脚本中配置了 SSH 私钥路径，但手动执行时未生效

**解决**：
```bash
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
git pull fqunxiang dev
```

**后续**：
- 拉取成功，显示 `Already up to date`
- 执行 `rm -rf .next && npm run build && pm2 restart all`
- 构建成功（66 pages），PM2 重启成功
- curl 验证：`/home` → 307 `/login`，`/spectate` → 307 `/login` ✅

---

## 修复时间线

| 时间 | 事件 |
|------|------|
| 2026-05-06 01:00 | 开始 v8.0 登录系统修复 |
| 2026-05-06 01:30 | AppShell 渲染级守卫完成 |
| 2026-05-06 02:00 | useRequireAuth hook + 页面级门禁完成 |
| 2026-05-06 02:15 | 服务器端登出 API + tokenRevokedAt 完成 |
| 2026-05-06 02:30 | 误以为 `/spectate` 有缓存 bug（实际是 cookie 陷阱） |
| 2026-05-06 02:45 | 发现 Invoke-WebRequest cookie 问题 |
| 2026-05-06 02:50 | 无 cookie 测试全部通过！15个页面全部 307→/login |
| 2026-05-06 03:00 | 最终提交并推送，更新文档 |
| 2026-05-06 13:00 | v8.0 TOP3火花墙改造开始 |
| 2026-05-06 13:30 | 新建 /api/sparks/top + /api/sparks/[id] + /spark-detail/[id] |
| 2026-05-06 14:00 | 修改 /home/page.tsx TOP3 为火花排行榜 |
| 2026-05-06 14:30 | 构建通过 67 pages，全项目自检通过 |

---

## v8.0 TOP3 火花墙改造问题记录

**记录**：v8.0 TOP3 火花墙改造 — 未发现新问题 ✅

**自检结果**：
| 检查项 | 结果 |
|--------|------|
| SSR opacity:0 | ✅ 无复现 |
| 底部导航栏在登录页 | ✅ 无复现 |
| findUnique 误用 | ✅ 无复现（where 条件均为 @id 字段） |
| useSearchParams 未包裹 Suspense | ✅ 无复现（LoginForm 被 page.tsx Suspense 包裹） |
| 消息重复显示 | ✅ 无需测试（仅 UI 改造，未改动消息逻辑） |
