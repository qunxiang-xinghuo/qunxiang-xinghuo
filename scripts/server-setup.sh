#!/bin/bash
# 群像·星火 - 服务器初始化脚本
# 在 1Panel 终端中执行此脚本完成一次性配置

set -e

echo "========================================="
echo "  群像·星火 - 服务器初始化"
echo "========================================="

# 1. 创建网站目录
SITE_DIR="/opt/qunxiang-site"
sudo mkdir -p "$SITE_DIR"
echo "[OK] 网站目录已创建: $SITE_DIR"

# 2. 生成 SSH 密钥（用于 GitHub Actions 免密登录）
SSH_KEY_PATH="$HOME/.ssh/deploy_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N "" -C "github-actions-deploy"
    echo "[OK] SSH 密钥已生成"
else
    echo "[SKIP] SSH 密钥已存在"
fi

# 3. 添加公钥到授权列表
mkdir -p "$HOME/.ssh"
cat "$SSH_KEY_PATH.pub" >> "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"
echo "[OK] SSH 公钥已添加"

# 4. 显示私钥（需要复制到 GitHub Secrets）
echo ""
echo "========================================="
echo "  请复制下面的私钥内容（全部）"
echo "  到 GitHub → Settings → Secrets → SERVER_SSH_KEY"
echo "========================================="
echo ""
cat "$SSH_KEY_PATH"
echo ""
echo "========================================="
echo "  初始化完成！"
echo "========================================="
echo ""
echo "接下来需要做的事情："
echo "1. 复制上面的私钥内容"
echo "2. 打开 GitHub 仓库 → Settings → Secrets and variables → Actions"
echo "3. 添加以下 3 个 Secret："
echo "   - SERVER_HOST: 152.136.161.172"
echo "   - SERVER_USER: root"
echo "   - SERVER_SSH_KEY: (上面显示的私钥内容)"
echo ""
