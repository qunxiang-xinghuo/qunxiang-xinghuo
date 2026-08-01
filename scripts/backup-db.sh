#!/bin/bash

# 数据库备份脚本
# 用于定期备份 SQLite 数据库

set -e

# 配置
BACKUP_DIR="./backups"
DB_FILE="./prisma/dev.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dev_db_$DATE.db"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 检查数据库文件是否存在
if [ ! -f "$DB_FILE" ]; then
    echo "错误: 数据库文件不存在: $DB_FILE"
    exit 1
fi

# 备份数据库
echo "开始备份数据库..."
cp "$DB_FILE" "$BACKUP_FILE"

# 压缩备份文件
gzip "$BACKUP_FILE"

# 显示备份信息
echo "备份完成: ${BACKUP_FILE}.gz"
ls -lh "${BACKUP_FILE}.gz"

# 保留最近 7 天的备份
echo "清理旧备份..."
find "$BACKUP_DIR" -name "dev_db_*.db.gz" -mtime +7 -delete

echo "备份任务完成"
