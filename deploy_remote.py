#!/usr/bin/env python3
"""v5.3 远程部署脚本 - 修复编码问题"""
import paramiko
import sys
import io

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

# 修复Windows控制台GBK编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def ssh_cmd(client, cmd, timeout=30):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip(): print(out)
    if err.strip(): print(f"[err] {err}")
    return stdout.channel.recv_exit_status(), out, err

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[+] Connecting {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    print("[+] Connected!")

    # 确认代码已更新
    print("\n[+] Git status...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git log --oneline -3")
    
    # 安装依赖（如果需要）
    print("\n[+] Installing dependencies...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npm install 2>&1", timeout=180)
    
    # Build
    print("\n[+] Building...")
    code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && npm run build 2>&1", timeout=300)
    if code != 0:
        print("[!] BUILD FAILED!")
        client.close()
        return False
    
    # Restart
    print("\n[+] Restarting...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 status qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")
    
    client.close()
    print("\n[+] Deployment complete!")
    return True

if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
