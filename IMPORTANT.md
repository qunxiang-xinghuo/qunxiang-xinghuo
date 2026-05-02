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
  && git pull origin dev \
  && npm install \
  && npm run build \
  && pm2 restart qunxiang-xinghuo \
  && pm2 save
```

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

## 八、关键路由速查

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

> 最后更新：2026-05-04 v5.3 部署完成
