#!/usr/bin/env python3
"""v5.4 部署后验证脚本"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="
DEPLOY_DIR = "/www/wwwroot/qunxiang-xinghuo"

def ssh_cmd(client, cmd, timeout=30):
    print(f">>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip(): print(f"[out]\n{out}")
    if err.strip(): print(f"[err]\n{err}")
    return stdout.channel.recv_exit_status(), out, err

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print("=== v5.4 部署验证 ===\n")

    # 1. 检查实际chunks文件
    print("[1] 检查 .next/static/chunks/ 文件列表")
    ssh_cmd(client, f"ls {DEPLOY_DIR}/.next/static/chunks/ | grep '.js$' | head -10")

    # 2. 找一个实际存在的js文件curl
    print("\n[2] curl 验证实际存在的静态文件")
    ssh_cmd(client, f"JSFILE=$(ls {DEPLOY_DIR}/.next/static/chunks/*.js | head -1 | sed 's|{DEPLOY_DIR}/.next/static/chunks/||') && curl -sI -o /dev/null -w '%{{http_code}}' http://localhost:3000/_next/static/chunks/$JSFILE && echo ' OK'")

    # 3. 检查CSS文件
    print("\n[3] curl 验证CSS静态文件")
    ssh_cmd(client, f"CSSFILE=$(ls {DEPLOY_DIR}/.next/static/css/*.css 2>/dev/null | head -1 | sed 's|{DEPLOY_DIR}/.next/static/css/||') && if [ -n \"$CSSFILE\" ]; then curl -sI -o /dev/null -w '%{{http_code}}' http://localhost:3000/_next/static/css/$CSSFILE && echo ' OK'; else echo 'no css files'; fi")

    # 4. 检查/home页面是否返回完整HTML
    print("\n[4] /home 页面内容长度")
    ssh_cmd(client, "curl -s http://localhost:3000/home | wc -c")

    # 5. 检查/story-hall页面
    print("\n[5] /story-hall 页面内容长度")
    ssh_cmd(client, "curl -s http://localhost:3000/story-hall | wc -c")

    # 6. 检查API
    print("\n[6] /api/stories API")
    ssh_cmd(client, "curl -s http://localhost:3000/api/stories | cut -c1-200")

    # 7. 检查server.ts是否正确运行（看进程命令行）
    print("\n[7] PM2 进程详情")
    ssh_cmd(client, "pm2 describe qunxiang-xinghuo | grep -E 'script|exec cwd|out log|error log'")

    # 8. 直接访问线上IP（绕过localhost）
    print("\n[8] 线上IP直接访问")
    ssh_cmd(client, "curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/home && echo ''")

    client.close()
    print("\n=== 验证完成 ===")

if __name__ == "__main__":
    main()
