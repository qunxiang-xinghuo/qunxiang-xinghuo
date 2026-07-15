# 项目错误总结 - 群像·星火

## 一、Git 和部署相关

### 1. GitHub Token 过期
**错误：** `remote: Support for password authentication was removed`
**原因：** GitHub 不再支持密码认证，需要使用 Personal Access Token
**修复：** 重新生成 GitHub Token
**教训：** Token 有有效期，需要定期更新

### 2. 服务器无法连接 GitHub
**错误：** `GnuTLS recv error (-110): The TLS connection was non-properly terminated`
**原因：** 国内服务器访问 GitHub 不稳定
**修复：** 使用 Gitee 作为代码中转站
**教训：** 国内部署需要考虑网络问题

### 3. Gitee Token 认证失败
**错误：** `The token username invalid` + `403`
**原因：** 
- 用户名输入错误（输入了仓库名而不是用户名）
- Token 可能过期
**修复：** 使用正确的用户名 `eccentric-blaze`
**教训：** 仔细区分用户名和仓库名

### 4. Git 分支分歧
**错误：** `fatal: Need to specify how to reconcile divergent branches`
**原因：** 本地和远程历史不一致
**修复：** `git fetch origin && git reset --hard origin/main`
**教训：** 服务器不要手动修改代码

### 5. 本地修改阻止拉取
**错误：** `error: cannot pull with rebase: You have unstaged changes`
**原因：** 服务器上有未提交的修改
**修复：** `git reset --hard && git clean -fd`
**教训：** 服务器只用于部署，不要直接修改代码

### 6. 数据库文件被提交到 Git
**错误：** `prisma/dev.db` 出现在 Git 历史中
**原因：** `.gitignore` 配置不完整
**修复：** 
- 使用 `git filter-branch` 从历史中移除
- 更新 `.gitignore` 添加 `*.db`
**教训：** 敏感文件必须在第一次提交前就加入 .gitignore

---

## 二、Next.js 和 TypeScript 相关

### 7. Rate Limiting 类型错误
**错误：** `Argument of type '(request: NextRequest) => Promise<Response>' is not assignable to parameter of type '(req: Request) => Promise<Response>'`
**原因：** `withRateLimit` 使用 `Request` 类型，但 Next.js API 使用 `NextRequest`
**修复：** 改用 `any` 类型
**教训：** Next.js 有特殊的类型系统，不要假设标准 Web API 类型

### 8. 动态路由参数数量不匹配
**错误：** `Target signature provides too few arguments. Expected 2 or more, but got 1`
**原因：** 动态路由需要 `(request, { params })` 两个参数，但包装器只传了一个
**修复：** 改用可变参数 `...args: any[]`
**教训：** 必须测试所有路由类型（静态 + 动态）

### 9. Hydration 错误
**错误：** React hydration 失败
**原因：** 在 JSX 中直接使用 `Date.now()` 或 `Math.random()`
**修复：** 使用 `useEffect` + `useState` 确保客户端渲染
**教训：** 服务端渲染不能有动态数据

### 10. React 纯度问题
**错误：** `React Hook "useMemo" has missing dependencies`
**原因：** `useMemo` 依赖了不稳定的值
**修复：** 移除 `Date.now()` 和 `Math.random()`
**教训：** React Hooks 依赖必须是稳定的

---

## 三、Zod 和验证相关

### 11. Zod API 变更
**错误：** `Property 'errors' does not exist on type 'ZodError<T>'`
**原因：** 使用了过时的 API `result.error.errors`
**修复：** 改为 `result.error.issues`
**教训：** 检查库版本文档，不要凭记忆写代码

---

## 四、ESLint 相关

### 12. ESLint 注释位置错误
**错误：** ESLint 禁用注释没有生效
**原因：** 注释放在了错误的位置
**修复：** 调整注释到正确的代码行上方
**教训：** 先运行 lint 检查，再添加禁用注释

### 13. React Hooks 依赖警告
**错误：** `React Hook "useMemo" has missing dependencies`
**原因：** 依赖数组不完整
**修复：** 添加所有依赖或重构代码
**教训：** 不要忽略 ESLint 警告

---

## 五、Prisma 和数据库相关

### 14. Prisma Client 未生成
**错误：** `Prisma Client is not generated`
**原因：** 没有运行 `pnpm prisma generate`
**修复：** 在构建前运行生成命令
**教训：** 部署流程必须包含 `prisma generate`

### 15. 数据库路径错误
**错误：** 数据库文件找不到
**原因：** 使用了绝对路径而不是相对路径
**修复：** 使用 `file:./prisma/dev.db`
**教训：** 使用相对路径保证可移植性

---

## 六、服务器和环境相关

### 16. 环境变量缺失
**错误：** NextAuth 返回 HTML 而不是 JSON
**原因：** 缺少 `AUTH_SECRET` 和 `NEXTAUTH_URL` 环境变量
**修复：** 在 `.env` 中添加必要变量
**教训：** 部署前检查所有必需的环境变量

### 17. 端口冲突
**错误：** 服务启动失败
**原因：** 端口被占用
**修复：** 使用 `DEPLOY_RUN_PORT` 环境变量
**教训：** 不要硬编码端口

### 18. 目录路径不存在
**错误：** `cd: /var/www/qunxiang-xinghuo: No such file or directory`
**原因：** 使用了错误的部署路径
**修复：** 使用 `/home/ubuntu/qunxiang-xinghuo`
**教训：** 确认服务器目录结构

### 19. pnpm 未安装
**错误：** `pnpm: command not found`
**原因：** 服务器没有安装 pnpm
**修复：** `npm install -g pnpm`
**教训：** 确认服务器环境依赖

---

## 七、安全和防护相关

### 20. 敏感信息泄露
**错误：** `.env` 和 `dev.db` 被提交到 Git
**原因：** `.gitignore` 配置不完整
**修复：** 
- 更新 `.gitignore`
- 使用 `git filter-branch` 清理历史
**教训：** 项目初始化时就配置好 .gitignore

### 21. 缺少 Rate Limiting
**错误：** API 可以被无限调用
**原因：** 没有实现限流
**修复：** 实现内存级 Rate Limiting
**教训：** 公开 API 必须有限流保护

### 22. 缺少输入验证
**错误：** 用户可以提交任意数据
**原因：** 没有验证输入
**修复：** 使用 Zod 验证所有输入
**教训：** 永远不要信任用户输入

---

## 八、构建和部署相关

### 23. 构建失败
**错误：** `Next.js build worker exited with code: 1`
**原因：** TypeScript 或 ESLint 错误
**修复：** 先本地修复再部署
**教训：** 本地构建通过后再部署

### 24. 依赖安装失败
**错误：** `No package.json found`
**原因：** 代码没有正确拉取
**修复：** 检查 Git 拉取是否成功
**教训：** 按顺序执行部署步骤

### 25. PM2 进程错误
**错误：** 服务状态 `errored`
**原因：** 启动命令错误或环境变量缺失
**修复：** 检查 `.env` 和启动脚本
**教训：** 使用 `pm2 logs` 查看错误日志

---

## 总结：必须遵守的规则

### 提交前
1. ✅ 运行 `pnpm ts-check`
2. ✅ 运行 `pnpm lint`
3. ✅ 运行 `pnpm build`
4. ✅ 检查 `.gitignore` 是否包含敏感文件

### 部署前
1. ✅ 确认所有环境变量已配置
2. ✅ 确认数据库文件未提交
3. ✅ 确认构建成功
4. ✅ 确认 API 接口正常

### 服务器操作
1. ✅ 不要手动修改代码
2. ✅ 使用 `git reset --hard` 同步
3. ✅ 按顺序执行部署命令
4. ✅ 检查 PM2 状态和日志

### 安全防护
1. ✅ 所有 API 添加 Rate Limiting
2. ✅ 所有输入使用 Zod 验证
3. ✅ 敏感文件加入 .gitignore
4. ✅ 定期备份数据库

---

## 记忆口诀

**"类型检查不能少，Lint 规范要记牢"**
**"动态路由多参数，Zod 用 issues 别用 errors"**
**"敏感文件 gitignore，部署之前先构建"**
**"服务器上不改码，reset hard 最可靠"**
