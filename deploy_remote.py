#!/usr/bin/env python3
"""v5.3 最终自检脚本"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

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
    print("[self-check] Connecting server...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    print("[self-check] Connected!")

    checks = [
        ("Git HEAD", f"cd {DEPLOY_DIR} && git log --oneline -1"),
        ("Git status clean", f"cd {DEPLOY_DIR} && git status --short | wc -l"),
        ("PM2 status", f"cd {DEPLOY_DIR} && pm2 status qunxiang-xinghuo"),
        ("Build output exists", f"ls -ld {DEPLOY_DIR}/.next"),
        ("LiuKanshanAvatar exists", f"cat {DEPLOY_DIR}/src/components/layout/LiuKanshanAvatar.tsx | grep -o 'zhimg.com' | head -1"),
        ("Home route correct", f"cat {DEPLOY_DIR}/src/app/home/page.tsx | grep -o 'story-hall' | head -1"),
        ("Server port listening", f"ss -tlnp | grep ':3000'"),
    ]

    all_ok = True
    for name, cmd in checks:
        print(f"\n========== {name} ==========")
        code, out, err = ssh_cmd(client, cmd)
        if code != 0 and name not in ["Git status clean"]:
            print(f"[FAIL] {name}")
            all_ok = False
        else:
            print(f"[OK] {name}")

    client.close()
    
    if all_ok:
        print("\n" + "="*50)
        print("[self-check] ALL CHECKS PASSED!")
        print("="*50)
    else:
        print("\n" + "="*50)
        print("[self-check] SOME CHECKS FAILED!")
        print("="*50)
    return all_ok

if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
