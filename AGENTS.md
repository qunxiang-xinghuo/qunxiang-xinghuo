# 群像·星火 — 创作工坊

## 项目概览
群像·星火是一个角色扮演创作平台网站。核心价值是给两个或多个人一个"舞台"，让不敢说出口的话在角色扮演中被说出来，然后变成故事。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Font**: Noto Serif SC (标题) + Noto Sans SC (正文)

## 目录结构
```
src/
├── app/
│   ├── layout.tsx          # 全局布局（Header + Footer）
│   ├── page.tsx            # 首页（剧场感门面 + 精选故事）
│   ├── globals.css         # 全局样式 + 品牌色 + 动画
│   ├── scenes/
│   │   ├── page.tsx        # 场景库列表
│   │   └── [id]/page.tsx   # 场景详情（票根式卡片）
│   ├── stories/
│   │   ├── page.tsx        # 故事集/心理剧记录
│   │   └── [id]/page.tsx   # 故事详情（沉浸式阅读）
│   └── seeds/
│       └── page.tsx        # 故事种子（未开发灵感）
├── components/
│   ├── site-header.tsx     # 顶部导航
│   ├── site-footer.tsx     # 底部信息
│   ├── featured-story.tsx  # 首页精选故事预览
│   ├── scene-detail.tsx    # 场景详情组件（角色切换）
│   └── story-reader.tsx    # 沉浸式故事阅读器
└── lib/
    ├── data.ts             # 数据层（场景、故事、种子）
    └── utils.ts            # 工具函数
```

## 设计规范
- **配色**: 深蓝剧场底色 (#0d1b2a) + 金色点缀 (#c8a848) + 白色内容卡片
- **风格**: 剧场感、电影感、沉浸式阅读
- **动画**: 渐进式淡入、对话逐条出现、票根式入场
- **详见**: DESIGN.md

## 开发命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm ts-check` - TypeScript 类型检查
- `pnpm lint` - ESLint 检查
