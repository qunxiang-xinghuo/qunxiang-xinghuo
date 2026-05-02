#!/usr/bin/env python3
"""强制重新build并验证"""
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
    print("强制重新build v5.4")
    print("=" * 60)

    # 1. 强制删除 .next 目录
    print("\n[1/5] 强制删除 .next 目录...")
    ssh_cmd(client, f"rm -rf {DEPLOY_DIR}/.next")

    # 2. 确认Git版本
    print("\n[2/5] 确认Git版本...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git log --oneline -1")

    # 3. 重新build
    print("\n[3/5] 重新build...")
    code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
    if code != 0:
        print("\n[ERROR] Build 失败！")
        client.close()
        sys.exit(1)

    # 4. 检查新的BUILD_ID
    print("\n[4/5] 检查新的BUILD_ID...")
    ssh_cmd(client, f"cat {DEPLOY_DIR}/.next/BUILD_ID")
    ssh_cmd(client, f"stat {DEPLOY_DIR}/.next/BUILD_ID | grep Modify")

    # 5. 重启PM2
    print("\n[5/5] 重启PM2...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")
    time.sleep(5)

    # 验证
    print("\n=== 验证 ===")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | grep -c 'approved' || echo 0")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | grep -c '待认领' || echo 0")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | grep -c '审核中' || echo 0")
    ssh_cmd(client, "JS=$(ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 | sed 's|.*/chunks/||') && curl -sI -o /dev/null -w '%{http_code}' http://localhost:3000/_next/static/chunks/$JS")

    client.close()
    print("\n=== 完成 ===")

if __name__ == "__main__":
    main()
