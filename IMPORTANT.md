# 🔐 群像·星火 重要信息记录

> 原则：每次100% context前，关键信息必须记录在此。犯过的问题不再犯。

---

## 一、服务器信息

| 项目 | 值 |
|------|-----|
| IP | `81.70.59.228` |
| 系统 | 腾讯云 OpenCloudOS 9.4 |
| 用户 | `root` |
| SSH端口 | `22` |
| 部署路径 | `/www/wwwroot/qunxiang-xinghuo` |
| PM2进程名 | `qunxiang-xinghuo` |
| 面板 | 宝塔面板（路径特征 `/www/wwwroot`） |

## 二、部署命令（一键复制）

```bash
cd /www/wwwroot/qunxiang-xinghuo \
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

**本地paramiko部署脚本**：`deploy_remote.py`（Python + paramiko）

## 三、Git仓库

| 项目 | 值 |
|------|-----|
| 远程 | `github.com:qunxiang-xinghuo/qunxiang-xinghuo` |
| 当前分支 | `dev` |
| 本地路径 | `C:\Users\Dell\qunxiang-xinghuo` |

## 四、环境变量（服务器 `.env`）

```
DEEPSEEK_API_KEY="sk-181c8aa2e8f1469d9a60698f6d79d71d"
ZHIHU_API_KEY="xrUmjOP1pferLLYrQufOIrvlbT3tFvct"
DATABASE_URL="file:./dev.db"
```

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

### 问题3：SSH密钥认证失败
- **现象**：`id_ed25519` 公钥被服务器拒绝，回退到密码认证
- **根因**：服务器上 `~/.ssh/authorized_keys` 可能未包含本地公钥，或sshd配置变更
- **解决**：使用密码通过paramiko连接
- **教训**：保留密码作为备用认证方式

### 问题4：页面空白（v5.3最严重bug，v5.5复发）
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
| **TDD v5.0** | `docs/qunxiangxinhuo-TDD-v5.0.md` | 产品需求文档（用户反馈的找不到的文件） |
| TDD v4.5 | `TDD-v4.5-泡泡脑洞系统.md` | 泡泡系统技术细节 |
| TDD v1.0~v4.3 | `docs/qunxiangxinhuo-TDD-v*.md` | 历史版本 |

> 用户找不到TDD5.0？它在 `docs/` 子目录里，不在根目录。

## 九、刘看山形象资源

| 资源 | 路径 | 用途 |
|------|------|------|
| 官方图片 | `public/liukanshan.jpg` | 所有页面共用 |
| 组件 | `src/components/layout/LiuKanshanAvatar.tsx` | 等待页/超时页/故事页 |
| 浮动按钮 | `src/components/layout/LiuKanshanFloat.tsx` | 首页右下角浮动 |
| 欢迎弹窗 | `src/components/layout/LiuKanshanWelcome.tsx` | 首页新用户引导 |

## 十、关键路由速查

| 功能 | 路由 |
|------|------|
| 首页（泡泡+模式入口） | `/home` |
| 双人模式匹配 | `/duo-match` |
| 故事大厅广场 | `/story-hall` |
| 故事详情+角色认领 | `/story-hall/[storyId]` |
| 多人对白室 | `/story-hall/[storyId]/room` |
| 双人/AI对白室 | `/room/[id]` |
| 素材库 | `/library` |
| 个人中心 | `/profile` |
| 知乎热搜 | `/zhihu-search` |
| 知乎直答 | `/zhihu-zhida` |

---

> 最后更新：2026-05-02 v5.8-fix 故事大厅彻底重设计（6种剧本模板+海报式卡片+隐藏秘密+沉浸式详情页）部署完成 ✅

---

## 十一、v5.8-fix 故事大厅重设计速查

### 6种剧本模板
| 模板 | 风格 | 预设角色 | 典型秘密 |
|------|------|---------|---------|
| 医疗急救 | 生死抉择、伦理困境 | 主刀医生、家属、医院主任 | 家属曾害过患者 |
| 职场风云 | 利益博弈、站队 | CEO、HRD、CTO、基层员工 | CEO知道裁员名单 |
| 悬疑密室 | 暴风雪山庄、反转 | 侦探、嫌疑人×5 | 死者是所有人的仇人 |
| 爱情纠葛 | 三角关系、背叛 | 新郎、新娘、初恋 | 新郎杀了初恋的男友 |
| 科幻末世 | 生存抉择、人性 | 舰长、科学家、普通人 | 只有舰长知道没有超光速 |
| 家庭伦理 | 代际冲突、秘密 | 父亲、母亲、子女 | 父亲早就知道不是亲生的 |

### 海报式卡片字段
- `posterTitle`：大标题（最多10字）
- `hook`：一句话钩子（吸引点击）
- `setting`：一句话世界观设定
- `status`：recruiting(招募中) / ongoing(进行中) / completed(已完成)
- `type`：medical/workplace/mystery/romance/scifi/family
- `hiddenSecrets`：每个角色的隐藏秘密
- `coreMotivations`：每个角色的核心动机

### 沉浸式详情页结构
1. 剧目海报头部（渐变背景+状态badge+hook）
2. 核心数据面板（角色数/已就位/对白数/创建日）
3. 世界观卷轴（可展开）
4. 核心冲突剧场
5. 隐藏秘密区（Lock图标+悬疑文案）
6. 演员表：人物小传卡片（人物弧光+核心动机+演绎要求+认领状态）
7. 导演审核/启动故事/进入对白室按钮

### 部署验证
- Build：47/47 ✅
- 线上：`http://81.70.59.228:3000/story-hall`
- 新代码验证：CreateStoryModal=2, StoryDetail=3, StoryHall=8 ✅
- 静态JS/CSS：200 ✅

---

## 十二、v5.7 全面重设计速查

### 泡泡系统（TDD v5.0完整实现）
```
前端: BubbleCloud.tsx → GET /api/brainholes/bubble?limit=20
后端: src/app/api/brainholes/bubble/route.ts
数据: { id, title, scenario, hotScore, category, difficulty, source }
跳转: /brainhole/${id}
Hover浮层: 分类标签 + 难度徽章 + 标题 + scenario摘要 + 热度分 + 进入按钮
分类色: medical/legal/workplace/life/education/tech/emergency/general + zhihu_hot/zhihu_search/deepseek/fallback
```

### 双人模式流程
```
/duo-match → 身份选择（知乎/AI随机/自定义）
  → /duo-waiting → POST /api/match → 轮询 GET /api/match/:id
    → 匹配成功 → /room/:roomId（WebSocket实时对白）
    → 超时 → /duo-timeout → 可选：AI对话/继续等待/返回首页
```

### 部署检查清单
- [ ] 本地 `npm run build` 47/47通过
- [ ] `git commit` + `git push origin dev`
- [ ] SFTP上传关键文件（GitHub超时时）
- [ ] 服务器 `rm -rf .next && NODE_ENV=production npm run build`
- [ ] `pm2 restart qunxiang-xinghuo && pm2 save`
- [ ] curl 验证首页 `/home` 200
- [ ] curl 验证静态JS/CSS 200（查找实际存在的文件，非main-app.js）
- [ ] curl 验证泡泡API `/api/brainholes/bubble` 返回数据
- [ ] 更新 `ProblemLog.md`
- [ ] 更新 `IMPORTANT.md`
