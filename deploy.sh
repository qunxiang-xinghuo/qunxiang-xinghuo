#!/bin/bash
# 群像·星火 部署脚本
# 用于部署到腾讯云或其他 Node.js 服务器

set -e

echo "🚀 开始部署群像·星火..."

# 1. 安装依赖
echo "📦 安装依赖..."
pnpm install

# 2. 生成 Prisma Client
echo "🗄️ 生成 Prisma Client..."
npx prisma generate

# 3. 推送数据库 Schema
echo "📊 推送数据库 Schema..."
npx prisma db push

# 4. 构建项目
echo "🔨 构建项目..."
pnpm build

# 5. 启动服务（使用 PM2）
echo "🏃 启动服务..."
if command -v pm2 &> /dev/null; then
    pm2 delete qunxiang-xinghuo 2>/dev/null || true
    pm2 start ecosystem.config.js --name qunxiang-xinghuo
    pm2 save
else
    echo "⚠️ PM2 未安装，使用普通方式启动..."
    echo "建议安装 PM2: npm install -g pm2"
    pnpm start &
fi

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost:${PORT:-5000}"
