#!/usr/bin/env python3
"""v5.5 生产环境一键部署脚本（强制重新build）"""
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

def ssh_cmd(client, cmd, timeout=300):
    print(f">>> {cmd}")
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

    print("=" * 60)
    print("群像·星火 v5.5 生产环境部署")
    print("=" * 60)

    # 1. Git 强制同步（单条命令，fetch+reset+clean）
    print("\n[1/8] Git 强制同步...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git fetch origin dev && git reset --hard origin/dev && git clean -fd", timeout=300)

    # 2. 安装依赖
    print("\n[2/8] npm install...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npm install", timeout=180)

    # 3. Prisma
    print("\n[3/8] Prisma generate + db push...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma generate")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma db push")

    # 4. 强制删除旧build
    print("\n[4/8] 强制删除旧 .next 目录...")
    ssh_cmd(client, f"rm -rf {DEPLOY_DIR}/.next")

    # 5. Build
    print("\n[5/8] npm run build...")
    code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
    if code != 0:
        print("\n[ERROR] Build 失败！")
        client.close()
        sys.exit(1)

    # 6. 验证BUILD时间
    print("\n[6/8] 验证Build时间...")
    ssh_cmd(client, f"stat {DEPLOY_DIR}/.next/BUILD_ID | grep Modify")
    ssh_cmd(client, f"cat {DEPLOY_DIR}/.next/BUILD_ID")

    # 7. PM2 重启
    print("\n[7/8] PM2 重启...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")
    time.sleep(5)

    # 8. 验证
    print("\n[8/8] 部署验证...")
    ssh_cmd(client, f"JS=$(ls {DEPLOY_DIR}/.next/static/chunks/*.js | head -1 | sed 's|{DEPLOY_DIR}/.next/static/chunks/||') && curl -sI -o /dev/null -w '%{{http_code}}' http://localhost:3000/_next/static/chunks/$JS && echo ' OK'")
    ssh_cmd(client, "curl -s http://localhost:3000/home | wc -c")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | wc -c")
    ssh_cmd(client, "curl -s http://localhost:3000/api/stories | grep -c 'success' || echo 0")
    ssh_cmd(client, "pm2 status qunxiang-xinghuo | grep -E 'name|qunxiang'")

    client.close()
    print("\n" + "=" * 60)
    print("部署完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()
