# 🔐 群像·星火 重要信息记录

> 原则：每次100% context前，关键信息必须记录在此。犯过的问题不再犯。
> ⚠️ **服务器密码和API密钥已脱敏**，本地查看请询问管理员。

---

## 一、服务器信息

| 项目 | 值 |
|------|-----|
| IP | `81.70.59.228` |
| 系统 | 腾讯云 OpenCloudOS 9.4 |
| 用户 | `root` |
| 密码 | *已脱敏，询问管理员* |
| SSH端口 | `22` |
| 部署路径 | `/www/wwwroot/qunxiang-xinghuo` |
| PM2进程名 | `qunxiang-xinghuo` |
| 面板 | 宝塔面板（路径特征 `/www/wwwroot`） |

## 二、部署命令（一键复制）

```bash
cd /www/wwwroot/qunxiang-xinghuo \
  && git fetch origin dev \
  && git reset --hard origin/dev \
  && git clean -fd \
  && npm install \
  && npx prisma generate \
  && npx prisma db push \
  && NODE_ENV=production npm run build \
  && pm2 restart qunxiang-xinghuo \
  && pm2 save
```

> 含 Prisma schema 变更时必须执行 `npx prisma db push`！

**本地paramiko部署脚本**：`deploy_remote.py`（Python + paramiko，密码认证）

```bash
# 方式1：设置环境变量
set DEPLOY_PASSWORD=你的密码
python deploy_remote.py

# 方式2：运行时输入（隐藏回显）
python deploy_remote.py
```

## 三、Git仓库

| 项目 | 值 |
|------|-----|
| **主远程（GitHub）** | `github.com:qunxiang-xinghuo/qunxiang-xinghuo` → `origin` |
| **副远程（自建）** | `fqunxiang.x404.online:2222/qunxiang/qunxiang-xinghuo` → `fqunxiang` |
| 当前分支 | `dev` |
| 本地路径 | `C:\Users\Dell\qunxiang-xinghuo` |

### 双远程同步流程（铁律）
每次推送到 GitHub 时必须同时推送到 `fqunxiang`：
```bash
# 方式1：依次推送
git push origin dev && git push fqunxiang dev

# 方式2：一次性推送到所有远程（需Git 2.30+）
git push --all origin && git push --all fqunxiang
```

**若两远程分叉**：
1. `git fetch fqunxiang dev`
2. `git merge fqunxiang/dev`（解决冲突）
3. `git push origin dev && git push fqunxiang dev`

## 四、环境变量（服务器 `.env`）

```
DEEPSEEK_API_KEY="*已脱敏，服务器.env中配置*"
ZHIHU_API_KEY="*已脱敏，服务器.env中配置*"
DATABASE_URL="file:./dev.db"
```

> API密钥只在服务器 `.env` 中配置，本地开发请自行申请或使用测试key。

## 五、已知部署问题与解决方案

### 问题1：服务器GitHub HTTPS连接超时
- **现象**：`git pull origin dev` 卡住135秒失败
- **根因**：服务器工作目录有大量未提交的本地修改（`M`/`??`标记），导致merge困难
- **解决**：`git reset --hard origin/dev && git clean -fd` 强制同步（放弃服务器本地修改）
- **教训**：服务器代码永远以GitHub的`dev`分支为唯一真理源

### 问题2：Windows控制台Unicode编码错误
- **现象**：`UnicodeEncodeError: 'gbk' codec can't encode character '\u2713'`
- **根因**：Windows PowerShell默认GBK编码，npm输出的✓字符无法显示
- **解决**：Python脚本中 `sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')`
- **教训**：跨平台部署脚本必须处理编码问题

### 问题3：SSH密钥认证失败 → 回退密码认证
- **现象**：`id_ed25519` 公钥被服务器拒绝，paramiko报错 `AuthenticationException`
- **根因**：服务器上 `~/.ssh/authorized_keys` 可能未包含本地公钥，或sshd配置变更
- **解决**：`deploy_remote.py` 使用密码认证通过paramiko.connect()
- **教训**：密钥和密码双备份，脚本优先尝试密钥、fallback到密码

### 问题4：SSH连接超时（2026-05-03间歇性）
- **现象**：ping正常(20ms)，端口22通，但SSH握手卡住30~300秒超时
- **根因**：服务器SSH服务间歇性无响应（可能是连接数打满或sshd进程异常）
- **解决**：等待数分钟后重试；或通过宝塔面板Web终端执行命令
- **教训**：SSH不是100%可靠，必须保留宝塔面板作为备用通道

### 问题5：页面空白（v5.3最严重bug，v5.5复发）
- **现象**：部署后访问线上页面显示空白/只有loading spinner
- **根因1（直接原因）**：App Router + 自定义server.ts组合下，Next.js `handle()` 无法正确serve生产build的静态资源（`/_next/static/chunks/*`），所有JS/CSS返回404
- **根因2（深层原因）**：`output: 'standalone'` 模式下，standalone/server.js也未自动包含static文件；`server.ts` + `tsx` 在生产模式下静态文件服务失效
- **根因3（路径错误-v5.5复发）**：server.ts中 `path.join(cwd, '.next', req.url)` 导致路径为 `.next/_next/static/...`（多了一个`_next`层级），指向不存在的目录
- **根因4（表象误导）**：BubbleCloud等客户端组件在SSR时显示loading spinner，客户端JS无法加载导致永远卡住，看起来像"空白"
- **解决**：修改 `server.ts`，显式添加 `/_next/` 静态文件路由，使用 `req.url.replace('/_next/', '')` 正确拼接路径
- **教训**：
  - App Router + 自定义server需显式处理 `_next/static` 路由
  - **部署后第一件事（铁律）**：curl验证 `_next/static/chunks/*.js` 是否200
  - **关键修复代码不要轻易改动**——server.ts静态资源处理是生死线
  - 永远不要假设Next.js会自动处理好所有静态资源
  - **验证命令**：`JS=$(ls .next/static/chunks/*.js | head -1 | sed 's|.*/chunks/||') && curl -sI http://localhost:3000/_next/static/chunks/$JS`

## 六、技术栈版本锁定

| 技术 | 版本 |
|------|------|
| Next.js | 16.2.4 (Turbopack) |
| TypeScript | ~5.7 |
| Tailwind CSS | v4 |
| Prisma | 7.8.0 |
| next-auth | 4.24.14 |
| Socket.IO | ~4.x |

## 七、刘看山官方形象（已验证）

- **URL**：`https://pic1.zhimg.com/da8e974dc.jpg`
- **尺寸**：640x640
- **类型**：知乎官方卡通北极狐
- **文件**：`src/components/layout/LiuKanshanAvatar.tsx`
- **回退**：`onError` → CSS简笔画

## 八、TDD文档位置（用户常找不到）

| 文档 | 实际路径 | 说明 |
|------|---------|------|
| **TDD v6.0** | `docs/qunxiangxinhuo-TDD-v6.0.md` | v6.0全面重构需求文档（当前版本） |
| TDD v5.0 | `docs/qunxiangxinhuo-TDD-v5.0.md` | 泡泡脑洞+四级匹配（历史版本） |
| TDD v4.5 | `TDD-v4.5-泡泡脑洞系统.md` | 泡泡系统技术细节 |
| TDD v1.0~v4.3 | `docs/qunxiangxinhuo-TDD-v*.md` | 历史版本 |

> 用户找不到TDD？它在 `docs/` 子目录里，不在根目录。

## 九、刘看山形象资源

| 资源 | 路径 | 用途 |
|------|------|------|
| 官方图片 | `public/liukanshan.jpg` | 所有页面共用 |
| 组件 | `src/components/layout/LiuKanshanAvatar.tsx` | 等待页/超时页/故事页 |
| 浮动按钮 | `src/components/layout/LiuKanshanFloat.tsx` | 首页右下角浮动（当前未引用） |
| 欢迎弹窗 | `src/components/layout/LiuKanshanWelcome.tsx` | 首页新用户引导（当前未引用） |

## 十、关键路由速查

| 功能 | 路由 |
|------|------|
| 登录页 | `/` (根路径) |
| 发现页（TOP3+火花+4模式） | `/home` |
| 火花页（公开火花墙） | `/library` |
| 故事大厅 | `/story-hall` |
| 我的页 | `/profile` |
| 设置页 | `/settings` |
| 人机模式（刘看山AI） | `/solo-match` |
| 双人对白匹配 | `/duo-match` |
| 双人对白等待 | `/duo-waiting` |
| 双人/AI对白室 | `/room/[id]` |
| 知乎热搜 | `/zhihu-search` |
| 知乎直答 | `/zhihu-zhida` |

## 十一、v6.0 全面重构速查

### 11.1 需求清单
| # | 需求 | 状态 |
|---|------|------|
| 1 | 登录页增加项目简介 | ✅ |
| 2 | 发现页：取消泡泡→TOP3排行榜+火花展示+4模式入口 | ✅ |
| 3 | 底部导航改为4Tab | ✅ |
| 4 | 火花页（原素材库）→公开火花墙 | ✅ |
| 5 | 故事页：快速匹配/长期连载/我发起的/其他人的 | ✅ |
| 6 | 我的页：头像左上+名称放大 | ✅ |
| 7 | 对白室极简化 | ✅ |
| 8 | AI催化升级：DeepSeek+知乎直答双API | ✅ |
| 9 | 双人匹配修复：15秒→刘看山AI | ✅ |
| 10 | 脑洞降低门槛：日常场景50字以内 | ✅ |
| 11 | 文档更新+本地自检+Git推送 | ✅ |
| 12 | 底部导航宽度修复（max-width: 480px） | ✅ |
| 13 | 发现页模式改名：人机/双人对白/多人/连载 | ✅ |
| 14 | 等待页简化 | ✅ |
| 15 | 匹配引擎并发bug修复 | ✅ |

### 11.2 新增API
| API | 说明 |
|-----|------|
| `POST /api/ai/catalyst` | AI动态催化问题 |
| `GET /api/sparks/public` | 公开火花墙 |
| `GET /api/sparks/mine` | 我的火花 |
| `GET /api/stories/mine` | 我的故事 |

### 11.3 登录页装饰泡泡
- 7个透明泡泡，右下角缓慢上升
- radial-gradient实现肥皂泡质感
- framer-motion驱动，不同延迟错开

## 十二、v6.3-fix1 「我的」+「设置」重构纪律

### 12.1 用户名修改接口规范
| 项目 | 值 |
|------|-----|
| 接口 | `PATCH /api/users/profile` |
| Body | `{ username: string }` |
| 唯一性检查 | ✅ 排除当前用户，冲突返回 `USERNAME_EXISTS` |
| 冲突提示 | "用户名已存在，请重新输入" |

### 12.2 头像上传接口规范
| 项目 | 值 |
|------|-----|
| 接口 | `POST /api/users/avatar` |
| Content-Type | `multipart/form-data` |
| 字段名 | `image` |
| 处理 | Multer `memoryStorage`，限制 2MB |
| 存储路径 | `public/avatars/{timestamp}-{random}{ext}` |
| 数据库 | 存相对路径 `/avatars/{filename}` |

### 12.3 操作分离铁律
- 用户名修改 与 密码修改 **必须完全分离**
- 各自独立入口、独立弹窗、独立 API
- 不允许在同一个表单中混合两者

## 十三、v6.3-fix2 认证系统修复纪律

### 13.1 认证架构（三层守卫）
```
边缘层: middleware.ts → JWT token 验证（最严格）
  ↓
布局层: AppShell.tsx → useSession() + localStorage 双重检查
  ↓
组件层: useAuth.ts → session 优先，失效时清除 localStorage
```

### 13.2 登录/注册流程规范
| 步骤 | 登录 | 注册 |
|------|------|------|
| 1 | signIn('credentials') | POST /api/auth/register |
| 2 | 成功后调用 /api/users/me | 成功后自动 signIn('credentials') |
| 3 | 真实用户数据写入 localStorage | 真实用户数据写入 localStorage |
| 4 | router.push('/home') | router.push('/home') |

### 13.3 认证守卫铁律
1. **不允许**只凭 localStorage 判断登录状态
2. **不允许**前端自己构造用户 ID
3. **必须**从 `/api/users/me` 获取服务器真实用户数据
4. **session 失效时**必须同步清除 localStorage

## 十四、v6.3-fix3 强制登录墙纪律

### 14.1 Middleware matcher 铁律
- **不允许**使用复杂的正则表达式（如 `.*\.`) 作为 matcher
- **必须使用**显式路径列表或 Next.js 官方推荐的简单正则 `/((?!api|_next/static|_next/image|favicon.ico).*)`
- **必须**确保 `/` 和 `/register` 被 matcher 覆盖

### 14.2 JWT 会话策略
- `maxAge` 设置为 **24 小时**（86400 秒），避免长期会话残留
- `updateAge` 设置为 **6 小时**（21600 秒）
- `secret` 必须显式配置，不能依赖默认值

### 14.3 本地数据清除铁律
- `session === 'unauthenticated'` 时，**无条件**清除 `xh_user` + `xh_identity` + `xh_user_id`
- 不判断数据是否存在，直接清除，防止任何形式的残留

## 十五、v6.4 火花点赞规范

### 15.1 点赞接口
| 项目 | 值 |
|------|-----|
| 接口 | `POST /api/sparks/:id/like` |
| 限制 | 不能给自己的火花点赞 |
| 重复点赞 | 已点赞则取消，未点赞则点赞（toggle） |
| 热度同步 | `Asset.hotScore` 随点赞 `increment`，取消 `decrement` |

### 15.2 排序参数
| 参数 | 说明 | 默认 |
|------|------|------|
| `sort=latest` | 按 `createdAt` 降序 | ✅ 默认 |
| `sort=hottest` | 按 `hotScore` 降序 | |

### 15.3 火花列表 API 返回字段
| 字段 | 说明 |
|------|------|
| `hotScore` | 热度值（= 点赞数） |
| `likedByMe` | 当前用户是否已点赞 |
| `isMySpark` | 是否为当前用户的火花 |
| `roomId` | 关联房间ID，点击可跳转 |

## 十六、v7.0 火花墙重构规范

### 16.1 页面架构调整
| 功能 | v6.4 | v7.0 |
|------|------|------|
| 公开火花墙 | `/library` Tab | `/library` 单一页面 |
| 个人火花 | `/library` Tab "我的火花" | `/profile/sparks` 独立页面 |
| 点赞图标 | Heart（心形） | Flame（火花） |
| 排序UI | 排序按钮 | Tab 切换（最新火花/最热火花）|

### 16.2 路由变更
| 页面 | 路径 | 说明 |
|------|------|------|
| 公开火花墙 | `/library` | 展示所有公开火花，Tab切换排序 |
| 我的火花 | `/profile/sparks` | 管理个人火花，支持排序+公开/私密切换 |

### 16.3 点赞图标铁律
- **必须使用 Flame 图标**（`lucide-react` 的 `Flame`）
- 已点赞状态：`Flame` + `fill-current` 变红
- 未点赞状态：`Flame` 灰色空心
- **禁止使用 Heart 图标**

### 16.4 个人火花页面规范
- 展示当前用户所有对白记录（无论是否公开）
- 每条记录有"公开/私密"切换开关
- 支持最新/最热排序
- 点击跳转到房间详情

### 16.5 修改用户名同步规范
- 修改用户名时同步更新 `User.name` + `User.username`
- 同步更新该用户所有 `Asset` 记录的 `identity` 字段
- 前端修改成功后同步更新 `localStorage.xh_user`

### 16.6 Middleware 更新
- 新增 `/profile/sparks` 到 matcher 列表
- 保持所有其他路由不变

---

> 最后更新：2026-05-05 v7.0 火花墙重构完成 ✅
