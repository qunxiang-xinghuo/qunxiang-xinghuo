#!/usr/bin/env python3
"""v5.5 页面空白全面诊断"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "YOUR_SERVER_HOST"
USER = 'YOUR_SERVER_USER'
PASSWORD = "YOUR_SERVER_PASSWORD"
DEPLOY_DIR = "/path/to/remote/project"

def ssh_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    return out.strip(), err.strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

print("=" * 60)
print("v5.5 页面空白全面诊断")
print("=" * 60)

# 1. 页面HTML内容
print("\n【1】线上页面HTML内容检查")
for path in ['/home', '/story-hall', '/']:
    out, err = ssh_cmd(client, f"curl -s http://YOUR_SERVER_HOST:3000{path} | head -c 500")
    print(f"\n{path}:")
    print(out[:300])

# 2. 静态资源检查（这是生命线！）
print("\n\n【2】静态资源检查（v5.3修复的核心问题）")
# 找一个实际的chunks文件
out, err = ssh_cmd(client, f"ls {DEPLOY_DIR}/.next/static/chunks/ | head -3")
print(f"chunks文件列表:\n{out}")

# curl第一个文件
out, err = ssh_cmd(client, f"JS=$(ls {DEPLOY_DIR}/.next/static/chunks/*.js | head -1 | sed 's|{DEPLOY_DIR}/.next/static/chunks/||') && echo \"Testing: $JS\" && curl -sI http://YOUR_SERVER_HOST:3000/_next/static/chunks/$JS | head -5")
print(f"\n第一个JS文件curl结果:\n{out}")

# 测试已知文件名的CSS
out, err = ssh_cmd(client, "curl -sI http://YOUR_SERVER_HOST:3000/_next/static/css/ | head -5 || echo 'no css dir'")
print(f"CSS目录:\n{out}")

# 3. server.ts检查
print("\n\n【3】server.ts检查")
out, err = ssh_cmd(client, f"cat {DEPLOY_DIR}/server.ts | grep -A5 '_next/'")
print(f"server.ts中的_next处理:\n{out}")

# 4. PM2日志
print("\n\n【4】PM2日志（最近20行）")
out, err = ssh_cmd(client, "pm2 logs qunxiang-xinghuo --lines 20 --nostream 2>/dev/null || cat /home/YOUR_SERVER_USER/.pm2/logs/qunxiang-xinghuo-out.log | tail -20")
print(out)

print("\n\n【5】PM2错误日志（最近20行）")
out, err = ssh_cmd(client, "cat /home/YOUR_SERVER_USER/.pm2/logs/qunxiang-xinghuo-error.log | tail -20")
print(out or "(无错误日志)")

# 6. 进程详情
print("\n\n【6】PM2进程详情")
out, err = ssh_cmd(client, "pm2 describe qunxiang-xinghuo | grep -E 'script|exec cwd|status|pid'")
print(out)

# 7. 端口监听
print("\n\n【7】端口监听")
out, err = ssh_cmd(client, "ss -tlnp | grep 3000 || netstat -tlnp | grep 3000")
print(out or "(未找到3000端口)")

# 8. 直接localhost测试（绕过外部网络）
print("\n\n【8】localhost直接测试")
out, err = ssh_cmd(client, "curl -s http://localhost:3000/home | head -c 200")
print(out)

client.close()
print("\n" + "=" * 60)
print("诊断完成")
print("=" * 60)
