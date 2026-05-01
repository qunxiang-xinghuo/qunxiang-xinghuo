# 群像·星火 TDD v4.2 — 注册/登录系统 + 首页登录页 + 发现页

## 一、版本信息
- **版本**: v4.2
- **日期**: 2026-05-01
- **Git**: `b1373db` dev分支
- **服务器**: http://81.70.59.228/
- **PM2**: pid 1158355, status online

## 二、路由结构（v4.2-fix重要变更）

| 路由 | 功能 | 说明 |
|------|------|------|
| `/` | **登录页（首页）** | 用户打开网站第一屏 |
| `/home` | **发现页** | 泡泡墙 + 模式卡片 |
| `/register` | 注册页 | 用户名/密码/确认密码 |
| `/duo-match` | 身份选择页 | "在这次对撞中，你是谁？" |
| `/duo-waiting` | 匹配等待页 | 10秒倒计时 |
| `/duo-timeout` | 超时选择页 | 刘看山AI/继续等待 |

## 三、页面流程

```
访问网站 / → 登录页
                ├── 已有账号 → 输入用户名密码 → 点击登录 → /home 发现页
                └── 没有账号 → 点击"去注册" → /register
                                        → 填写信息 → 确认注册
                                        → 自动跳回 /?username=xxx&password=yyy
                                        → 用户名密码已自动填入
                                        → 点击登录 → /home 发现页
```

## 四、登录页 `/`（首页）

### 4.1 视觉
- 深色背景 `#1a1a2e`
- 顶部大字标题："群像·星火"（text-3xl font-bold）
- 装饰泡泡背景（模糊光斑）

### 4.2 表单
- 用户名输入框
- 密码输入框（带显示/隐藏切换）
- 登录按钮（暖金色渐变）
- 底部"没有账号？去注册"

### 4.3 自动回填
- 注册成功后跳转 `/?username=xxx&password=yyy`
- `useEffect` 读取 searchParams 自动填入输入框
- 用户只需点击登录按钮即可进入

### 4.4 登录成功
- `signIn('credentials')` → JWT Session
- 跳转 `/home`（发现页）
- `router.refresh()` 刷新认证状态

## 五、注册页 `/register`

### 5.1 表单
- 用户名（2-30字符）
- 密码（至少6位，显示/隐藏切换）
- 确认密码
- 确认注册按钮

### 5.2 前端校验
- 用户名必填且≥2字符
- 密码必填且≥6位
- 两次密码必须一致

### 5.3 后端流程
- `/api/auth/register` POST
- 检查用户名是否已存在 → 409 "用户名已被注册"
- bcrypt.hash(password, 10) 加密
- 创建 User 记录
- 成功返回 200

### 5.4 注册成功
- 跳转 `/?username=xxx&password=yyy`
- 登录页自动填入，用户一键登录

## 六、发现页 `/home`

### 6.1 内容
- 顶部标题"群像·星火"
- 泡泡墙区域：320px高度，18个泡泡
- 模式卡片：双人/多人/连载（扁平化）

### 6.2 导航
- 底部导航"发现"指向 `/home`
- 登录页和注册页**不显示**底部导航

## 七、数据库模型

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  username      String?   @unique    // v4.2新增
  password      String?               // v4.2新增 (bcrypt)
  level         Int       @default(1)
  sparkCount    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## 八、认证系统

### 8.1 NextAuth CredentialsProvider
- credentials: `username` + `password`
- authorize: `findFirst` 查 username 或 email → `bcrypt.compare` → 返回 user
- JWT strategy，session 包含 id/level/sparkCount/username

### 8.2 安全
- ✅ bcrypt 加密存储（salt rounds: 10）
- ✅ 用户名唯一约束
- ✅ 注册前查重
- ✅ 登录时密码校验

## 九、页面跳转映射

| 原跳转 | 新跳转 | 文件 |
|--------|--------|------|
| `/` (首页) | `/home` (发现页) | page.tsx → home/page.tsx |
| `/login` | `/` (登录页) | 删除/login目录 |
| 登录成功 → `/` | 登录成功 → `/home` | LoginForm.tsx |
| 注册成功 → `/login?registered=1` | 注册成功 → `/?username=xxx&password=yyy` | register/page.tsx |
| 未登录 → `/login` | 未登录 → `/` | duo-match, room |
| 退出 → `/` | 退出 → `/` | profile/page.tsx（正确） |
| 返回首页 → `/` | 返回首页 → `/home` | feedback, room, roadshow |
| 超时退出 → `/` | 超时退出 → `/home` | duo-timeout/page.tsx |

## 十、已知问题记录

### 10.1 本次修复
| 问题 | 原因 | 修复 |
|------|------|------|
| build类型缓存错误 | 删除/login后.next缓存引用旧文件 | `rm -rf .next` 后重新build |
| 路由冲突 | (auth)/login 和 /login 并存 | 删除(auth)目录和/login目录 |
| useSearchParams无Suspense | Next.js 16 CSR bailout | 拆分为page.tsx + LoginForm.tsx |

### 10.2 历史记录
- 知乎API 405 Method Not Allowed（未修复）
- Prisma `findUnique` vs `findFirst` 唯一字段约束（已修复）
- Google Fonts大陆build失败 → 改用系统字体（已修复）

## 十一、部署记录

### 11.1 部署步骤
1. 上传所有文件（含新/home/page.tsx和LoginForm.tsx）
2. 删除服务器旧 `src/app/login` 目录
3. 删除 `.next` 缓存（避免类型引用错误）
4. `npx prisma db push --accept-data-loss`
5. `npx prisma generate`
6. `npm run build` — 42页编译成功
7. `cp -r .next/static .next/standalone/.next/`
8. `pm2 restart qunxiang-xinghuo`

### 11.2 自检结果
- [x] `/` 登录页 — HTTP 200
- [x] `/home` 发现页 — HTTP 200
- [x] `/register` 注册页 — HTTP 200
- [x] `/duo-match` 身份选择 — HTTP 200（无二次登录）
- [x] `/duo-waiting` 匹配等待 — HTTP 200（10秒倒计时）
- [x] `/duo-timeout` 超时选择 — HTTP 200
- [x] 本地Build — 42页通过
- [x] 服务器Build — 42页通过
- [x] PM2 online — pid 1158355

## 十二、文件变更

```
A  src/app/home/page.tsx            # 新建发现页
A  src/app/LoginForm.tsx            # 根登录表单（自动回填）
M  src/app/page.tsx                 # 改成Suspense包装LoginForm
M  src/app/register/page.tsx        # 成功后跳转/?username=&password=
M  src/app/duo-match/page.tsx       # 未登录跳转/
M  src/app/duo-timeout/page.tsx     # 退出跳转/home
M  src/app/feedback/page.tsx        # 返回首页跳转/home
M  src/app/roadshow/page.tsx        # 链接指向/home
M  src/app/room/[id]/page.tsx       # 未登录跳转/，返回跳转/home
M  src/components/layout/BottomNav.tsx  # 发现指向/home，登录/注册隐藏
D  src/app/login/page.tsx           # 删除
D  src/app/login/LoginForm.tsx      # 重命名为src/app/LoginForm.tsx
```
