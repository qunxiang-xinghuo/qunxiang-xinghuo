#!/usr/bin/env python3
"""v5.4 生产环境一键部署脚本"""
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

def ssh_cmd(client, cmd, timeout=120):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip(): print(f"[out]\n{out}")
    if err.strip(): print(f"[err]\n{err}")
    return stdout.channel.recv_exit_status(), out, err

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print("=" * 50)
    print("群像·星火 v5.4 生产环境部署")
    print("=" * 50)

    # 1. Git 强制同步
    print("\n[1/7] Git 强制同步...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git fetch origin dev")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git reset --hard origin/dev")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git clean -fd")

    # 2. 安装依赖
    print("\n[2/7] npm install...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npm install", timeout=180)

    # 3. Prisma 生成客户端 + 推送数据库变更
    print("\n[3/7] Prisma generate + db push...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma generate")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma db push")

    # 4. Build
    print("\n[4/7] npm run build...")
    code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
    if code != 0:
        print("\n[ERROR] Build 失败！")
        client.close()
        sys.exit(1)

    # 5. PM2 重启
    print("\n[5/7] PM2 重启...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")

    # 等待服务启动
    print("\n[6/7] 等待服务启动...")
    time.sleep(5)

    # 6. 验证
    print("\n[7/7] 部署验证...")

    # 6.1 检查静态资源
    code, out, _ = ssh_cmd(client, f"curl -sI -o /dev/null -w '%{{http_code}}' http://localhost:3000/_next/static/chunks/main.js")
    if "200" in out:
        print("[OK] 静态资源 /_next/static/chunks/main.js -> 200")
    else:
        print(f"[WARN] 静态资源返回: {out.strip()}")

    # 6.2 检查页面HTML
    code, out, _ = ssh_cmd(client, f"curl -s http://localhost:3000/home | grep -c 'bubble' || echo 0")
    if out.strip() != "0":
        print("[OK] /home 页面包含 'bubble' 关键词")
    else:
        print("[WARN] /home 页面可能空白")

    # 6.3 检查故事大厅API
    code, out, _ = ssh_cmd(client, f"curl -s http://localhost:3000/api/stories | grep -c 'success' || echo 0")
    if out.strip() != "0":
        print("[OK] /api/stories 返回 success")
    else:
        print("[WARN] /api/stories 可能异常")

    # 6.4 检查PM2状态
    ssh_cmd(client, f"pm2 status qunxiang-xinghuo")

    # 6.5 检查Build ID
    ssh_cmd(client, f"cat {DEPLOY_DIR}/.next/BUILD_ID")

    client.close()
    print("\n" + "=" * 50)
    print("部署完成！")
    print("=" * 50)

if __name__ == "__main__":
    main()
