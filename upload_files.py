#!/usr/bin/env python3
"""SFTP直接上传v5.5修改的文件到服务器"""
import paramiko
import os

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"
LOCAL_DIR = r"C:\Users\Dell\qunxiang-xinghuo"

# v5.5修改的文件列表
FILES = [
    "src/app/globals.css",
    "src/components/layout/TopBar.tsx",
    "src/components/layout/BottomNav.tsx",
    "src/app/home/page.tsx",
    "src/app/story-hall/page.tsx",
    "src/app/story-hall/[storyId]/page.tsx",
    "src/app/duo-match/page.tsx",
    "src/app/duo-waiting/page.tsx",
    "src/app/library/page.tsx",
    "src/app/profile/page.tsx",
    "src/app/story/page.tsx",
    "src/components/story/CreateStoryModal.tsx",
    "src/components/story/ClaimRoleModal.tsx",
]

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    sftp = client.open_sftp()

    print("=" * 60)
    print("SFTP上传 v5.5 修改的文件")
    print("=" * 60)

    for filepath in FILES:
        local_path = os.path.join(LOCAL_DIR, filepath).replace("\\", "/")
        remote_path = f"{DEPLOY_DIR}/{filepath}"

        # 确保远程目录存在
        remote_dir = os.path.dirname(remote_path)
        try:
            sftp.mkdir(remote_dir)
        except IOError:
            pass  # 目录已存在

        print(f"\n上传: {filepath}")
        try:
            sftp.put(local_path, remote_path)
            print(f"  -> 成功")
        except Exception as e:
            print(f"  -> 失败: {e}")

    sftp.close()

    # 重新build
    print("\n" + "=" * 60)
    print("重新build...")
    print("=" * 60)

    stdin, stdout, stderr = client.exec_command(f"rm -rf {DEPLOY_DIR}/.next")
    stdout.channel.recv_exit_status()

    stdin, stdout, stderr = client.exec_command(f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out)
    if err.strip(): print(f"[err]\n{err}")

    # 重启
    print("\n重启PM2...")
    client.exec_command(f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    client.exec_command(f"cd {DEPLOY_DIR} && pm2 save")

    # 验证
    print("\n验证...")
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/home | wc -c")
    print("home bytes:", stdout.read().decode().strip())
    stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/story-hall | wc -c")
    print("story-hall bytes:", stdout.read().decode().strip())

    client.close()
    print("\n完成！")

if __name__ == "__main__":
    main()
