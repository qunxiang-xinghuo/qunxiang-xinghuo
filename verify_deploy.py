#!/usr/bin/env python3
import paramiko

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# 1. 检查服务器Git版本
print("=== 服务器Git版本 ===")
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -3')
print(stdout.read().decode())

# 2. 检查globals.css是否包含新设计token
print("=== globals.css 新Token检查 ===")
stdin, stdout, stderr = client.exec_command("grep -c 'xh-surface' /www/wwwroot/qunxiang-xinghuo/src/app/globals.css || echo 0")
print("xh-surface:", stdout.read().decode())
stdin, stdout, stderr = client.exec_command("grep -c 'xh-text' /www/wwwroot/qunxiang-xinghuo/src/app/globals.css || echo 0")
print("xh-text:", stdout.read().decode())

# 3. 检查TopBar是否使用slate背景
print("=== TopBar颜色检查 ===")
stdin, stdout, stderr = client.exec_command("grep -c 'slate-900' /www/wwwroot/qunxiang-xinghuo/src/components/layout/TopBar.tsx || echo 0")
print("slate-900 in TopBar:", stdout.read().decode())
stdin, stdout, stderr = client.exec_command("grep -c 'bg-gray-800' /www/wwwroot/qunxiang-xinghuo/src/components/layout/TopBar.tsx || echo 0")
print("bg-gray-800 in TopBar:", stdout.read().decode())

# 4. 检查home页面
print("=== home页面检查 ===")
stdin, stdout, stderr = client.exec_command("grep -c 'text-slate-100' /www/wwwroot/qunxiang-xinghuo/src/app/home/page.tsx || echo 0")
print("text-slate-100 in home:", stdout.read().decode())

# 5. 检查BUILD中的新颜色类
print("=== BUILD JS中的颜色 ===")
stdin, stdout, stderr = client.exec_command("grep -c 'slate-800' /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 || echo 0")
print("slate-800 in JS chunks:", stdout.read().decode())

client.close()
