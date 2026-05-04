#!/usr/bin/env python3
"""Final deploy: git pull + generate + build + restart"""
import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST, PORT, USER, PASS = "YOUR_SERVER_HOST", 22, 'YOUR_SERVER_USER', "YOUR_SERVER_PASSWORD"
REMOTE = "/path/to/remote/project"

def run(ssh, cmd, t=300):
    print(f'\n>>> {cmd}')
    _, out, err = ssh.exec_command(cmd, timeout=t)
    for line in iter(out.readline, ''):
        if line: print(line, end='')
    e = err.read().decode()
    if e: print(f'[STDERR] {e}')
    c = out.channel.recv_exit_status()
    print(f'[EXIT: {c}]')
    return c

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        print("[1/5] Git pull...")
        run(ssh, f"cd {REMOTE} && git pull origin dev", 60)

        print("\n[2/5] Prisma generate...")
        run(ssh, f"cd {REMOTE} && npx prisma generate", 60)

        print("\n[3/5] Build...")
        code = run(ssh, f"cd {REMOTE} && npm run build", 300)
        if code != 0:
            print("[ERROR] Build failed")
            return 1

        print("\n[4/5] Copy static...")
        run(ssh, f"cd {REMOTE} && cp -r .next/static .next/standalone/.next/")

        print("\n[5/5] Restart PM2...")
        run(ssh, f"cd {REMOTE} && pm2 restart qunxiang-xinghuo")
        run(ssh, "pm2 list", 10)
        print("\n[OK] Deploy complete")
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
