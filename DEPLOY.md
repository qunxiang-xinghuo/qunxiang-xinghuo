# 群像·星火 — 腾讯云服务器部署指南

## 一、服务器要求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| 操作系统 | Ubuntu 22.04 / CentOS 8 | Ubuntu 22.04 LTS |
| CPU | 2 核 | 2 核+ |
| 内存 | 2 GB | 4 GB+ |
| 磁盘 | 20 GB | 40 GB+ SSD |
| 带宽 | 1 Mbps | 5 Mbps+ |

---

## 二、服务器环境初始化

### 2.1 SSH 登录服务器

```bash
ssh root@你的服务器IP
```

### 2.2 系统更新

```bash
apt update && apt upgrade -y    # Ubuntu
# 或
yum update -y                    # CentOS
```

### 2.3 安装 Node.js 20+

```bash
# 使用 NodeSource 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证
node -v   # 应显示 v20.x.x
npm -v
```

### 2.4 安装 pnpm

```bash
npm install -g pnpm
pnpm -v
```

### 2.5 安装 PM2（进程管理）

```bash
npm install -g pm2
pm2 -v
```

### 2.6 安装 Nginx（反向代理）

```bash
apt install -y nginx    # Ubuntu
# 或
yum install -y nginx    # CentOS

systemctl start nginx
systemctl enable nginx
```

### 2.7 安装 Git

```bash
apt install -y git    # Ubuntu
# 或
yum install -y git    # CentOS
```

### 2.8 安装编译工具（better-sqlite3 需要）

```bash
apt install -y build-essential python3    # Ubuntu
# 或
yum groupinstall -y "Development Tools" && yum install -y python3    # CentOS
```

---

## 三、部署项目

### 方式 A：从 GitHub 拉取（推荐）

```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆仓库
git clone https://github.com/qunxiang-xinghuo/qunxiang-xinghuo.git
cd qunxiang-xinghuo
```

### 方式 B：上传部署包

```bash
# 在本地执行上传
scp qunxiang-xinghuo-latest.tar.gz root@你的服务器IP:/var/www/

# 在服务器上解压
cd /var/www
mkdir -p qunxiang-xinghuo
cd qunxiang-xinghuo
tar -xzf ../qunxiang-xinghuo-latest.tar.gz
```

### 3.1 安装依赖

```bash
cd /var/www/qunxiang-xinghuo
pnpm install
```

### 3.2 配置环境变量

```bash
cat > .env << 'EOF'
# 数据库（使用绝对路径）
DATABASE_URL="file:/var/www/qunxiang-xinghuo/prisma/dev.db"

# NextAuth（必须设置，用于加密 session）
AUTH_SECRET="这里替换为随机字符串-至少32位"
NEXTAUTH_URL="https://qunxiangxinghuo.cn"

# AI 模型（可选，不配置则 AI 功能不可用）
# DOUBAO_API_KEY="your-doubao-api-key"

# 知乎 API（可选）
# ZHIHU_API_KEY="your-zhihu-api-key"
EOF
```

生成 AUTH_SECRET 的方法：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3.3 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 创建数据库表结构
pnpm prisma db push
```

### 3.4 构建生产版本

```bash
pnpm build
```

### 3.5 启动服务

```bash
# 使用 PM2 启动（推荐，支持自动重启、日志管理）
PORT=5000 pm2 start pnpm --name "qunxiang-xinghuo" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 3.6 验证服务

```bash
# 检查进程状态
pm2 status

# 查看日志
pm2 logs qunxiang-xinghuo --lines 20

# 测试本地访问
curl http://localhost:5000
```

---

## 四、配置 Nginx 反向代理

### 4.1 创建 Nginx 配置

```bash
cat > /etc/nginx/sites-available/qunxiangxinghuo.cn << 'EOF'
server {
    listen 80;
    server_name qunxiangxinghuo.cn www.qunxiangxinghuo.cn;

    # 图片等静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # 所有请求代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # 上传文件大小限制
    client_max_body_size 20M;
}
EOF
```

### 4.2 启用配置

```bash
# 创建软链接
ln -sf /etc/nginx/sites-available/qunxiangxinghuo.cn /etc/nginx/sites-enabled/

# 删除默认配置（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

## 五、配置域名解析

### 5.1 在腾讯云 DNS 控制台添加解析

登录 [腾讯云 DNS 控制台](https://console.cloud.tencent.com/cns)，为 `qunxiangxinghuo.cn` 添加以下记录：

| 主机记录 | 记录类型 | 记录值 | TTL |
|---------|---------|--------|-----|
| @ | A | 你的服务器IP | 600 |
| www | A | 你的服务器IP | 600 |

### 5.2 验证解析生效

```bash
# 等待 5-10 分钟后，在本地执行
ping qunxiangxinghuo.cn
# 应返回你的服务器 IP
```

---

## 六、配置 HTTPS（SSL 证书）

### 6.1 安装 Certbot

```bash
apt install -y certbot python3-certbot-nginx    # Ubuntu
# 或
yum install -y certbot python3-certbot-nginx    # CentOS
```

### 6.2 申请免费 SSL 证书

```bash
certbot --nginx -d qunxiangxinghuo.cn -d www.qunxiangxinghuo.cn
```

按提示操作：
- 输入邮箱（用于证书到期提醒）
- 同意服务条款
- 选择是否重定向 HTTP → HTTPS（建议选 2 - Redirect）

### 6.3 自动续期

```bash
# 测试续期
certbot renew --dry-run

# Certbot 会自动设置定时任务，证书到期前自动续期
```

---

## 七、配置防火墙

### 7.1 服务器防火墙（ufw）

```bash
# Ubuntu
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
ufw status
```

### 7.2 腾讯云安全组

登录 [腾讯云控制台](https://console.cloud.tencent.com/) → 云服务器 → 安全组，确保以下端口放行：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP |
| TCP | 443 | 0.0.0.0/0 | HTTPS |

---

## 八、验证部署

完成以上所有步骤后：

1. 浏览器访问 `https://qunxiangxinghuo.cn`
2. 应该看到和沙箱一样的首页（水彩风格IP视觉 + 剧场感landing）
3. 测试以下功能：
   - 场景库浏览
   - 故事阅读
   - 用户注册/登录
   - 单人角色扮演
   - 双人创作房间

---

## 九、日常运维

### 更新代码

```bash
cd /var/www/qunxiang-xinghuo

# 拉取最新代码
git pull origin main

# 安装新依赖（如有）
pnpm install

# 重新生成 Prisma 客户端
pnpm prisma generate

# 重新构建
pnpm build

# 重启服务
pm2 restart qunxiang-xinghuo
```

### 查看日志

```bash
# 应用日志
pm2 logs qunxiang-xinghuo

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 备份数据库

```bash
# 手动备份
cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d)

# 或设置定时任务（每天凌晨 3 点备份）
echo "0 3 * * * cp /var/www/qunxiang-xinghuo/prisma/dev.db /var/www/qunxiang-xinghuo/prisma/dev.db.backup-\$(date +\%Y\%m\%d)" | crontab -
```

### 监控服务

```bash
# 查看 PM2 进程状态
pm2 status

# 查看资源占用
pm2 monit

# 设置 PM2 自动重启（崩溃恢复）
pm2 set qunxiang-xinghuo:autorestart true
```

---

## 十、常见问题排查

### 页面打不开

```bash
# 1. 检查服务是否在运行
pm2 status

# 2. 检查端口是否监听
ss -tlnp | grep 5000

# 3. 检查 Nginx 是否运行
systemctl status nginx

# 4. 检查防火墙
ufw status
```

### 502 Bad Gateway

```bash
# 应用未启动或崩溃
pm2 logs qunxiang-xinghuo --lines 50

# 重启应用
pm2 restart qunxiang-xinghuo
```

### 数据库错误

```bash
# 检查数据库文件是否存在
ls -la prisma/dev.db

# 重新初始化
rm -f prisma/dev.db
pnpm prisma generate
pnpm prisma db push
```

### 构建失败 PrismaClient 类型错误

```bash
# 确保在 build 前执行了 prisma generate
pnpm prisma generate
pnpm build
```
