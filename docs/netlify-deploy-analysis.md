# Netlify 部署方案分析

## 用户提案
将前端部署到 Netlify，通过代理指向服务器 IP（81.70.59.228），获得免费 HTTPS。

---

## 方案一：Netlify 前端 + API 代理到服务器（用户方案）

### 架构
```
用户浏览器 ──HTTPS──► Netlify CDN (静态页面)
                        │
                        ├── /api/* ──proxy──► http://81.70.59.228:3000/api/*
                        │
                        └── WebSocket ──???──► 服务器
```

### 可行性
- **静态页面部署**：可行，Netlify 完美支持
- **API 代理**：可行，通过 `netlify.toml` 配置 redirects
- **自动部署**：可行，绑定 GitHub 仓库后自动部署

### 核心限制

#### 1. WebSocket 不支持（致命）
我们的对白室使用 Socket.io，依赖 WebSocket 长连接。

**Netlify 的 redirects 不支持 WebSocket 升级**：
```toml
# 这个配置对 WebSocket 无效
[[redirects]]
  from = "/socket.io/*"
  to = "http://81.70.59.228:3000/socket.io/:splat"
  status = 200
```

**影响**：
- Socket.io 会 fallback 到 HTTP long-polling（轮询）
- 对白室的实时性体验变差
- 高并发时服务器压力增大

#### 2. Next.js App Router 适配
- Netlify 有 Next.js 插件，但 App Router + Server Components 的适配仍在完善
- 部分动态路由和中间件可能行为不一致

#### 3. 跨域问题
- 前端在 `xxx.netlify.app`，API 代理后也显示为 `xxx.netlify.app`
- 表面上没有跨域，但 WebSocket 直连服务器时会有 mixed-content 问题（HTTPS 页面连 WS）

### 配置示例

`netlify.toml`：
```toml
[build]
  command = "npm run build"
  publish = ".next/standalone/.next"

[[redirects]]
  from = "/api/*"
  to = "http://81.70.59.228:3000/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/_next/*"
  to = "/_next/:splat"
  status = 200
```

### 需要用户做的
1. 注册 Netlify 账号
2. 授权 GitHub 仓库访问
3. 配置环境变量（DEEPSEEK_API_KEY 等）
4. 接受 WebSocket 降级为轮询的妥协

---

## 方案二：购买域名 + 服务器 Nginx + Let's Encrypt（推荐）

### 架构
```
用户浏览器 ──HTTPS──► 域名 ──DNS──► 81.70.59.228
                                    │
                                    └── Nginx (SSL终止)
                                         │
                                         ├── / ──► localhost:3000
                                         └── /api/* ──► localhost:3000
```

### 优势
- **WebSocket 完美支持**：同一域名，无 mixed-content 问题
- **完全控制**：前后端统一，没有平台限制
- **知乎 API 回调友好**：HTTPS + 固定域名，满足开放平台要求
- **成本可控**：域名约 50-100 元/年，SSL 证书免费

### 需要用户做的
1. 购买一个域名（推荐腾讯云/阿里云，约 60 元/年）
2. 将域名 DNS A 记录指向 `81.70.59.228`
3. 告诉我域名，我配置 Nginx + Let's Encrypt

### 我负责的配置
- Nginx 反向代理 80/443 → 3000
- Let's Encrypt 自动续期 SSL 证书
- WebSocket upgrade 支持
- Gzip 压缩和缓存策略

---

## 方案三：Cloudflare Tunnel（零配置公网访问）

### 架构
```
用户浏览器 ──HTTPS──► Cloudflare CDN ──Tunnel──► 服务器 (localhost)
```

### 优势
- 不需要公网 IP（但我们已有）
- 不需要开放端口（但我们已开放）
- 自带 DDoS 防护和 CDN
- 支持 WebSocket
- 免费

### 劣势
- 国内访问速度可能不稳定
- 需要安装 cloudflared 守护进程

---

## 方案对比

| 维度 | Netlify 方案 | 域名+Nginx（推荐） | Cloudflare Tunnel |
|------|-------------|-------------------|------------------|
| HTTPS | 免费 | Let's Encrypt 免费 | 免费 |
| WebSocket | 不支持/降级轮询 | 完美支持 | 支持 |
| 国内速度 | 一般 | 快（直连服务器） | 不稳定 |
| 自动部署 | GitHub 触发 | 需手动/脚本 | 需手动 |
| 知乎回调 | 可用 | 完美 | 可用 |
| 年度成本 | 0 元 | ~70 元域名 | 0 元 |
| 维护复杂度 | 中 | 低 | 中 |

---

## 我的建议

**首选：购买域名 + Nginx + Let's Encrypt**

原因：
1. 我们的核心功能是"双人对白"，WebSocket 实时性不可妥协
2. 知乎开放平台 API 需要 HTTPS 回调，域名方案最稳妥
3. 国内用户访问体验最好（直连腾讯云服务器）
4. 后续如果要接入微信支付、微信登录等，都必须备案域名

**如果预算紧张**：
- 先用 IP 访问（当前状态）
- 或尝试 Cloudflare Tunnel（我可以在 10 分钟内配好）

**Netlify 方案**：
- 可以作为纯前端展示/营销页的部署方式
- 不适合包含实时对白核心功能的主应用

---

## 下一步

请告诉我你的倾向：

1. **买域名**（推荐）→ 我去腾讯云/阿里云挑一个便宜的 `.com`/`.cn`，你付款，我来配 Nginx + SSL
2. **Cloudflare Tunnel** → 我现在就装 cloudflared，给你生成一个 `xxx.trycloudflare.com` 临时域名（免费）
3. **Netlify 试水** → 我配置 `netlify.toml`，你注册账号并授权 GitHub，我们看看效果
