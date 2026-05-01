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
    git fetch origin dev
    git reset --hard origin/dev
    echo "✅ Git 拉取成功"
else
    echo "⚠️  当前目录不是Git仓库，请确认路径正确"
    exit 1
fi

# 2. 安装依赖
echo ""
echo "[2/5] 安装依赖..."
npm install --production=false
echo "✅ 依赖安装完成"

# 3. 构建
echo ""
echo "[3/5] 构建项目..."
npm run build
echo "✅ 构建完成"

# 4. 复制静态资源
echo ""
echo "[4/5] 复制静态资源到 standalone..."
cp -r .next/static .next/standalone/.next/
echo "✅ 静态资源复制完成"

# 5. 重启PM2
echo ""
echo "[5/5] 重启 PM2 进程..."
pm2 restart qunxiang-xinghuo || pm2 start .next/standalone/server.js --name qunxiang-xinghuo
echo "✅ PM2 重启完成"

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
pm2 list
