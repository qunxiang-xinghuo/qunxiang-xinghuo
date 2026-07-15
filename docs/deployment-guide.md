# 部署与安全配置指南

## 1. 服务器安全配置

### 1.1 防火墙配置（UFW）

```bash
# 安装 UFW
sudo apt update
sudo apt install ufw

# 允许 SSH（先配置，避免锁死）
sudo ufw allow 22/tcp

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 限制 SSH 连接频率（防止暴力破解）
sudo ufw limit 22/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status verbose
```

### 1.2 SSH 安全加固

**生成 SSH 密钥对**（在本地电脑执行）：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**上传公钥到服务器**：
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@qunxiangxinghuo.cn
```

**修改 SSH 配置**（在服务器执行）：
```bash
sudo nano /etc/ssh/sshd_config
```

修改以下配置：
```
PasswordAuthentication no
PermitRootLogin no
PermitEmptyPasswords no
```

**重启 SSH 服务**：
```bash
sudo systemctl restart sshd
```

### 1.3 安装 Fail2Ban（防止暴力破解）

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 查看状态
sudo fail2ban-client status sshd
```

---

## 2. 数据库备份配置

### 2.1 测试备份脚本

```bash
cd /home/ubuntu/qunxiang-xinghuo
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

### 2.2 配置定时备份（Cron）

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3 点备份）
0 3 * * * /home/ubuntu/qunxiang-xinghuo/scripts/backup-db.sh >> /home/ubuntu/qunxiang-xinghuo/backups/backup.log 2>&1
```

### 2.3 手动恢复数据库

```bash
cd /home/ubuntu/qunxiang-xinghuo/backups
gunzip dev_backup_YYYYMMDD_HHMMSS.db.gz
cp dev_backup_YYYYMMDD_HHMMSS.db ../prisma/dev.db
pm2 restart qunxiang-xinghuo
```

---

## 3. 应用部署

### 3.1 从 Gitee 拉取代码

```bash
cd /home/ubuntu/qunxiang-xinghuo
git remote set-url origin https://gitee.com/eccentric-blaze/qunxiangxinghuo.git
git pull origin main
```

### 3.2 安装依赖并构建

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm build
```

### 3.3 配置环境变量

```bash
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
ZHIHU_API_KEY=your_zhihu_api_key
AUTH_SECRET="your-auth-secret-key"
NEXTAUTH_URL="https://qunxiangxinghuo.cn"
EOF
```

### 3.4 启动服务

```bash
pm2 restart qunxiang-xinghuo
```

---

## 4. 更新流程

以后每次更新代码：

```bash
cd /home/ubuntu/qunxiang-xinghuo
git pull origin main
pnpm install
pnpm prisma generate
pnpm build
pm2 restart qunxiang-xinghuo
```

---

## 5. 监控和日志

### 5.1 查看应用日志

```bash
pm2 logs qunxiang-xinghuo --lines 100
```

### 5.2 查看系统资源

```bash
# CPU 和内存
htop

# 磁盘使用
df -h

# 内存使用
free -h
```

### 5.3 查看备份日志

```bash
tail -n 50 /home/ubuntu/qunxiang-xinghuo/backups/backup.log
```

---

## 6. 安全检查清单

- [ ] 防火墙已启用并配置规则
- [ ] SSH 已禁用密码登录
- [ ] SSH 已禁用 root 登录
- [ ] 已配置 Fail2Ban
- [ ] 数据库备份脚本已测试
- [ ] Cron 定时备份已配置
- [ ] 环境变量已正确配置
- [ ] 服务已正常启动

---

## 7. 紧急恢复

### 7.1 如果 SSH 被锁死
1. 通过云服务商控制台登录（VNC/网页终端）
2. 修改 SSH 配置恢复访问

### 7.2 如果数据库损坏
```bash
cd /home/ubuntu/qunxiang-xinghuo/backups
gunzip dev_backup_YYYYMMDD_HHMMSS.db.gz
cp dev_backup_YYYYMMDD_HHMMSS.db ../prisma/dev.db
pm2 restart qunxiang-xinghuo
```

### 7.3 如果服务崩溃
```bash
pm2 logs qunxiang-xinghuo --lines 100
pm2 restart qunxiang-xinghuo
```
