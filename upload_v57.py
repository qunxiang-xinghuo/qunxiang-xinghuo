import paramiko, os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"
LOCAL_DIR = r"C:\Users\Dell\qunxiang-xinghuo"

FILES = [
    "src/components/bubble-cloud/Bubble.tsx",
    "src/components/bubble-cloud/BubbleCloud.tsx",
    "src/components/bubble-cloud/types.ts",
    "src/app/duo-waiting/page.tsx",
    "src/app/room/[id]/page.tsx",
    "src/components/room/ChatRoom.tsx",
    "src/components/room/MessageBubble.tsx",
    "src/app/home/page.tsx",
    "src/app/story-hall/page.tsx",
    "src/app/story-hall/[storyId]/page.tsx",
    "src/app/profile/page.tsx",
    "src/app/globals.css",
]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
sftp = client.open_sftp()

print("=" * 60)
print("SFTP上传 v5.7 修改的文件")
print("=" * 60)

for filepath in FILES:
    local_path = os.path.join(LOCAL_DIR, filepath).replace("\\", "/")
    remote_path = f"{DEPLOY_DIR}/{filepath}"
    remote_dir = os.path.dirname(remote_path)
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass
    sftp.put(local_path, remote_path)
    print(f"上传: {filepath} -> OK")

sftp.close()
client.close()
print("=" * 60)
print("上传完成")
