#!/usr/bin/env python3
"""Full deploy: upload ALL modified files + build + restart"""
import paramiko, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

HOST, PORT, USER, PASS = "YOUR_SERVER_HOST", 22, 'YOUR_SERVER_USER', "YOUR_SERVER_PASSWORD"
REMOTE = "/path/to/remote/project"

FILES = [
    ("src/app/page.tsx", "src/app/page.tsx"),
    ("src/app/LoginForm.tsx", "src/app/LoginForm.tsx"),
    ("src/app/home/page.tsx", "src/app/home/page.tsx"),
    ("src/app/register/page.tsx", "src/app/register/page.tsx"),
    ("src/app/duo-match/page.tsx", "src/app/duo-match/page.tsx"),
    ("src/app/duo-waiting/page.tsx", "src/app/duo-waiting/page.tsx"),
    ("src/app/duo-timeout/page.tsx", "src/app/duo-timeout/page.tsx"),
    ("src/app/library/page.tsx", "src/app/library/page.tsx"),
    ("src/app/room/[id]/page.tsx", "src/app/room/[id]/page.tsx"),
    ("src/app/layout.tsx", "src/app/layout.tsx"),
    ("src/components/bubble-cloud/Bubble.tsx", "src/components/bubble-cloud/Bubble.tsx"),
    ("src/components/bubble-cloud/BubbleCloud.tsx", "src/components/bubble-cloud/BubbleCloud.tsx"),
    ("src/components/bubble-cloud/BubbleDetailModal.tsx", "src/components/bubble-cloud/BubbleDetailModal.tsx"),
    ("src/components/match/DuoIdentityModal.tsx", "src/components/match/DuoIdentityModal.tsx"),
    ("src/components/layout/BottomNav.tsx", "src/components/layout/BottomNav.tsx"),
    ("src/server/match-engine.ts", "src/server/match-engine.ts"),
    ("src/server/room-manager.ts", "src/server/room-manager.ts"),
    ("src/lib/auth.ts", "src/lib/auth.ts"),
    ("src/app/api/auth/register/route.ts", "src/app/api/auth/register/route.ts"),
    ("src/app/api/auth/[...nextauth]/route.ts", "src/app/api/auth/[...nextauth]/route.ts"),
    ("src/app/api/match/route.ts", "src/app/api/match/route.ts"),
    ("src/app/api/match/[matchId]/route.ts", "src/app/api/match/[matchId]/route.ts"),
    ("src/app/api/rooms/ai/route.ts", "src/app/api/rooms/ai/route.ts"),
    ("src/app/api/rooms/[roomId]/route.ts", "src/app/api/rooms/[roomId]/route.ts"),
    ("src/app/api/assets/route.ts", "src/app/api/assets/route.ts"),
    ("src/app/api/assets/public/route.ts", "src/app/api/assets/public/route.ts"),
    ("src/app/api/assets/[id]/route.ts", "src/app/api/assets/[id]/route.ts"),
    ("ProblemLog.md", "ProblemLog.md"),
    ("src/app/api/assets/[id]/public/route.ts", "src/app/api/assets/[id]/public/route.ts"),
    ("src/app/api/brainholes/bubble/route.ts", "src/app/api/brainholes/bubble/route.ts"),
    ("src/app/api/ai/chat/route.ts", "src/app/api/ai/chat/route.ts"),
    ("src/lib/validators/match.ts", "src/lib/validators/match.ts"),
    ("src/lib/bubble-client.ts", "src/lib/bubble-client.ts"),
    ("src/lib/bubble-engine.ts", "src/lib/bubble-engine.ts"),
    ("src/components/layout/MobileContainer.tsx", "src/components/layout/MobileContainer.tsx"),
    ("src/components/layout/LiuKanshanAvatar.tsx", "src/components/layout/LiuKanshanAvatar.tsx"),
    ("src/components/layout/LiuKanshanWelcome.tsx", "src/components/layout/LiuKanshanWelcome.tsx"),
    ("src/components/layout/BottomNav.tsx", "src/components/layout/BottomNav.tsx"),
    ("src/components/room/MessageBubble.tsx", "src/components/room/MessageBubble.tsx"),
    ("src/components/room/ChatRoom.tsx", "src/components/room/ChatRoom.tsx"),
    ("src/app/profile/page.tsx", "src/app/profile/page.tsx"),
    ("src/app/story/page.tsx", "src/app/story/page.tsx"),
    ("src/app/story-hall/page.tsx", "src/app/story-hall/page.tsx"),
    ("src/app/story-hall/[storyId]/page.tsx", "src/app/story-hall/[storyId]/page.tsx"),
    ("src/app/story-hall/[storyId]/room/page.tsx", "src/app/story-hall/[storyId]/room/page.tsx"),
    ("src/components/story/CreateStoryModal.tsx", "src/components/story/CreateStoryModal.tsx"),
    ("src/components/story/ClaimRoleModal.tsx", "src/components/story/ClaimRoleModal.tsx"),
    ("src/server/socket-handler.ts", "src/server/socket-handler.ts"),
    ("src/lib/ai/story-weaver.ts", "src/lib/ai/story-weaver.ts"),
    ("src/app/api/ai/story-weave/route.ts", "src/app/api/ai/story-weave/route.ts"),
    ("src/app/api/stories/route.ts", "src/app/api/stories/route.ts"),
    ("src/app/api/stories/[storyId]/route.ts", "src/app/api/stories/[storyId]/route.ts"),
    ("src/app/api/stories/[storyId]/roles/[roleId]/claim/route.ts", "src/app/api/stories/[storyId]/roles/[roleId]/claim/route.ts"),
    ("src/app/api/stories/[storyId]/messages/route.ts", "src/app/api/stories/[storyId]/messages/route.ts"),
    ("src/app/api/stories/[storyId]/pause/route.ts", "src/app/api/stories/[storyId]/pause/route.ts"),
    ("src/app/api/stories/[storyId]/resume/route.ts", "src/app/api/stories/[storyId]/resume/route.ts"),
    ("src/app/api/stories/[storyId]/branches/route.ts", "src/app/api/stories/[storyId]/branches/route.ts"),
    ("src/app/api/stories/[storyId]/branches/[branchId]/vote/route.ts", "src/app/api/stories/[storyId]/branches/[branchId]/vote/route.ts"),
    ("src/app/api/stories/[storyId]/inspirations/route.ts", "src/app/api/stories/[storyId]/inspirations/route.ts"),
    ("src/app/duo-match/page.tsx", "src/app/duo-match/page.tsx"),
    ("src/app/duo-waiting/page.tsx", "src/app/duo-waiting/page.tsx"),
    ("src/app/duo-timeout/page.tsx", "src/app/duo-timeout/page.tsx"),
    ("src/app/LoginForm.tsx", "src/app/LoginForm.tsx"),
    ("src/app/register/page.tsx", "src/app/register/page.tsx"),
    ("src/app/globals.css", "src/app/globals.css"),
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
    # 递归创建目录（paramiko mkdir不支持-p，我们用SSH执行mkdir -p）
    try:
        sftp.stat(d)
    except IOError:
        pass  # 目录不存在，后面会通过SSH创建
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
        print("[1/8] Creating directories...")
        dirs = set()
        for local, remote in FILES:
            d = os.path.dirname(f"{REMOTE}/{remote}")
            dirs.add(d)
        for d in sorted(dirs):
            run(ssh, f"mkdir -p '{d}'", 10)
        print("[OK] Directories created")

        print("\n[2/8] Uploading all files...")
        sftp = ssh.open_sftp()
        for local, remote in FILES:
            upload(sftp, local, remote)
        sftp.close()
        print("[OK] Uploaded")

        print("\n[3/8] Remove old login pages...")
        run(ssh, f"cd {REMOTE} && rm -rf src/app/login", 10)

        print("\n[4/8] Remove .next cache...")
        run(ssh, f"cd {REMOTE} && rm -rf .next", 10)

        print("\n[5/8] Prisma db push...")
        run(ssh, f"cd {REMOTE} && npx prisma db push --accept-data-loss", 120)

        print("\n[6/8] Prisma generate...")
        run(ssh, f"cd {REMOTE} && npx prisma generate", 60)

        print("\n[7/8] Build...")
        code = run(ssh, f"cd {REMOTE} && npm run build", 300)
        if code != 0:
            print("[ERROR] Build failed")
            return 1

        print("\n[8/8] Copy static + restart...")
        run(ssh, f"cd {REMOTE} && cp -r .next/static .next/standalone/.next/")
        run(ssh, f"cd {REMOTE} && pm2 restart qunxiang-xinghuo")
        run(ssh, "pm2 list", 10)
        print("\n[OK] Deploy complete")
        return 0
    finally:
        ssh.close()

if __name__ == "__main__":
    sys.exit(main())
