#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/qunxiang-xinghuo"
LOG_FILE="$PROJECT_DIR/webhook-deploy.log"
BUNDLE_FILE="$PROJECT_DIR/qunxiang-fix7.bundle"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== Deploy Start =====" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# 优先用 git pull 从 fqunxiang 更新（持续部署）
export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fetching from fqunxiang..." >> "$LOG_FILE"
git fetch fqunxiang dev >> "$LOG_FILE" 2>&1

# 回退到最新提交
git reset --hard fqunxiang/dev >> "$LOG_FILE" 2>&1
# 清理未跟踪文件
git clean -fd >> "$LOG_FILE" 2>&1

# 如果本地有 bundle 文件，清理掉
if [ -f "$BUNDLE_FILE" ]; then
  rm -f "$BUNDLE_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Installing dependencies..." >> "$LOG_FILE"
npm install >> "$LOG_FILE" 2>&1

# v8.0-login-fix: 完全清除 Next.js 构建产物，防止任何缓存残留
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Clearing Next.js build..." >> "$LOG_FILE"
rm -rf .next >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Building..." >> "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting PM2..." >> "$LOG_FILE"
pm2 restart qunxiang-xinghuo >> "$LOG_FILE" 2>&1 || pm2 start npm --name "qunxiang-xinghuo" -- start >> "$LOG_FILE" 2>&1

# v8.0-login-fix: 完全重启 Nginx 清除所有缓存（reload 不会清除缓存文件）
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping Nginx..." >> "$LOG_FILE"
/www/server/nginx/sbin/nginx -s stop >> "$LOG_FILE" 2>&1 || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Nginx..." >> "$LOG_FILE"
/www/server/nginx/sbin/nginx >> "$LOG_FILE" 2>&1 || true

# 尝试清除 Nginx proxy_cache 目录
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Clearing Nginx cache..." >> "$LOG_FILE"
rm -rf /www/server/nginx/proxy_cache_dir/* >> "$LOG_FILE" 2>&1 || true
rm -rf /www/server/nginx/proxy_cache/* >> "$LOG_FILE" 2>&1 || true
rm -rf /tmp/nginx_cache/* >> "$LOG_FILE" 2>&1 || true

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== Deploy Complete =====" >> "$LOG_FILE"
