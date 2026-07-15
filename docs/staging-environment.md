# 预发环境配置指南

## 概述
预发环境（Staging）是生产环境前的最后测试环境，用于验证新功能、修复和配置变更。

## 环境架构

```
开发环境 (Development)
    ↓ 代码推送
预发环境 (Staging) ← 当前配置
    ↓ 验证通过
生产环境 (Production)
```

## 1. 服务器配置

### 1.1 创建预发服务器
- 配置：与生产环境相同（2 核 4GB）
- 系统：Ubuntu 22.04 LTS
- 位置：同生产环境（减少网络延迟）

### 1.2 域名配置
- 生产环境：`qunxiangxinghuo.cn`
- 预发环境：`staging.qunxiangxinghuo.cn`

### 1.3 数据库
- 生产环境：`/home/ubuntu/qunxiang-xinghuo/prisma/prod.db`
- 预发环境：`/home/ubuntu/qunxiang-xinghuo/prisma/staging.db`

## 2. Git 分支策略

```
main (生产分支)
  ↑
  | 合并
staging (预发分支)
  ↑
  | 合并
feature/* (功能分支)
```

### 分支规则
- `main` - 生产环境代码，受保护
- `staging` - 预发环境代码，测试通过后可合并到 main
- `feature/*` - 新功能开发分支

## 3. 部署流程

### 3.1 自动部署脚本

```bash
#!/bin/bash
# scripts/deploy-staging.sh

set -e

echo "🚀 开始部署预发环境..."

# 1. 切换到 staging 分支
git checkout staging
git pull origin staging

# 2. 安装依赖
pnpm install

# 3. 生成 Prisma Client
pnpm prisma generate

# 4. 同步数据库
pnpm prisma db push

# 5. 运行测试
pnpm test

# 6. 构建项目
pnpm build

# 7. 重启服务（使用不同端口）
pm2 restart qunxiang-xinghuo-staging

echo "✅ 预发环境部署完成！"
echo "访问地址：http://localhost:3001"
```

### 3.2 PM2 配置

```bash
# 启动预发环境（端口 3001）
pm2 start pnpm --name "qunxiang-xinghuo-staging" -- start -- -p 3001
```

## 4. 环境变量

创建 `.env.staging`：

```env
# 数据库
DATABASE_URL="file:./prisma/staging.db"

# NextAuth
AUTH_SECRET="staging-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3001"

# 知乎 API（使用测试密钥）
ZHIHU_API_KEY="your-zhihu-api-key"

# 豆包大模型
DOUBAO_API_KEY="your-doubao-api-key"
```

## 5. Nginx 配置

```nginx
# /etc/nginx/sites-available/staging.qunxiangxinghuo.cn

server {
    listen 80;
    server_name staging.qunxiangxinghuo.cn;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/staging.qunxiangxinghuo.cn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. GitHub Actions 自动部署

```yaml
# .github/workflows/deploy-staging.yml

name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run tests
      run: pnpm test
    
    - name: Build
      run: pnpm build
    
    - name: Deploy to Staging Server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.STAGING_HOST }}
        username: ${{ secrets.STAGING_USERNAME }}
        key: ${{ secrets.STAGING_SSH_KEY }}
        script: |
          cd /home/ubuntu/qunxiang-xinghuo
          git pull origin staging
          pnpm install
          pnpm prisma generate
          pnpm prisma db push
          pnpm build
          pm2 restart qunxiang-xinghuo-staging
```

## 7. 测试验证清单

部署后验证：
- [ ] 首页正常加载
- [ ] 登录/注册功能正常
- [ ] 场景列表正常显示
- [ ] 角色扮演功能正常
- [ ] 故事生成功能正常
- [ ] 用户中心功能正常
- [ ] API 接口响应正常
- [ ] 数据库连接正常
- [ ] 缓存功能正常

## 8. 回滚流程

如果预发环境测试失败：

```bash
# 1. 回滚代码
git checkout staging
git reset --hard HEAD~1

# 2. 重新部署
pnpm install
pnpm prisma generate
pnpm build
pm2 restart qunxiang-xinghuo-staging
```

## 9. 与生产环境同步

定期将生产数据同步到预发环境：

```bash
# 在生产服务器
cd /home/ubuntu/qunxiang-xinghuo
cp prisma/prod.db prisma/prod.db.backup

# 在预发服务器
cd /home/ubuntu/qunxiang-xinghuo
# 从生产服务器复制数据库
scp user@production:/home/ubuntu/qunxiang-xinghuo/prisma/prod.db prisma/staging.db
```

---

## 当前状态
**待实施**

当前只有单服务器，预发环境可在以下情况实施：
1. 用户量增长，需要更稳定的发布流程
2. 团队扩大，多人协作需要测试环境
3. 功能复杂度高，需要充分测试
