#!/bin/bash
# =============================================================================
# 群像·星火 一键部署脚本（腾讯云服务器 / 宝塔面板）
# 用法：
#   1. 把项目代码上传到服务器 /www/wwwroot/qunxiang-xinghuo
#   2. cd /www/wwwroot/qunxiang-xinghuo
#   3. chmod +x deploy/deploy.sh
#   4. ./deploy/deploy.sh
# =============================================================================

set -e

echo "🔥 群像·星火 部署开始..."

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "请在宝塔面板 → 软件商店 → 安装 Node.js 20.x"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️ Node.js 版本过低: $(node -v)，建议升级到 20.x${NC}"
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma Client
echo "🗄️ 生成 Prisma Client..."
npx prisma generate

# 推送数据库结构
echo "🗄️ 初始化数据库..."
npx prisma db push --accept-data-loss

# 可选：填充种子数据
if [ "$1" == "--seed" ]; then
    echo "🌱 填充种子数据..."
    npx prisma db seed
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

echo ""
echo -e "${GREEN}✅ 构建完成！${NC}"
echo ""
echo "下一步（二选一）："
echo ""
echo "【方式A：宝塔面板 Node项目】"
echo "  1. 宝塔面板 → 网站 → Node项目 → 添加Node项目"
echo "  2. 项目目录: $(pwd)"
echo "  3. 启动命令: npm run start"
echo "  4. 端口: 3000"
echo ""
echo "【方式B：PM2 守护进程】"
echo "  npm install -g pm2"
echo "  pm2 start server.ts --interpreter tsx --name xinghuo"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "然后配置 Nginx 反向代理到 3000 端口"
echo ""
