# 故障转移方案

## 概述
故障转移（Failover）是在主系统故障时自动切换到备用系统的机制，确保服务高可用。

## 当前状态
**单服务器架构** - 无故障转移

当前只有一台服务器，故障转移可在以下情况实施：
1. 用户量增长到单服务器无法承载
2. 业务关键性要求 99.9% 以上可用性
3. 团队扩大，需要更稳定的基础设施

---

## 1. 数据库故障转移

### 1.1 主从复制架构

```
主数据库 (Master) ← 写入操作
    ↓ 实时同步
从数据库 (Slave)  ← 读取操作
    ↓ 故障时提升
备用主数据库 (New Master)
```

### 1.2 SQLite 的局限性
SQLite 是文件数据库，**不支持原生主从复制**。

### 1.3 解决方案

#### 方案 A：定时备份 + 快速恢复（推荐）
```bash
# 备份脚本（每小时执行）
0 * * * * /home/ubuntu/qunxiang-xinghuo/scripts/backup-db.sh

# 恢复脚本
#!/bin/bash
# scripts/restore-db.sh
set -e

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
  echo "用法：./restore-db.sh <备份文件>"
  exit 1
fi

echo "⚠️  警告：即将恢复数据库，当前数据将被覆盖！"
read -p "确认恢复？(yes/no): " confirm

if [ "$confirm" = "yes" ]; then
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
  gunzip -c "$BACKUP_FILE" > prisma/dev.db
  echo "✅ 数据库恢复完成！"
  pm2 restart qunxiang-xinghuo
else
  echo "❌ 恢复已取消"
fi
```

#### 方案 B：迁移到 PostgreSQL（长期方案）
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres-master:
    image: postgres:15
    environment:
      POSTGRES_DB: qunxiangxinghuo
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-master-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  postgres-slave:
    image: postgres:15
    environment:
      POSTGRES_DB: qunxiangxinghuo
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-slave-data:/var/lib/postgresql/data
    depends_on:
      - postgres-master
```

---

## 2. 应用层故障转移

### 2.1 多实例部署

```
负载均衡器 (Nginx/HAProxy)
    ↓
─────────────┬─────────────┐
│  实例 1      │  实例 2      │
│  (主)        │  (备)        │
│  localhost   │  localhost   │
│  :3000       │  :3001       │
└─────────────┴─────────────┘
    ↓               ↓
共享数据库
```

### 2.2 PM2 集群模式

```bash
# 使用 PM2 集群模式（多进程）
pm2 start pnpm --name "qunxiang-xinghuo" -i max -- start

# -i max 表示使用所有 CPU 核心
```

### 2.3 健康检查

```bash
#!/bin/bash
# scripts/health-check.sh

URL="http://localhost:3000"
TIMEOUT=5

response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $URL)

if [ "$response" = "200" ]; then
  echo "✅ 服务正常"
  exit 0
else
  echo "❌ 服务异常 (HTTP $response)"
  pm2 restart qunxiang-xinghuo
  # 发送告警通知
  curl -X POST "https://your-webhook-url" \
    -H "Content-Type: application/json" \
    -d '{"text":"⚠️ 服务异常，已自动重启"}'
  exit 1
fi
```

配置定时检查：
```bash
# 每 5 分钟检查一次
*/5 * * * * /home/ubuntu/qunxiang-xinghuo/scripts/health-check.sh >> /home/ubuntu/qunxiang-xinghuo/logs/health.log 2>&1
```

---

## 3. 服务器层故障转移

### 3.1 双服务器架构

```
DNS 轮询 / 负载均衡器
    ↓
┌─────────────┬─────────────┐
│  服务器 A    │  服务器 B    │
│  (主)        │  (备)        │
│  北京        │  上海        │
─────────────┴─────────────┘
```

### 3.2 自动故障检测

```bash
#!/bin/bash
# scripts/failover.sh

PRIMARY_SERVER="1.2.3.4"
BACKUP_SERVER="5.6.7.8"
CHECK_INTERVAL=60

while true; do
  if ping -c 1 -W 5 $PRIMARY_SERVER > /dev/null; then
    # 主服务器正常
    if [ $(grep -c "BACKUP" /etc/nginx/nginx.conf) -gt 0 ]; then
      echo "主服务器恢复，切换回主服务器"
      # 切换回主服务器
      cp /etc/nginx/nginx.conf.primary /etc/nginx/nginx.conf
      nginx -s reload
    fi
  else
    # 主服务器故障
    if [ $(grep -c "PRIMARY" /etc/nginx/nginx.conf) -gt 0 ]; then
      echo "主服务器故障，切换到备用服务器"
      # 切换到备用服务器
      cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
      nginx -s reload
      # 发送告警
      curl -X POST "https://your-webhook-url" \
        -H "Content-Type: application/json" \
        -d '{"text":"🚨 主服务器故障，已切换到备用服务器"}'
    fi
  fi
  sleep $CHECK_INTERVAL
done
```

---

## 4. 网络层故障转移

### 4.1 CDN 加速
使用 CDN（如阿里云 CDN、Cloudflare）：
- 静态资源缓存到全球节点
- 源站故障时显示缓存页面
- DDoS 防护

### 4.2 DNS 故障转移
```
DNS 记录：
A 记录：qunxiangxinghuo.cn → 1.2.3.4 (主)
A 记录：qunxiangxinghuo.cn → 5.6.7.8 (备)

健康检查：每 60 秒检测一次
故障切换：自动移除故障 IP
```

---

## 5. 监控告警

### 5.1 基础监控

```bash
#!/bin/bash
# scripts/monitor.sh

# CPU 使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')

# 内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf("%.2f"), $3/$2 * 100.0}')

# 磁盘使用率
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

echo "CPU: ${CPU_USAGE}%"
echo "内存：${MEM_USAGE}%"
echo "磁盘：${DISK_USAGE}%"

# 告警阈值
if (( $(echo "$CPU_USAGE > 90" | bc -l) )); then
  echo "⚠️  CPU 使用率过高！"
  # 发送告警
fi

if (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
  echo "⚠️  内存使用率过高！"
  # 发送告警
fi

if [ "$DISK_USAGE" -gt 90 ]; then
  echo "⚠️  磁盘使用率过高！"
  # 发送告警
fi
```

### 5.2 第三方监控服务
- **UptimeRobot** - 免费网站监控
- **Pingdom** - 专业性能监控
- **New Relic** - 应用性能管理

---

## 6. 灾难恢复计划

### 6.1 数据备份策略
- **实时备份**：每小时自动备份
- **异地备份**：每天同步到云存储
- **版本保留**：保留最近 30 天的备份

### 6.2 恢复时间目标 (RTO)
- **数据库恢复**：< 30 分钟
- **应用恢复**：< 10 分钟
- **完全恢复**：< 1 小时

### 6.3 恢复点目标 (RPO)
- **数据丢失**：< 1 小时

### 6.4 恢复流程

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

echo " 开始灾难恢复..."

# 1. 停止服务
pm2 stop qunxiang-xinghuo

# 2. 恢复数据库
LATEST_BACKUP=$(ls -t backups/*.db.gz | head -1)
echo "恢复数据库：$LATEST_BACKUP"
gunzip -c "$LATEST_BACKUP" > prisma/dev.db

# 3. 恢复代码
git pull origin main
pnpm install
pnpm prisma generate
pnpm build

# 4. 启动服务
pm2 start qunxiang-xinghuo

echo "✅ 灾难恢复完成！"
```

---

## 7. 实施建议

### 阶段 1：基础备份（当前已实施）
- ✅ 定时数据库备份
- ✅ 代码版本控制
- ✅ 环境变量管理

### 阶段 2：监控告警（建议实施）
- 健康检查脚本
- 资源监控
- 异常告警

### 阶段 3：高可用架构（用户量增长后）
- 多实例部署
- 负载均衡
- 数据库主从复制

### 阶段 4：异地容灾（业务关键时）
- 双服务器部署
- 自动故障切换
- CDN 加速

---

## 当前推荐方案

**对于当前阶段（单服务器、用户量少）：**

1. **继续使用时定备份** - 已实施
2. **添加健康检查** - 简单有效
3. **监控资源使用** - 预防问题
4. **定期演练恢复** - 确保备份可用

**不建议现在实施：**
- ❌ 多服务器部署（成本高）
-  数据库主从复制（SQLite 不支持）
- ❌ 自动故障切换（复杂度高）

---

## 总结

故障转移方案需要根据业务规模和预算逐步实施。当前阶段重点是：
1. **数据备份** - 防止数据丢失
2. **健康监控** - 及时发现问题
3. **快速恢复** - 减少停机时间

当用户量增长到一定程度，再考虑高可用架构和自动故障切换。
