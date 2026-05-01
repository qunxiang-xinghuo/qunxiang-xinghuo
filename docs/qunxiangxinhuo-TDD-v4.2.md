# 群像·星火 TDD v4.2 — 注册/登录系统 + 首页改造 + 超时独立页面

## 一、版本信息
- **版本**: v4.2
- **日期**: 2026-05-01
- **Git**: `edde7bb` dev分支
- **服务器**: http://81.70.59.228/
- **PM2**: pid 1150997, status online

## 二、本次改动总览

| 模块 | 改动内容 | 状态 |
|------|---------|------|
| 注册/登录 | 完整用户名/密码系统，bcrypt加密 | ✅ |
| 首页 | 泡泡区域320px增大，模式卡片扁平化 | ✅ |
| 身份选择页 | 标题"在这次对撞中，你是谁？"，卡片式布局 | ✅ |
| 匹配等待页 | 60秒倒计时，超时跳转独立页面 | ✅ |
| 超时选择页 | 新建/duo-timeout，取消弹窗 | ✅ |
| 泡泡云 | 模板18/25个，泡泡数量增加 | ✅ |

## 三、注册/登录系统

### 3.1 数据库模型 (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  username      String?   @unique    // NEW v4.2
  password      String?               // NEW v4.2 (bcrypt hashed)
  level         Int       @default(1)
  sparkCount    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 3.2 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/auth/register` | POST | 注册：校验用户名唯一 → bcrypt加密 → 创建User |
| `/api/auth/[...nextauth]` | GET/POST | 登录：CredentialsProvider验证username+password |

### 3.3 登录页 `/login`
- 顶部"群像·星火"标题
- 用户名、密码输入框
- 密码显示/隐藏切换
- 登录按钮 → `signIn('credentials')` → 成功跳转 `/`
- 底部"没有账号？去注册" → 跳转 `/register`
- URL参数 `?registered=1` 显示绿色"注册成功，请登录"提示

### 3.4 注册页 `/register`
- 用户名、密码、确认密码三个输入框
- 前端校验：用户名≥2字符，密码≥6位，两次密码一致
- 注册按钮 → `/api/auth/register`
- 用户名已存在 → 显示"用户名已被注册"
- 注册成功 → 自动跳转 `/login?registered=1`

### 3.5 认证流程
```
未登录用户 → /login → 点击"去注册" → /register
                ↓ 已有账号
            输入用户名密码
                ↓ 点击登录
           signIn('credentials')
                ↓ 校验成功
            JWT Session → 跳转 /
```

### 3.6 安全要求
- ✅ 密码bcrypt加密存储（salt rounds: 10）
- ✅ 用户名唯一约束（@unique）
- ✅ 注册前检查用户名是否已存在
- ✅ 登录时bcrypt.compare验证密码

## 四、首页改造 `/`

### 4.1 泡泡区域
- 高度从 240px → **320px**，面积增大33%
- BubbleCloud `compact` 模式
- 模板位置从12个 → **18个**
- 请求limit从15 → **22个**
- 最大显示泡泡从12 → **18个**
- 泡泡尺寸微调：base 26-40px

### 4.2 模式卡片
- 间距从 gap-3 → **gap-2**
- padding从 p-4 → **p-3**
- 图标容器从 w-14 h-14 → **w-10 h-10**
- 图标从 w-7 h-7 → **w-5 h-5**
- 整体更扁平紧凑

## 五、身份选择页 `/duo-match`

### 5.1 页面结构
- 顶部 TopBar 标题"身份选择"
- 页面标题："在这次对撞中，你是谁？"
- 三个选项卡片式布局：知乎身份 / AI随机生成 / 自定义角色
- 底部"确认身份，开始匹配"按钮

### 5.2 登录检查
- 进入页面自动检查 `/api/auth/session`
- 未登录 → alert提示 → 跳转 `/login`
- 已登录 → 显示身份选择

### 5.3 身份选项
| 选项 | 说明 |
|------|------|
| 知乎身份 | 读取 `/api/users/identities`，展示已认证身份 |
| AI随机生成 | 从20个预设角色中随机抽取，可"换一个" |
| 自定义角色 | 输入框，最大20字符，实时计数 |

## 六、匹配等待页 `/duo-waiting`

### 6.1 核心功能
- 刘看山动画形象（浮动）
- "刘看山正在为你寻找对撞人…"
- **60秒精确倒计时**，大字体数字 + 进度条
- 每2秒轮询 `/api/match/:matchId`
- 匹配成功 → 自动跳转 `/room/:id`

### 6.2 超时处理（v4.2重要改动）
- 60秒结束后 **不再显示弹窗**
- 直接跳转 `/duo-timeout?matchId=xxx&round=1`

## 七、超时选择页 `/duo-timeout`（新建）

### 7.1 页面内容
- 刘看山形象
- 提示文案："当前暂无真人，是否与刘看山一起探讨？"
- 轮次提示："第1次匹配尝试" / "第2次匹配尝试（最后一次）"

### 7.2 按钮
| 按钮 | 第1轮 | 第2轮 |
|------|-------|-------|
| 是 | 进入刘看山AI对话 | 进入刘看山AI对话 |
| 否 | 继续等待（跳转waiting） | 返回首页 |

### 7.3 流程
```
waiting(60s) → timeout(round=1)
                   ├── 是 → AI房间 /room/:id
                   └── 否 → waiting(60s) → timeout(round=2)
                                          ├── 是 → AI房间
                                          └── 否 → 首页 /
```

## 八、已知问题与记录

### 8.1 已修复的问题
| 问题 | 原因 | 修复方式 |
|------|------|---------|
| 登录页build失败 | useSearchParams无Suspense | 拆分为page.tsx(Suspense)+LoginForm.tsx |
| 路由冲突 | 存在(auth)/login和/login | 删除旧的(auth)/login和(auth)/register |

### 8.2 仍需注意
- 知乎API 405 Method Not Allowed（历史问题，未修复）
- 服务器git pull经常超时，使用SFTP部署更可靠
- Next.js 16 useSearchParams必须用Suspense包裹

## 九、部署记录

### 9.1 部署步骤
1. `npx prisma db push --accept-data-loss` — 同步User表新增字段
2. `npx prisma generate` — 生成Prisma Client
3. `npm run build` — 42页编译成功
4. `cp -r .next/static .next/standalone/.next/` — 复制静态资源
5. `pm2 restart qunxiang-xinghuo` — 重启服务

### 9.2 自检清单
- [x] 首页 `/` — 泡泡墙加载正常，模式卡片显示正常
- [x] 登录页 `/login` — 表单渲染，注册入口可点击
- [x] 注册页 `/register` — 表单渲染，返回登录可点击
- [x] 注册API `/api/auth/register` — POST可访问
- [x] 身份选择 `/duo-match` — 未登录跳转登录，三选项显示
- [x] 匹配等待 `/duo-waiting` — 倒计时正常
- [x] 超时选择 `/duo-timeout` — 页面渲染正常
- [x] PM2 online — pid 1150997

## 十、文件变更记录

```
M  prisma/schema.prisma          # User添加username+password
M  src/lib/auth.ts               # CredentialsProvider支持username
A  src/app/api/auth/register/route.ts  # 注册API
A  src/app/login/page.tsx        # Suspense包裹
A  src/app/login/LoginForm.tsx   # 登录表单
A  src/app/register/page.tsx     # 注册页面
M  src/app/page.tsx              # 首页泡泡区域增大+卡片扁平
M  src/app/duo-match/page.tsx    # 身份选择页重写
M  src/app/duo-waiting/page.tsx  # 超时跳转独立页面
A  src/app/duo-timeout/page.tsx  # 新建超时选择页
M  src/components/bubble-cloud/BubbleCloud.tsx  # 18/25模板
D  src/app/(auth)/login/page.tsx # 删除旧路由
D  src/app/(auth)/register/page.tsx # 删除旧路由
```
