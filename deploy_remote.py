#!/usr/bin/env python3
"""v6.0 生产环境一键部署脚本（paramiko SSH密码认证）"""
import paramiko
import sys
import io
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "YOUR_SERVER_HOST"
USER = 'YOUR_SERVER_USER'
PASSWORD = "YOUR_SERVER_PASSWORD"
DEPLOY_DIR = "/path/to/remote/project"


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

    # 连接服务器（密码认证）
    print("\n[连接] SSH连接服务器...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)
        print("[✓] SSH连接成功")
    except Exception as e:
        print(f"[✗] SSH连接失败: {e}")
        print("[提示] 服务器SSH可能间歇性无响应，请等待1-2分钟后重试，或通过宝塔面板Web终端手动部署")
        sys.exit(1)

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
