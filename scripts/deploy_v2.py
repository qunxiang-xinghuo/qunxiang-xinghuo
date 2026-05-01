#!/usr/bin/env python3
"""Remote deploy v2: SFTP upload + schema push + build + restart"""

import paramiko
import sys
import io
import os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST = "81.70.59.228"
PORT = 22
USERNAME = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
REMOTE_DIR = "/www/wwwroot/qunxiang-xinghuo"

FILES_TO_UPLOAD = [
    ("prisma/schema.prisma", "prisma/schema.prisma"),
    ("src/server/match-engine.ts", "src/server/match-engine.ts"),
    ("src/server/room-manager.ts", "src/server/room-manager.ts"),
    ("src/app/duo-match/page.tsx", "src/app/duo-match/page.tsx"),
    ("src/app/duo-waiting/page.tsx", "src/app/duo-waiting/page.tsx"),
    ("src/components/bubble-cloud/BubbleDetailModal.tsx", "src/components/bubble-cloud/BubbleDetailModal.tsx"),
    ("src/lib/validators/match.ts", "src/lib/validators/match.ts"),
]

def run(ssh, cmd, timeout=300):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    for line in iter(stdout.readline, ''):
        if line:
            print(line, end='')
    err = stderr.read().decode()
    if err:
        print(f'[STDERR] {err}')
    code = stdout.channel.recv_exit_status()
    print(f'[EXIT: {code}]')
    return code

def sftp_upload(sftp, local, remote):
    full = f"{REMOTE_DIR}/{remote}"
    d = os.path.dirname(full)
    try:
        sftp.mkdir(d)
    except IOError:
        pass
    print(f'  Upload: {local} -> {remote}')
    sftp.put(local, full)

def main():
    print("=" * 60)
    print("  Deploy v2: Schema + Build + Restart")
    print("=" * 60)

    print("\n[1/6] Connecting...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD, timeout=15)
    print("[OK] Connected")

    try:
        print("\n[2/6] Uploading files...")
        sftp = ssh.open_sftp()
        for local, remote in FILES_TO_UPLOAD:
            sftp_upload(sftp, local, remote)
        sftp.close()
        print("[OK] Uploaded")

        print("\n[3/6] Prisma db push...")
        run(ssh, f"cd {REMOTE_DIR} && npx prisma db push --accept-data-loss", timeout=120)

        print("\n[4/6] Building...")
        code = run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=300)
        if code != 0:
            print("[ERROR] Build failed!")
            return 1
        print("[OK] Built")

        print("\n[5/6] Copying static...")
        run(ssh, f"cd {REMOTE_DIR} && cp -r .next/static .next/standalone/.next/")
        print("[OK] Copied")

        print("\n[6/6] Restarting PM2...")
        run(ssh, f"cd {REMOTE_DIR} && pm2 restart qunxiang-xinghuo")

        print("\n[CHECK] PM2 status...")
        run(ssh, "pm2 list", timeout=10)

        print("\n" + "=" * 60)
        print("  Deploy complete!")
        print("=" * 60)
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
