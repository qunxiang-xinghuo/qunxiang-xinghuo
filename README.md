# 🔥 群像·星火 (Qunxiang Xinghuo)

> 让真实发光，让思想变现。把不同背景的普通人扔进同一个冲突情境，用各自的直觉与经验碰撞出火花，共同完成一部一个人永远写不出的故事。

[![Build](https://img.shields.io/badge/build-57%20pages-brightgreen)](./docs/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101)](https://socket.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## ✨ 核心功能

### 🎭 四种创作模式

| 模式 | 玩法 | 适合场景 |
|------|------|---------|
| **与刘开山对话** | 选择身份 → 与刘看山 AI 一对一即兴对话 → 标记火花 | 随时随地，低门槛热身 |
| **双人对白** | 选身份 → 四级智能匹配（同话题→同类→热门→扩大）→ 实时对白室 → 火花标记 | 即兴碰撞、快速产出对白片段 |
| **多人模式** | 故事广场选本 → 认领角色 → 多人共创 | 完整剧本创作（开发中） |
| **长期连载** | 持续更新的连载故事，多话累积 | 长篇共创（开发中） |

### 🦊 刘看山 AI — 全局 Agent 系统

- **12 个专属角色**（`personas.ts`）：陪伴员、催化师、侦探等，按场景切换
- **双 API 引擎**：DeepSeek Chat（优先）+ 知乎直答（fallback），15s 超时自动切换
- **动态 AI 催化**：`POST /api/ai/catalyst`，每 30 秒基于对话上下文刷新引导问题
- **本地 fallback**：双 API 均失败时，按角色返回预设兜底回复

### ⚡ 四级智能匹配引擎

```
[阶段1] 同 brainhole 精确匹配（0–3 秒）
[阶段2] 同分类兴趣匹配（3–6 秒）
[阶段3] 热门参与话题匹配（6–10 秒）
[阶段4] 扩大搜索 + 等待（10–15 秒）
         → 超时后一键切换刘看山 AI 对话
```

匹配引擎内置**并发竞态修复**（创建 waiting 请求后立即执行"二次匹配"查找）。

### 🔥 火花系统

- 对白中点击「火花」标记精彩片段
- 对白结束自动保存为个人 Asset（默认私密）
- 支持公开/私密切换，公开后进入**公共火花墙**
- 火花按 `hotScore` 热度排序，支持点赞互动



---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20
- npm ≥ 10

### 安装与启动

```bash
# 1. 克隆仓库
git clone <repo-url>
cd qunxiang-xinghuo

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 填入：DEEPSEEK_API_KEY / NEXTAUTH_SECRET / NEXTAUTH_URL

# 4. 初始化数据库
npx prisma db push
npx prisma db seed

# 5. 启动开发服务器（Next.js + Socket.io 一体）
npm run dev
# 访问 http://localhost:3000
```

### 生产部署

```bash
npm run build          # standalone 模式，57 页编译
cp -r .next/static .next/standalone/.next/
pm2 start server.ts --name qunxiang-xinghuo
```

支持 **Webhook 自动部署**：Forgejo push → Nginx /webhook → deploy.sh → git pull → build → PM2 restart。

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16.2.4 App Router + React 19 + Tailwind CSS v4     │
│  Framer Motion 12.38 + Zod 4.3.6 + lucide-react            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  API Routes (/app/api/*) — 58+ 路由                         │
│  NextAuth.js 4.24.14 (JWT CredentialsProvider)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  match-engine.ts │ room-manager.ts │ socket-handler.ts       │
│  personas.ts (11角色) │ fallback-replies.ts                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Prisma 7.8.0 + SQLite (better-sqlite3 12.9.0)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  DeepSeek API (deepseek-chat) + 知乎直答 (zhida-thinking)    │
│  Socket.io 4.8.3 (实时对白)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 核心技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js + React | 16.2.4 / 19.2.4 |
| 样式 | Tailwind CSS | v4 |
| 数据库 | Prisma + SQLite | 7.8.0 |
| 认证 | NextAuth.js (JWT) | 4.24.14 |
| 实时通信 | Socket.io | 4.8.3 |
| AI | DeepSeek + 知乎直答 | — |
| 动画 | Framer Motion | 12.38.0 |
| 校验 | Zod | 4.3.6 |
| 测试 | Vitest | 4.1.5 |

---

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # 58+ API 路由
│   │   ├── auth/           # 注册/登录
│   │   ├── match/          # 四级匹配引擎
│   │   ├── rooms/          # 房间管理（双人/AI/观看）
│   │   ├── brainholes/     # 脑洞内容管理
│   │   ├── sparks/         # 火花系统
│   │   ├── ai/             # catalyst / chat
│   │   ├── assets/         # 对白资产
│   │   ├── stories/        # 故事系统
│   │   └── healing/        # 个人疗愈（AES-256-GCM 加密）
│   ├── (页面路由)
│   │   ├── /               # 登录页（首屏）
│   │   ├── /home           # 发现页（TOP3 + 模式入口）
│   │   ├── /duo-match      # 双人身份选择
│   │   ├── /duo-waiting    # 匹配等待（四级可视化）
│   │   ├── /solo-match     # 人机模式入口
│   │   ├── /room/[id]      # 极简对白室
│   │   ├── /library        # 火花页
│   │   ├── /story-hall     # 故事大厅
│   │   ├── /spectate       # 观看模式
│   │   ├── /profile        # 我的页面
│   │   ├── /healing        # 个人疗愈
│   │   └── /settings       # 设置
├── components/             # React 组件
│   ├── bubble-cloud/       # 泡泡云（脑洞可视化）
│   └── layout/             # AppShell / BottomNav / TopBar
├── hooks/                  # 前端 Hooks（useBrainhole / useAuth 等）
├── lib/
│   └── ai/                 # personas.ts / fallback-replies.ts
└── server/                 # match-engine / room-manager / socket-handler
```

---



## 🎨 设计系统

**配色语义分层（v9.0）：**

| 用途 | 色值 | 说明 |
|------|------|------|
| 页面背景 | `#0a1628` | 深蓝黑 |
| 卡片/表面 | `#131b2e` | 深蓝灰 |
| CTA 按钮 | `#3B82F6` | PPT 蓝 |
| 火花/点赞/热度 | `#D4B830` | 标准黄 |
| 主强调 | `#8a9ab0` | 柔和蓝灰（替代暖橙金） |
| 主文字 | `#e2e8f0` | 偏冷白 |

---

---

## 📝 版本演进

| 版本 | 日期 | 里程碑 |
|------|------|--------|
| v4.x | 2026-04-29 | 注册/登录系统 + TDD 覆盖（217 tests）+ AI 催化 |
| v5.0 | 2026-05-02 | 四级智能匹配 + 泡泡社交信号 + 匹配可视化 |
| v6.0 | 2026-05-03 | 全面重构：发现页 + 极简对白室 + 双 API + 火花墙 |
| v6.2 | 2026-05-04 | 邀请好友 + 个人疗愈 + 观看模式 |
| v6.2-fix4 | 2026-05-05 | SSR 登录页彻底修复（framer-motion opacity:0 根治） |
| v7.0 | 2026-05-05 | 火花墙重构 + Webhook 自动部署 + 消息去重 |
| v9.0 | 2026-04-29 | 配色系统重设计 + 11 角色 AI + 代码质量全面加固 |

完整变更日志见 [`docs/`](./docs/) 目录。

---

## 📜 License

MIT License © 2026 群像·星火团队