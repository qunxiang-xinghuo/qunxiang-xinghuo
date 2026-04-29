# 🔥 群像·星火 (Qunxiang Xinghuo)

> 基于真实职业经验的多人协同创作平台。让不同职业背景的普通人，被同时扔进同一个冲突情境，用各自的职业本能碰撞出火花，共同完成一部一个人永远写不出的故事。

[![Tests](https://img.shields.io/badge/tests-217%20passed-brightgreen)](./docs/qunxiangxinhuo-TDD-v4.0.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## ✨ 核心功能

### 🎭 三种创作模式

| 模式 | 玩法 | 适合场景 |
|------|------|---------|
| **单人模式** | 选择身份 → 浏览脑洞卡片（左滑跳过/右滑收藏）→ AI 催化引导 → 语音/文字反应 → 存入素材库 | 日常灵感积累、碎片化创作 |
| **双人模式** | 选择身份 → 匹配等待（60秒）→ 实时对白室 → 手动标记"火花" → 火花墙回顾 → AI 串联故事 | 即兴碰撞、快速产出对白片段 |
| **多人模式** | 故事广场选本 → 认领角色 → 导演控场（暂停/投票/杀青）→ 灵感库归档 → 共创者署名墙 | 完整剧本创作、团队协作 |
| **知乎圈子** | Agent 自主浏览/发帖/评论/点赞 → 与其他 Agent 碰撞灵感 → 跨平台内容同步 | 智能体社交、内容分发 |

### 🤖 AI 双引擎

- **AI 催化提示** (`prompt-generator.ts`)：根据脑洞内容和用户身份，生成针对性的引导问题。接入 DeepSeek API，失败时自动降级到本地分类题库。
- **AI 故事串联** (`story-weaver.ts`)：将用户标记的"火花"（精彩对白片段）串联成完整的故事，支持剧本/叙事/对白三种格式。
- **知乎圈子接入** (`zhihu-api.ts`)：HMAC-SHA256 签名鉴权，支持 Agent 在知乎圈子自主发帖、评论、点赞，跨平台互动。

### ⚡ 实时协作

- Socket.io 实时消息广播
- 房间状态同步（在线/离开/火花标记）
- 导演控场（暂停、恢复、发起投票、喊杀青）

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20
- npm ≥ 10
- Git

### 安装与启动

```bash
# 1. 克隆仓库
git clone https://github.com/qunxiang-xinghuo/qunxiang-xinghuo.git
cd qunxiang-xinghuo

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入：
# - DEEPSEEK_API_KEY=sk-...
# - NEXTAUTH_SECRET=随机字符串
# - NEXTAUTH_URL=http://localhost:3000

# 4. 初始化数据库
npx prisma db push
npx prisma db seed

# 5. 启动开发服务器（同时启动 Next.js + Socket.io）
npm run dev

# 访问 http://localhost:3000
```

### 运行测试

```bash
# 运行全部测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 当前状态：217 tests passed，23 个测试文件
```

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router + React 19 + Tailwind CSS v4         │
│  Framer Motion + react-swipeable + lucide-react             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  API Routes (/app/api/*) + Zod 校验 + NextAuth.js           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  match-engine.ts │ room-manager.ts │ socket-handler.ts       │
│  story-weaver.ts │ prompt-generator.ts                       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  Prisma 7.8.0 + SQLite (better-sqlite3)                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  DeepSeek API + Socket.io 4.8.3                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js + React | 16.2.4 / 19.2.4 |
| 样式 | Tailwind CSS v4 | - |
| 数据库 | Prisma + SQLite | 7.8.0 |
| 认证 | NextAuth.js | 4.24.14 |
| 实时通信 | Socket.io | 4.8.3 |
| AI | DeepSeek API | v1 |
| 测试 | Vitest + RTL + jsdom | 4.1.5 |

---

## 📁 项目结构

```
src/
├── app/              # Next.js App Router（页面 + API）
│   ├── api/          # 22 个 API 路由，全部已测试
│   ├── (auth)/       # 登录/注册
│   └── ...           # 13+ 个业务页面
├── components/       # React 组件（8 个业务模块）
├── hooks/            # 前端 Hooks（6 个，3 个已测试）
├── lib/              # 工具 + AI 模块 + 校验器
│   └── ai/           # story-weaver + prompt-generator
├── server/           # 匹配引擎 + 房间管理 + WebSocket
└── test/             # 216 个测试用例
```

---

## 🧪 TDD 测试覆盖

- **216 tests passed**，23 个测试文件
- 覆盖全部 22 个 API 路由
- 覆盖 WebSocket 实时通信
- 覆盖前端 Hooks（useBrainhole/useReaction/useCollection）
- 覆盖 UI 组件（MessageBubble/BottomNav/TopBar）
- 三级降级策略：DeepSeek → fallback-prompts → 通用提示

详见 [TDD v4.0 文档](./docs/qunxiangxinhuo-TDD-v4.0.md)

---

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t qunxiang-xinghuo .

# 运行容器
docker run -p 3000:3000 --env-file .env qunxiang-xinghuo
```

---

## 📝 开发日志

| 日期 | 里程碑 |
|------|--------|
| 2026-04 | Phase 1：匹配引擎 + 9 个测试 |
| 2026-04 | Phase 2：房间管理 API + 16 个测试 |
| 2026-04 | Phase 3：WebSocket + AI 故事串联 + 21 个测试 |
| 2026-04-29 | Phase 4：补齐 TDD 覆盖（216 tests）+ AI 催化实现 |

---

## 📄 文档

- [TDD v4.0 技术设计文档](./docs/qunxiangxinhuo-TDD-v4.0.md)
- [部署说明](./docs/deploy-zh.md)
- [开发日志](./docs/dev_log.md)

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📜 License

MIT License © 2026 群像·星火团队
