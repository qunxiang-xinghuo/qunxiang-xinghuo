# 群像·星火 部署指南

## 部署包信息
- 最新部署包: `qunxiang-xinghuo-latest.tar.gz`
- 大小: ~42MB（含水彩风格IP视觉素材）
- 内容: 完整源代码 + 场景插图（不含 node_modules、数据库、构建产物）
- 生成时间: 2025-08-02

---

## 服务器部署步骤

### 1. 上传部署包到服务器

```bash
# 在本地执行（将文件上传到服务器）
scp qunxiang-xinghuo-deploy.tar.gz root@qunxiangxinghuo.cn:/var/www/
```

### 2. 登录服务器并解压

```bash
# SSH 登录服务器
ssh root@qunxiangxinghuo.cn

# 进入项目目录
cd /var/www/qunxiang-xinghuo

# 备份旧版本（可选）
cp -r . ../qunxiang-xinghuo-backup-$(date +%Y%m%d)

# 解压新代码
tar -xzf ../qunxiang-xinghuo-deploy.tar.gz
```

### 3. 安装依赖

```bash
# 安装 pnpm（如果没有）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 运行数据库迁移（创建表结构）
pnpm prisma db push

# 初始化种子数据（场景、故事等）
pnpm prisma db seed
```

### 5. 配置环境变量

```bash
# 创建 .env 文件
cat > .env << 'EOF'
# 数据库
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
AUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="https://qunxiangxinghuo.cn"

# 知乎 API
ZHIHU_API_KEY="your-zhihu-api-key"

# AI 模型
COZE_API_KEY="your-coze-api-key"
EOF
```

### 6. 构建并启动

```bash
# 构建生产版本
pnpm build

# 启动服务（使用 PM2 管理）
pm2 start pnpm --name "qunxiang-xinghuo" -- start

# 或者使用 nohup
nohup pnpm start > app.log 2>&1 &
```

### 7. 配置反向代理（Nginx/OpenResty）

```nginx
server {
    listen 80;
    server_name qunxiangxinghuo.cn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 从 GitHub 仓库部署（推荐）

如果服务器可以访问 GitHub，直接从仓库拉取更简单：

```bash
# 克隆仓库
git clone https://github.com/qunxiang-xinghuo/qunxiang-xinghuo.git
cd qunxiang-xinghuo

# 安装依赖
pnpm install

# 初始化数据库
pnpm prisma generate
pnpm prisma db push

# 配置环境变量（同上）
# ...

# 构建并启动
pnpm build
pm2 start pnpm --name "qunxiang-xinghuo" -- start
```

---

## 验证部署

```bash
# 检查服务状态
pm2 status

# 查看日志
pm2 logs qunxiang-xinghuo

# 测试访问
curl http://localhost:3000
```

访问 https://qunxiangxinghuo.cn 确认网站正常运行。

---

## 常见问题

### 1. 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000
# 杀死进程
kill -9 <PID>
```

### 2. 数据库初始化失败
```bash
# 删除旧数据库重新初始化
rm prisma/dev.db
pnpm prisma db push
```

### 3. 构建失败
```bash
# 清理缓存重新构建
rm -rf .next node_modules
pnpm install
pnpm build
```

---

## 更新代码

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖（如有更新）
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart qunxiang-xinghuo
```
