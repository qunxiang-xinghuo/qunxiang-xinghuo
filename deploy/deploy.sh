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

# 确保 .env 文件存在
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << 'EOF'
# 数据库配置
DATABASE_URL="file:/www/wwwroot/qunxiang-xinghuo/prisma/dev.db"

# NextAuth 配置（部署后请改为实际域名）
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="xinghuo-secret-$(date +%s)"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# 环境
NODE_ENV="production"

# 知乎圈子开放平台配置（重要！比赛要求）
# ZHIHU_APP_KEY="你的知乎用户token"
# ZHIHU_APP_SECRET="知乎提供的应用密钥"
EOF
    echo -e "${GREEN}✓ .env 已创建，请根据实际需要修改配置${NC}"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma Client
echo "🗄️ 生成 Prisma Client..."
npx prisma generate

# 推送数据库结构
echo "🗄️ 初始化数据库..."
export DATABASE_URL="file:/www/wwwroot/qunxiang-xinghuo/prisma/dev.db"
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
