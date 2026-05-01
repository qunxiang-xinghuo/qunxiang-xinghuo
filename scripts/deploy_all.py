#!/usr/bin/env python3
"""Full deploy: upload ALL modified files + build + restart"""
import paramiko, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST, PORT, USER, PASS = "81.70.59.228", 22, "root", "F!D)7n_mc8Mq}bx="
REMOTE = "/www/wwwroot/qunxiang-xinghuo"

# All files that need to be updated
FILES = [
    # Core pages
    ("src/app/page.tsx", "src/app/page.tsx"),
    ("src/app/login/page.tsx", "src/app/login/page.tsx"),
    ("src/app/login/LoginForm.tsx", "src/app/login/LoginForm.tsx"),
    ("src/app/register/page.tsx", "src/app/register/page.tsx"),
    ("src/app/duo-match/page.tsx", "src/app/duo-match/page.tsx"),
    ("src/app/duo-waiting/page.tsx", "src/app/duo-waiting/page.tsx"),
    ("src/app/duo-timeout/page.tsx", "src/app/duo-timeout/page.tsx"),
    ("src/app/layout.tsx", "src/app/layout.tsx"),
    # Components
    ("src/components/bubble-cloud/Bubble.tsx", "src/components/bubble-cloud/Bubble.tsx"),
    ("src/components/bubble-cloud/BubbleCloud.tsx", "src/components/bubble-cloud/BubbleCloud.tsx"),
    ("src/components/bubble-cloud/BubbleDetailModal.tsx", "src/components/bubble-cloud/BubbleDetailModal.tsx"),
    ("src/components/match/DuoIdentityModal.tsx", "src/components/match/DuoIdentityModal.tsx"),
    # Server
    ("src/server/match-engine.ts", "src/server/match-engine.ts"),
    ("src/server/room-manager.ts", "src/server/room-manager.ts"),
    # Auth
    ("src/lib/auth.ts", "src/lib/auth.ts"),
    # API
    ("src/app/api/auth/register/route.ts", "src/app/api/auth/register/route.ts"),
    ("src/app/api/auth/[...nextauth]/route.ts", "src/app/api/auth/[...nextauth]/route.ts"),
    ("src/app/api/match/route.ts", "src/app/api/match/route.ts"),
    ("src/app/api/rooms/ai/route.ts", "src/app/api/rooms/ai/route.ts"),
    # Validators
    ("src/lib/validators/match.ts", "src/lib/validators/match.ts"),
    # Prisma
    ("prisma/schema.prisma", "prisma/schema.prisma"),
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
    if os.path.exists(local):
        print(f'  UP: {local}')
        sftp.put(local, full)
    else:
        print(f'  SKIP: {local} (not found)')

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    try:
        print("[1/6] Uploading all files...")
        sftp = ssh.open_sftp()
        for local, remote in FILES:
            upload(sftp, local, remote)
        sftp.close()
        print("[OK] Uploaded")

        print("\n[2/6] Remove old (auth) pages...")
        run(ssh, f"cd {REMOTE} && rm -rf src/app/'(auth)'/login src/app/'(auth)'/register", 10)

        print("\n[3/6] Prisma db push...")
        run(ssh, f"cd {REMOTE} && npx prisma db push --accept-data-loss", 120)

        print("\n[4/6] Prisma generate...")
        run(ssh, f"cd {REMOTE} && npx prisma generate", 60)

        print("\n[5/6] Build...")
        code = run(ssh, f"cd {REMOTE} && npm run build", 300)
        if code != 0:
            print("[ERROR] Build failed")
            return 1

        print("\n[6/6] Copy static + restart...")
        run(ssh, f"cd {REMOTE} && cp -r .next/static .next/standalone/.next/")
        run(ssh, f"cd {REMOTE} && pm2 restart qunxiang-xinghuo")
        run(ssh, "pm2 list", 10)
        print("\n[OK] Deploy complete")
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
