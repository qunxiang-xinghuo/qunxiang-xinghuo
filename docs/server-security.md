# 服务器安全配置指南

## 1. 防火墙配置（UFW）

### 安装 UFW
```bash
sudo apt update
sudo apt install ufw
```

### 配置规则
```bash
# 允许 SSH（先配置，避免锁死）
sudo ufw allow 22/tcp

# 允许 HTTP
sudo ufw allow 80/tcp

# 允许 HTTPS
sudo ufw allow 443/tcp

# 允许 Node.js 应用端口（如果使用 Nginx 反向代理则不需要）
# sudo ufw allow 3000/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status verbose
```

### 限制 SSH 连接（防止暴力破解）
```bash
# 限制 SSH 连接频率：每 30 秒最多 3 次
sudo ufw limit 22/tcp
```

---

## 2. SSH 安全加固

### 禁用密码登录，使用密钥登录

1. **生成 SSH 密钥对**（在本地电脑执行）：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. **上传公钥到服务器**：
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@qunxiangxinghuo.cn
```

3. **修改 SSH 配置**（在服务器执行）：
```bash
sudo nano /etc/ssh/sshd_config
```

修改以下配置：
```
# 禁用密码登录
PasswordAuthentication no

# 禁用 root 登录（可选，建议创建普通用户）
PermitRootLogin no

# 禁用空密码
PermitEmptyPasswords no

# 限制登录用户（可选）
AllowUsers ubuntu
```

4. **重启 SSH 服务**：
```bash
sudo systemctl restart sshd
```

---

## 3. 自动安全更新

```bash
# 安装自动更新工具
sudo apt install unattended-upgrades

# 配置自动更新
sudo dpkg-reconfigure unattended-upgrades
```

---

## 4. 失败登录防护（Fail2Ban）

```bash
# 安装 Fail2Ban
sudo apt install fail2ban

# 启动服务
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 查看状态
sudo fail2ban-client status sshd
```

---

## 5. 数据库备份定时任务

### 添加 Cron 定时任务
```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3 点备份）
0 3 * * * /home/ubuntu/qunxiang-xinghuo/scripts/backup-db.sh >> /home/ubuntu/qunxiang-xinghuo/backups/backup.log 2>&1
```

### 手动测试备份脚本
```bash
cd /home/ubuntu/qunxiang-xinghuo
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

---

## 6. 日志监控

### 查看 SSH 登录日志
```bash
# 查看最近的登录记录
last -n 20

# 查看失败的登录尝试
grep "Failed password" /var/log/auth.log | tail -n 20

# 查看成功的登录
grep "Accepted" /var/log/auth.log | tail -n 20
```

### 查看应用日志
```bash
# PM2 日志
pm2 logs qunxiang-xinghuo --lines 100

# Nginx 访问日志
tail -n 100 /var/log/nginx/access.log

# Nginx 错误日志
tail -n 100 /var/log/nginx/error.log
```

---

## 7. 安全检查清单

- [ ] 防火墙已启用并配置规则
- [ ] SSH 已禁用密码登录
- [ ] SSH 已禁用 root 登录（或限制登录用户）
- [ ] 已配置 Fail2Ban
- [ ] 已配置自动安全更新
- [ ] 数据库备份脚本已测试
- [ ] Cron 定时备份已配置
- [ ] 日志监控已配置

---

## 8. 紧急恢复

### 如果 SSH 被锁死
1. 通过云服务商控制台登录（VNC/网页终端）
2. 修改 SSH 配置恢复访问

### 如果数据库损坏
```bash
# 从备份恢复
cd /home/ubuntu/qunxiang-xinghuo/backups
gunzip dev_backup_YYYYMMDD_HHMMSS.db.gz
cp dev_backup_YYYYMMDD_HHMMSS.db ../prisma/dev.db
pm2 restart qunxiang-xinghuo
```

---

## 9. 性能监控

### 安装监控工具
```bash
# 系统监控
sudo apt install htop

# 磁盘使用
df -h

# 内存使用
free -h

# 进程监控
pm2 monit
```

### 查看资源使用
```bash
# CPU 和内存
htop

# 磁盘 I/O
iotop

# 网络连接
ss -tuln
```
