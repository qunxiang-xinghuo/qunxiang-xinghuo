#!/usr/bin/env python3
"""v6.0 生产环境一键部署脚本（paramiko SSH密钥/密码认证）

使用方法:
    方式1: SSH密钥认证（优先）
        确保本地 ~/.ssh/id_ed25519 或 ~/.ssh/id_rsa 存在且服务器已授权
        python deploy_remote.py
    
    方式2: 密码认证（fallback）
        set DEPLOY_PASSWORD=你的密码
        python deploy_remote.py
    
    方式3: 运行时交互式输入密码
        python deploy_remote.py
        > 请输入服务器密码: 
"""
import paramiko
import sys
import io
import time
import os
import getpass

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"


def load_private_key():
    """尝试加载本地SSH私钥"""
    home = os.path.expanduser("~")
    key_paths = [
        os.path.join(home, ".ssh", "id_ed25519"),
        os.path.join(home, ".ssh", "id_rsa"),
    ]
    for path in key_paths:
        if os.path.exists(path):
            try:
                # 尝试 ed25519
                if path.endswith("ed25519"):
                    return paramiko.Ed25519Key.from_private_key_file(path)
                # 尝试 rsa
                return paramiko.RSAKey.from_private_key_file(path)
            except Exception as e:
                print(f"[密钥] 加载 {path} 失败: {e}")
    return None


def get_password():
    """从环境变量或交互式输入获取密码"""
    password = os.environ.get("DEPLOY_PASSWORD")
    if password:
        return password
    return getpass.getpass("> 请输入服务器密码: ")


def connect_server():
    """连接服务器：优先密钥认证，fallback密码认证"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # 方式1: 尝试SSH密钥认证
    pkey = load_private_key()
    if pkey:
        try:
            print("[连接] 尝试SSH密钥认证...")
            client.connect(HOST, username=USER, pkey=pkey, timeout=30, banner_timeout=30)
            print("[✓] SSH密钥认证成功")
            return client
        except Exception as e:
            print(f"[密钥] 认证失败: {e}")
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # 方式2: 密码认证
    try:
        password = get_password()
        print("[连接] 尝试密码认证...")
        client.connect(HOST, username=USER, password=password, timeout=30, banner_timeout=30)
        print("[✓] 密码认证成功")
        return client
    except Exception as e:
        print(f"[✗] 连接失败: {e}")
        print("[提示] 1) 确认SSH密钥已添加到服务器authorized_keys")
        print("       2) 或检查密码是否正确")
        print("       3) 或通过宝塔面板Web终端手动部署")
        sys.exit(1)


def ssh_cmd(client, cmd, timeout=300):
    """执行SSH命令并打印输出"""
    print(f">>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(f"[out]\n{out}")
    if err.strip():
        print(f"[err]\n{err}")
    return stdout.channel.recv_exit_status(), out, err


def verify_static_js(client):
    """验证静态JS文件可访问（生死线检查）"""
    print("\n[验证] 静态资源生死线检查...")
    code, out, err = ssh_cmd(client,
        f"JS=$(ls {DEPLOY_DIR}/.next/static/chunks/*.js | head -1 | sed 's|{DEPLOY_DIR}/.next/static/chunks/||') && "
        f"curl -sI -o /dev/null -w '%{{http_code}}' http://localhost:3000/_next/static/chunks/$JS",
        timeout=30)
    status = out.strip()
    if status == "200":
        print(f"[✓] 静态JS返回 200 OK")
        return True
    else:
        print(f"[✗] 静态JS返回 {status}，页面将空白！")
        return False


def main():
    print("=" * 60)
    print("群像·星火 v6.0 生产环境部署")
    print(f"服务器: {HOST}")
    print(f"分支: dev")
    print("=" * 60)

    # 连接服务器
    client = connect_server()

    # 1. Git强制同步
    print("\n[1/8] Git强制同步...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git fetch origin dev", timeout=120)
    ssh_cmd(client, f"cd {DEPLOY_DIR} && git reset --hard origin/dev && git clean -fd", timeout=60)

    # 2. 安装依赖
    print("\n[2/8] npm install...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npm install", timeout=180)

    # 3. Prisma
    print("\n[3/8] Prisma generate + db push...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma generate", timeout=60)
    ssh_cmd(client, f"cd {DEPLOY_DIR} && npx prisma db push", timeout=60)

    # 4. 删除旧build
    print("\n[4/8] 删除旧.next目录...")
    ssh_cmd(client, f"rm -rf {DEPLOY_DIR}/.next")

    # 5. Build
    print("\n[5/8] npm run build...")
    code, out, err = ssh_cmd(client, f"cd {DEPLOY_DIR} && NODE_ENV=production npm run build", timeout=300)
    if code != 0:
        print("\n[✗] Build 失败！查看上方错误信息")
        client.close()
        sys.exit(1)
    print("[✓] Build 成功")

    # 6. 验证Build时间
    print("\n[6/8] 验证Build产物...")
    ssh_cmd(client, f"stat {DEPLOY_DIR}/.next/BUILD_ID | grep Modify")
    ssh_cmd(client, f"cat {DEPLOY_DIR}/.next/BUILD_ID")

    # 7. 静态资源生死线
    if not verify_static_js(client):
        print("\n[✗] 静态资源验证失败，部署中止！")
        client.close()
        sys.exit(1)

    # 8. PM2重启
    print("\n[7/8] PM2重启...")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 restart qunxiang-xinghuo")
    ssh_cmd(client, f"cd {DEPLOY_DIR} && pm2 save")
    time.sleep(5)

    # 9. 最终验证
    print("\n[8/8] 最终验证...")
    ssh_cmd(client, "curl -s http://localhost:3000/home | wc -c")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | wc -c")
    ssh_cmd(client, "curl -s http://localhost:3000/api/brainholes/bubble | grep -c 'list' || echo 0")
    ssh_cmd(client, "curl -s http://localhost:3000/api/sparks/public | grep -c 'list' || echo 0")
    ssh_cmd(client, "pm2 status qunxiang-xinghuo | grep -E 'name|qunxiang'")

    client.close()
    print("\n" + "=" * 60)
    print("[✓] 部署完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
