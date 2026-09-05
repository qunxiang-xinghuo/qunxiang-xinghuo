# 安全加固文档（SECURITY.md）

群像·星火 — 网络安全防护体系

---

## 一、防护总览

| 防护层 | 措施 | 位置 |
|--------|------|------|
| 传输层 | 强制 HTTPS + HSTS + www 归一 | next.config.ts |
| 浏览器层 | CSP 内容安全策略、X-Frame-Options、COOP/CORP | next.config.ts |
| 边缘层 | 中间件：可疑请求拦截、全局限流、登录态校验 | src/middleware.ts |
| 认证层 | bcrypt(12轮)、HttpOnly/Secure Cookie、防时序攻击 | src/lib/auth-config.ts |
| 接口层 | Zod 输入验证、参数化查询、权限校验 | src/app/api/** |
| 应用层 | 速率限制、登录失败锁定、敏感词过滤 | src/lib/rate-limit.ts |
| 审计层 | 登录/注册/举报/改密审计日志 | src/lib/audit-log.ts |

---

## 二、HTTP 安全响应头

所有响应自动携带以下安全头（`next.config.ts` 配置）：

- **Content-Security-Policy**：限制脚本/样式/图片/连接来源，阻止内联非法脚本、iframe 嵌套（`frame-ancestors 'none'`）
- **Strict-Transport-Security**：`max-age=63072000; includeSubDomains; preload`（2 年，强制 HTTPS）
- **X-Frame-Options: DENY**：防点击劫持
- **X-Content-Type-Options: nosniff**：防 MIME 嗅探
- **Referrer-Policy**：`strict-origin-when-cross-origin`
- **Permissions-Policy**：禁用摄像头、麦克风、定位、支付、USB、陀螺仪
- **Cross-Origin-Opener/Resource-Policy**：跨域隔离
- **X-DNS-Prefetch-Control: off**：减少信息泄露
- API 路由额外 `Cache-Control: no-store`（防敏感数据被缓存）

---

## 三、认证安全

### 密码存储
- 使用 **bcrypt，12 轮哈希**（注册、改密统一走 `hashPassword()`）
- 密码要求：≥8 位、含字母和数字、禁用常见弱密码（password、12345678 等）、禁止连续重复字符

### 会话 Cookie
- `HttpOnly`：JS 无法读取（防 XSS 窃取会话）
- `Secure`：生产环境仅通过 HTTPS 传输
- `SameSite=Lax`：防 CSRF
- 生产环境使用 `__Secure-` / `__Host-` 前缀
- 会话有效期：7 天

### 防用户枚举 / 时序攻击
- 登录失败统一返回"凭证错误"，不区分"邮箱不存在"和"密码错误"
- 用户不存在时也执行一次 bcrypt 比较，使响应时间一致

---

## 四、接口安全

### 输入验证（Zod）
所有写入接口使用 Zod Schema 校验：邮箱格式、用户名字符集、内容长度、枚举值。

### 注入防护
- **SQL 注入**：全部通过 Prisma 参数化查询，不拼接 SQL
- **XSS**：React 默认转义；服务端 `sanitizeInput()` 移除 null 字节；CSP 头兜底
- **路径遍历**：中间件拦截 `../`、`%2e%2e`、null 字节等可疑路径

### 权限控制
- 敏感页面（/profile、/match、/room/create 等）由 middleware 校验登录态
- `GET /api/reports`（举报列表）**仅管理员**（`ADMIN_EMAILS` 白名单）可访问
- 未授权访问会写入审计日志（WARNING 级别）

### AI 接口
- AI 相关接口限流 **10 次/分钟/IP**（成本控制，防滥用）

---

## 五、速率限制与防暴力破解

### 三层限流
1. **中间件层**：敏感 API 10 次/分，普通 API 100 次/分
2. **路由层**：登录/注册/改密/举报 5 次/分
3. **AI 层**：AI 接口 10 次/分

### 登录失败锁定
连续失败触发递增锁定（`src/lib/rate-limit.ts`）：
- 3 次失败：警告
- 5 次失败：锁定 5 分钟
- 6–9 次：锁定 15 分钟
- ≥10 次：锁定 1 小时

超限返回 `429 Too Many Requests` + `Retry-After` 头。

---

## 六、敏感数据保护

- `.env`、`.env.local`、`.env.production` 全部在 `.gitignore`
- 数据库文件 `*.db` / `*.sqlite` 不入库
- 提供 `.env.example` 模板，真实密钥绝不硬编码
- 审计日志脱敏（不记录密码、完整请求体）
- 举报接口不向前端返回内部 IP 等字段

### 部署需配置的环境变量
| 变量 | 说明 |
|------|------|
| `AUTH_SECRET` | JWT 密钥，`openssl rand -base64 32` 生成 |
| `DATABASE_URL` | SQLite 路径 |
| `NEXTAUTH_URL` | 正式域名 |
| `ADMIN_EMAILS` | 管理员邮箱白名单（逗号分隔） |
| `COZE_API_KEY` | AI 模型密钥 |

---

## 七、审计日志

记录以下敏感操作（写入 `/app/work/logs/bypass/audit.log`，JSON 行格式）：
- 用户登录成功/失败
- 用户注册
- 密码修改
- 举报提交
- 管理员接口未授权访问

每条包含：时间戳、级别、动作、用户 ID、IP、User-Agent、结果。

---

## 八、待办与持续改进

- [ ] 服务器切换到**生产模式**启动（`pnpm build && pnpm start`），移除 Turbopack HMR
- [ ] 公安备案号审核通过后更新页脚
- [ ] 定期审查 audit.log，配置日志告警
- [ ] 考虑为房间访问增加参与者令牌校验（当前房间号为 6 位随机，属弱凭据，依赖随机性）
- [ ] 数据库每日备份已配置，定期验证备份可恢复
