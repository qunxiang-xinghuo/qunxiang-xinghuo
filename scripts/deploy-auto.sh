#!/bin/bash
# =============================================================================
# 群像·星火 — 自动化部署脚本
# v8.0-roadmap: 一键部署 + 自动重试 + 部署后验证
# =============================================================================

set -e

# ---- 配置（从 IMPORTANT.md 获取）----
PROJECT_DIR="/www/wwwroot/qunxiang-xinghuo"
BACKUP_DIR="/www/backup/qunxiang-xinghuo"
LOG_FILE="$PROJECT_DIR/deploy-auto.log"
DB_FILE="$PROJECT_DIR/dev.db"
SERVER_URL="http://localhost"
MAX_BUILD_RETRY=3

# ---- 颜色输出 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[WARN] $1${NC}" | tee -a "$LOG_FILE"
}

# ---- 步骤1：数据库备份 ----
backup_database() {
  log "====== 步骤1：数据库备份 ======"
  mkdir -p "$BACKUP_DIR"
  local backup_file="$BACKUP_DIR/dev.db.$(date +%Y%m%d_%H%M%S).bak"
  
  if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$backup_file"
    success "数据库已备份到: $backup_file"
  else
    warn "数据库文件不存在，跳过备份"
  fi
}

# ---- 步骤2：拉取最新代码 ----
fetch_code() {
  log "====== 步骤2：拉取最新代码 ======"
  cd "$PROJECT_DIR"
  
  export GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_fqunxiang -o StrictHostKeyChecking=no -p 2222'
  
  log "从 fqunxiang 拉取 dev 分支..."
  git fetch fqunxiang dev >> "$LOG_FILE" 2>&1
  git reset --hard fqunxiang/dev >> "$LOG_FILE" 2>&1
  git clean -fd >> "$LOG_FILE" 2>&1
  success "代码已更新到最新"
}

# ---- 步骤3：安装依赖 ----
install_deps() {
  log "====== 步骤3：安装依赖 ======"
  cd "$PROJECT_DIR"
  npm install >> "$LOG_FILE" 2>&1
  success "依赖安装完成"
}

# ---- 步骤4：数据库 Schema 同步 ----
sync_database() {
  log "====== 步骤4：数据库 Schema 同步 ======"
  cd "$PROJECT_DIR"
  export DATABASE_URL="file:./dev.db"
  npx prisma db push --accept-data-loss >> "$LOG_FILE" 2>&1
  success "数据库同步完成"
}

# ---- 步骤5：构建（带重试机制） ----
build_project() {
  log "====== 步骤5：项目构建 ======"
  cd "$PROJECT_DIR"
  
  local attempt=1
  local build_success=false
  
  while [ $attempt -le $MAX_BUILD_RETRY ]; do
    log "构建尝试 $attempt / $MAX_BUILD_RETRY..."
    
    # 完全清除构建缓存
    rm -rf .next >> "$LOG_FILE" 2>&1
    
    if npm run build >> "$LOG_FILE" 2>&1; then
      build_success=true
      break
    else
      error "构建失败（尝试 $attempt）"
      if [ $attempt -lt $MAX_BUILD_RETRY ]; then
        warn "等待 5 秒后重试..."
        sleep 5
      fi
    fi
    
    attempt=$((attempt + 1))
  done
  
  if [ "$build_success" = false ]; then
    error "构建失败 ${MAX_BUILD_RETRY} 次，部署终止！"
    # 恢复备份（可选）
    # cp "$backup_file" "$DB_FILE"
    exit 1
  fi
  
  success "构建成功"
}

# ---- 步骤6：重启服务 ----
restart_services() {
  log "====== 步骤6：重启服务 ======"
  
  # PM2 重启
  pm2 restart qunxiang-xinghuo >> "$LOG_FILE" 2>&1 || \
    pm2 start npm --name "qunxiang-xinghuo" -- start >> "$LOG_FILE" 2>&1
  success "PM2 已重启"
  
  # Nginx 重启清除缓存
  /www/server/nginx/sbin/nginx -s stop >> "$LOG_FILE" 2>&1 || true
  /www/server/nginx/sbin/nginx >> "$LOG_FILE" 2>&1 || true
  success "Nginx 已重启"
}

# ---- 步骤7：部署后验证 ----
verify_deployment() {
  log "====== 步骤7：部署后验证 ======"
  
  local verify_pass=true
  
  # 验证1：登录页状态码
  log "验证1：登录页可访问..."
  sleep 3 # 等待服务启动
  local login_status
  login_status=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/login" || echo "000")
  if [ "$login_status" = "200" ]; then
    success "登录页返回 200"
  else
    error "登录页返回 $login_status"
    verify_pass=false
  fi
  
  # 验证2：未登录访问受保护页面应被拦截
  log "验证2：登录守卫拦截..."
  local home_redirect
  home_redirect=$(curl -s -o /dev/null -w "%{redirect_url}" --cookie "" "$SERVER_URL/home" || echo "ERROR")
  if echo "$home_redirect" | grep -q "login"; then
    success "未登录访问 /home → 重定向到登录页"
  else
    error "未登录访问 /home 未被拦截，重定向到: $home_redirect"
    verify_pass=false
  fi
  
  # 验证3：PM2 状态
  log "验证3：PM2 进程状态..."
  if pm2 status | grep -q "qunxiang-xinghuo"; then
    success "PM2 进程存在"
  else
    error "PM2 进程不存在"
    verify_pass=false
  fi
  
  # 验证4：登录页HTML源码检查
  log "验证4：登录页HTML内容检查..."
  local login_html
  login_html=$(curl -s "$SERVER_URL/login" | head -c 2000)
  if echo "$login_html" | grep -q "form\|input\|button"; then
    success "登录页包含表单元素"
  else
    error "登录页未找到表单元素"
    verify_pass=false
  fi
  
  if [ "$verify_pass" = true ]; then
    success "====== 所有验证通过 ======"
  else
    warn "====== 部分验证未通过，请检查日志 ======"
  fi
  
  return $([ "$verify_pass" = true ] && echo 0 || echo 1)
}

# =============================================================================
# 主流程
# =============================================================================

main() {
  log "====== 群像·星火 自动化部署开始 ======"
  
  backup_database
  fetch_code
  install_deps
  sync_database
  build_project
  restart_services
  verify_deployment
  
  log "====== 部署完成 ======"
  success "部署日志: $LOG_FILE"
}

# 执行主流程
main "$@"
