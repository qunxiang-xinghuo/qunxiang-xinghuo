#!/bin/bash
# 群像·星火 一键部署脚本
# 使用方法：在服务器 /www/wwwroot/qunxiang-xinghuo 目录下执行

set -e

echo "========================================"
echo "  群像·星火 一键部署脚本"
echo "========================================"
echo ""

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
cd /www/wwwroot/qunxiang-xinghuo

if [ -d ".git" ]; then
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "❌ 检测到未提交的本地修改，已停止自动部署，避免覆盖现场文件"
        exit 1
    fi
    git fetch origin dev
    git checkout dev
    git pull --ff-only origin dev
    echo "✅ Git 拉取成功"
else
    echo "⚠️  当前目录不是Git仓库，请确认路径正确"
    exit 1
fi

# 2. 安装依赖
echo ""
echo "[2/5] 安装依赖..."
npm ci
echo "✅ 依赖安装完成"

# 3. Prisma + 构建
echo ""
echo "[3/5] 生成 Prisma Client 并构建项目..."
npx prisma generate
npm run build
echo "✅ 构建完成"

# 4. 准备运行目录
echo ""
echo "[4/5] 准备运行目录..."
mkdir -p logs
echo "✅ 运行目录已准备"

# 5. 重启PM2
echo ""
echo "[5/5] 重启 PM2 进程..."
pm2 restart xinghuo || pm2 start ecosystem.config.js --only xinghuo
echo "✅ PM2 重启完成"

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
pm2 list
