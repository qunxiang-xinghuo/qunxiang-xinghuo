#!/bin/bash

# ============================================
# 数据库定时备份脚本
# 适用于群像·星火项目
# ============================================

# 配置
PROJECT_DIR="/home/ubuntu/qunxiang-xinghuo"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_FILE="${PROJECT_DIR}/prisma/dev.db"
RETENTION_DAYS=30  # 保留 30 天的备份
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/dev_backup_${DATE}.db"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 检查数据库文件是否存在
if [ ! -f "${DB_FILE}" ]; then
  echo "❌ 数据库文件不存在：${DB_FILE}"
  exit 1
fi

# 执行备份
echo "🔄 开始备份数据库..."
cp "${DB_FILE}" "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ 备份成功：${BACKUP_FILE}"
  
  # 压缩备份文件
  gzip "${BACKUP_FILE}"
  echo "📦 压缩完成：${BACKUP_FILE}.gz"
  
  # 删除过期备份
  echo "🗑️  清理 ${RETENTION_DAYS} 天前的备份..."
  find "${BACKUP_DIR}" -name "dev_backup_*.db.gz" -mtime +${RETENTION_DAYS} -delete
  
  # 显示备份统计
  BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/dev_backup_*.db.gz 2>/dev/null | wc -l)
  BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
  
  echo "📊 备份统计："
  echo "   - 备份数量：${BACKUP_COUNT}"
  echo "   - 备份目录大小：${BACKUP_SIZE}"
  
  exit 0
else
  echo "❌ 备份失败"
  exit 1
fi
