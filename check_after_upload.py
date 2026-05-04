#!/usr/bin/env python3
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "YOUR_SERVER_HOST"
USER = 'YOUR_SERVER_USER'
PASSWORD = "YOUR_SERVER_PASSWORD"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# 检查BUILD时间
print("=== BUILD时间 ===")
stdin, stdout, stderr = client.exec_command("stat /path/to/remote/project/.next/BUILD_ID | grep Modify")
print(stdout.read().decode())

# 检查BUILD_ID内容
stdin, stdout, stderr = client.exec_command("cat /path/to/remote/project/.next/BUILD_ID")
print("BUILD_ID:", stdout.read().decode().strip())

# 检查新代码是否在build中
print("\n=== 检查新代码 ===")
stdin, stdout, stderr = client.exec_command("grep -c 'slate-900' /path/to/remote/project/src/components/layout/TopBar.tsx || echo 0")
print("TopBar slate-900:", stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command("grep -c 'bg-gray-800' /path/to/remote/project/src/components/layout/TopBar.tsx || echo 0")
print("TopBar bg-gray-800:", stdout.read().decode().strip())

# 检查JS chunks
stdin, stdout, stderr = client.exec_command("grep -rl 'slate-800' /path/to/remote/project/.next/static/chunks/ | wc -l || echo 0")
print("JS chunks with slate-800:", stdout.read().decode().strip())

# 检查页面
stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/home | wc -c")
print("home bytes:", stdout.read().decode().strip())

stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3000/story-hall | wc -c")
print("story-hall bytes:", stdout.read().decode().strip())

# PM2状态
stdin, stdout, stderr = client.exec_command("pm2 status qunxiang-xinghuo | grep 'qunxiang'")
print("PM2:", stdout.read().decode().strip())

client.close()
