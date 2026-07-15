# 代码自检清单

## 每次提交前必须执行

### 1. TypeScript 类型检查
```bash
pnpm ts-check
```
- ✅ 无错误才能提交
- ❌ 有错误必须修复

### 2. ESLint 代码规范检查
```bash
pnpm lint
```
- ✅ 无错误才能提交
- ⚠️ 警告可以忽略，但最好修复

### 3. 构建测试
```bash
pnpm build
```
- ✅ 构建成功才能提交
-  构建失败必须修复

### 4. 接口测试（如有 API）
```bash
# 测试所有 API 接口
curl -s http://localhost:3000/api/xxx
```

---

## 常见错误检查

### Next.js API 路由
- [ ] 参数类型使用 `any` 或 `NextRequest`
- [ ] 动态路由支持多参数传递
- [ ] 返回值类型正确

### Zod 验证
- [ ] 使用 `result.error.issues` 而不是 `result.error.errors`
- [ ] Schema 定义完整

### Rate Limiting
- [ ] 包装器支持可变参数
- [ ] IP 获取逻辑正确
- [ ] 限制策略合理

### 数据库
- [ ] Prisma schema 已同步
- [ ] 数据库文件已加入 .gitignore
- [ ] 备份脚本已测试

---

## 部署前检查

- [ ] 代码已推送到 GitHub
- [ ] 代码已推送到 Gitee
- [ ] 敏感文件未提交（.env, *.db）
- [ ] 服务器能正常拉取代码
- [ ] 构建成功
- [ ] 服务正常启动

---

## 记住的教训

1. **不要假设类型正确** - 总是运行 `pnpm ts-check`
2. **不要跳过 lint 检查** - 总是运行 `pnpm lint`
3. **不要直接部署** - 先在本地构建测试
4. **不要忽略动态路由** - 测试所有路由类型
5. **不要使用过时 API** - 检查库版本和文档
