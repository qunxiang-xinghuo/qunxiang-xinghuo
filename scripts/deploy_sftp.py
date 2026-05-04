#!/usr/bin/env python3
"""Deploy via SFTP (avoid git pull timeout)"""
import paramiko, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST, PORT, USER, PASS = "YOUR_SERVER_HOST", 22, 'YOUR_SERVER_USER', "YOUR_SERVER_PASSWORD"
REMOTE = "/path/to/remote/project"

# v4.1 修改的文件 + 队友PR #2 新增的文件（确保服务器最新）
FILES = [
    # v4.1 核心修改
    ("src/app/page.tsx", "src/app/page.tsx"),
    ("src/app/duo-match/page.tsx", "src/app/duo-match/page.tsx"),
    ("src/app/duo-waiting/page.tsx", "src/app/duo-waiting/page.tsx"),
    ("src/components/match/DuoIdentityModal.tsx", "src/components/match/DuoIdentityModal.tsx"),
    ("docs/核心需求-v4.1.md", "docs/核心需求-v4.1.md"),
    ("docs/qunxiangxinhuo-TDD-v4.0.md", "docs/qunxiangxinhuo-TDD-v4.0.md"),
    # 队友PR #2 文件（确保服务器同步）
    ("src/app/zhihu-search/page.tsx", "src/app/zhihu-search/page.tsx"),
    ("src/app/zhihu-zhida/page.tsx", "src/app/zhihu-zhida/page.tsx"),
    ("src/app/api/zhihu/zhida/route.ts", "src/app/api/zhihu/zhida/route.ts"),
    ("src/lib/zhihu-dev-api.ts", "src/lib/zhihu-dev-api.ts"),
    ("docs/zhihu-api-guide.md", "docs/zhihu-api-guide.md"),
    ("docs/dev_log.md", "docs/dev_log.md"),
]

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

def upload(sftp, local, remote):
    full = f"{REMOTE}/{remote}"
    d = os.path.dirname(full)
    try:
        sftp.mkdir(d)
    except IOError:
        pass
    print(f'  {local} -> {remote}')
    sftp.put(local, full)

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        print("[1/4] Uploading files via SFTP...")
        sftp = ssh.open_sftp()
        for local, remote in FILES:
            if os.path.exists(local):
                upload(sftp, local, remote)
            else:
                print(f'  SKIP (not found): {local}')
        sftp.close()
        print("[OK] Uploaded")

        print("\n[2/4] Prisma generate...")
        run(ssh, f"cd {REMOTE} && npx prisma generate", 60)

        print("\n[3/4] Build...")
        code = run(ssh, f"cd {REMOTE} && npm run build", 300)
        if code != 0:
            print("[ERROR] Build failed")
            return 1

        print("\n[4/4] Copy static + restart...")
        run(ssh, f"cd {REMOTE} && cp -r .next/static .next/standalone/.next/")
        run(ssh, f"cd {REMOTE} && pm2 restart qunxiang-xinghuo")
        run(ssh, "pm2 list", 10)
        print("\n[OK] Deploy complete")
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
