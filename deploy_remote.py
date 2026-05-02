#!/usr/bin/env python3
"""v5.3 生产模式诊断"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

def ssh_cmd(client, cmd, timeout=60):
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

    # 生产模式下 / 返回什么
    print("========== 生产模式 / 页面内容 ==========")
    ssh_cmd(client, f"curl -s http://localhost:3000/ | sed 's/<div/\\n<div/g' | head -30")
    
    print("\n========== 生产模式 /home 页面内容 ==========")
    ssh_cmd(client, f"curl -s http://localhost:3000/home | sed 's/<div/\\n<div/g' | head -30")
    
    # 检查PM2日志确认是否在production模式
    print("\n========== PM2日志 ==========")
    ssh_cmd(client, f"cat /root/.pm2/logs/qunxiang-xinghuo-out.log 2>/dev/null | tail -10")
    
    # 检查 Next.js 是否读取到 .next 目录
    print("\n========== .next目录检查 ==========")
    ssh_cmd(client, f"ls -la {DEPLOY_DIR}/.next/")
    ssh_cmd(client, f"cat {DEPLOY_DIR}/.next/BUILD_ID")
    ssh_cmd(client, f"ls {DEPLOY_DIR}/.next/server/pages/ 2>/dev/null")
    
    # 检查 Next.js app 路由文件
    print("\n========== App Router检查 ==========")
    ssh_cmd(client, f"ls {DEPLOY_DIR}/.next/server/app/ 2>/dev/null | head -20")
    
    # 直接用next start试一下（不用server.ts）
    print("\n========== 测试 next start ==========")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 delete qunxiang-xinghuo 2>/dev/null || true")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 start 'NODE_ENV=production npx next start -p 3000' --name qunxiang-xinghuo")
    ssh_cmd(client, f"sleep 5")
    ssh_cmd(client, f"curl -sI http://localhost:3000/_next/static/chunks/0gscbv2oo_ix7.js 2>&1 | head -3")
    ssh_cmd(client, f"curl -s http://localhost:3000/ | grep -c '登录'")
    ssh_cmd(client, f"curl -s http://localhost:3000/home | grep -c 'bubble'")
    
    client.close()
    print("\n[diag] Done!")

if __name__ == "__main__":
    main()
