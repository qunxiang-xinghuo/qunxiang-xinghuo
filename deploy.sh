#!/bin/bash
# 群像·星火 - 一键部署脚本
# 使用方法: 在腾讯云服务器上执行此脚本

set -e

APP_NAME="qunxiangxinghuo"
APP_DIR="/opt/apps/${APP_NAME}"
PORT=5000

echo "=== 群像·星火 部署脚本 ==="

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 2. 安装 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

# 3. 安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "正在安装 PM2..."
    npm install -g pm2
fi

# 4. 创建应用目录
mkdir -p ${APP_DIR}
cd ${APP_DIR}

# 5. 复制构建产物（假设已通过 scp 上传）
echo "请确保已将以下文件上传到 ${APP_DIR}:"
echo "  - dist/"
echo "  - package.json"
echo "  - pnpm-lock.yaml"
echo "  - .coze"

# 6. 安装生产依赖
echo "安装依赖..."
pnpm install --prod --frozen-lockfile

# 7. 停止旧进程
pm2 delete ${APP_NAME} 2>/dev/null || true

# 8. 启动应用
echo "启动应用..."
pm2 start dist/server.js --name ${APP_NAME} --env production
pm2 save
pm2 startup

echo ""
echo "=== 部署完成 ==="
echo "应用运行在: http://localhost:${PORT}"
echo "PM2 状态: pm2 status"
echo "查看日志: pm2 logs ${APP_NAME}"
echo ""
echo "下一步: 在 1Panel 中配置反向代理"
echo "  代理地址: http://127.0.0.1:${PORT}"
echo "  域名: qunxiangxinghuo.cn"
