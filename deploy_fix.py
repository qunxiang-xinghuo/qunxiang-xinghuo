#!/usr/bin/env python3
"""v5.5-fix 部署：上传server.ts + 重新build + 验证静态资源"""
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

def ssh_cmd(client, cmd, timeout=60):
    print(f">>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip(): print(f"[out]\n{out}")
    if err.strip(): print(f"[err]\n{err}")
    return stdout.channel.recv_exit_status(), out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

print("=" * 60)
print("v5.5-fix 部署：修复静态资源404")
print("=" * 60)

# 1. SFTP上传server.ts
print("\n[1/6] SFTP上传server.ts...")
sftp = client.open_sftp()
sftp.put(r"C:\Users\Dell\qunxiang-xinghuo\server.ts", f"{DEPLOY_DIR}/server.ts")
sftp.close()
print("  -> 上传成功")

# 2. 验证上传的server.ts
print("\n[2/6] 验证server.ts内容...")
ssh_cmd(client, f"grep 'replace.*_next' {DEPLOY_DIR}/server.ts")

# 3. 删除旧build
print("\n[3/6] 删除旧 .next 目录...")
ssh_cmd(client, f"rm -rf {DEPLOY_DIR}/.next")

# 4. 重新build
print("\n[4/6] 重新build...")
code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
if code != 0:
    print("\n[ERROR] Build 失败！")
    client.close()
    sys.exit(1)

# 5. 重启PM2
print("\n[5/6] 重启PM2...")
ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")
time.sleep(5)

# 6. 验证（最关键！）
print("\n[6/6] 验证静态资源...")
print("\n--- 测试JS文件 ---")
ssh_cmd(client, f"JS=$(ls {DEPLOY_DIR}/.next/static/chunks/*.js | head -1 | sed 's|{DEPLOY_DIR}/.next/static/chunks/||') && echo \"File: $JS\" && curl -sI http://81.70.59.228:3000/_next/static/chunks/$JS | head -3")

print("\n--- 测试CSS文件 ---")
ssh_cmd(client, f"CSS=$(ls {DEPLOY_DIR}/.next/static/css/*.css 2>/dev/null | head -1 | sed 's|{DEPLOY_DIR}/.next/static/css/||') && if [ -n \"$CSS\" ]; then echo \"File: $CSS\" && curl -sI http://81.70.59.228:3000/_next/static/css/$CSS | head -3; else echo 'no css'; fi")

print("\n--- 测试页面内容 ---")
ssh_cmd(client, "curl -s http://81.70.59.228:3000/home | grep -c 'slate' || echo 0")
ssh_cmd(client, "curl -s http://81.70.59.228:3000/story-hall | grep -c 'slate' || echo 0")

print("\n--- 测试泡泡API ---")
ssh_cmd(client, "curl -s http://81.70.59.228:3000/api/brainholes/bubble | grep -c 'success' || echo 0")

print("\n--- PM2状态 ---")
ssh_cmd(client, "pm2 status qunxiang-xinghuo | grep 'qunxiang'")

client.close()
print("\n" + "=" * 60)
print("部署完成！")
print("=" * 60)
