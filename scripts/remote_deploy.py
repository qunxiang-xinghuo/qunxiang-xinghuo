#!/usr/bin/env python3
"""Remote deploy via paramiko: SFTP upload + SSH build"""

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
    ("src/server/match-engine.ts", "src/server/match-engine.ts"),
    ("src/server/room-manager.ts", "src/server/room-manager.ts"),
    ("src/components/bubble-cloud/BubbleCloud.tsx", "src/components/bubble-cloud/BubbleCloud.tsx"),
    ("src/app/api/rooms/[roomId]/vote/[voteId]/cast/route.ts", "src/app/api/rooms/[roomId]/vote/[voteId]/cast/route.ts"),
    ("src/app/api/rooms/[roomId]/vote/[voteId]/resolve/route.ts", "src/app/api/rooms/[roomId]/vote/[voteId]/resolve/route.ts"),
]

def run_command(ssh, command, timeout=300):
    print(f"\n>>> {command}")
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    for line in iter(stdout.readline, ''):
        if line:
            print(line, end='')
    err = stderr.read().decode()
    if err:
        print(f"[STDERR] {err}", file=sys.stderr)
    exit_code = stdout.channel.recv_exit_status()
    print(f"[EXIT CODE: {exit_code}]")
    return exit_code

def sftp_upload(sftp, local_path, remote_path):
    full_remote = f"{REMOTE_DIR}/{remote_path}"
    remote_dir = os.path.dirname(full_remote)
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass
    print(f"  Upload: {local_path} -> {remote_path}")
    sftp.put(local_path, full_remote)

def main():
    print("=" * 60)
    print("  Qunxiang Xinghuo Remote Deploy (SFTP + Build)")
    print("=" * 60)
    
    print("\n[1/5] Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD, timeout=15)
    print("[OK] SSH connected")
    
    try:
        print("\n[2/5] Uploading modified files via SFTP...")
        sftp = ssh.open_sftp()
        for local, remote in FILES_TO_UPLOAD:
            sftp_upload(sftp, local, remote)
        sftp.close()
        print("[OK] All files uploaded")
        
        print("\n[3/5] Building project...")
        exit_code = run_command(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=300)
        if exit_code != 0:
            print("[ERROR] Build failed!")
            return 1
        print("[OK] Build successful")
        
        print("\n[4/5] Copying static files...")
        run_command(ssh, f"cd {REMOTE_DIR} && cp -r .next/static .next/standalone/.next/", timeout=30)
        print("[OK] Static files copied")
        
        print("\n[5/5] Restarting PM2...")
        run_command(ssh, f"cd {REMOTE_DIR} && pm2 restart qunxiang-xinghuo", timeout=30)
        
        print("\n[CHECK] PM2 status...")
        run_command(ssh, "pm2 list", timeout=10)
        
        print("\n" + "=" * 60)
        print("  Deploy complete!")
        print("=" * 60)
        return 0
        
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
