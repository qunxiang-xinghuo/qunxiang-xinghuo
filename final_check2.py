#!/usr/bin/env python3
import paramiko

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# 检查duo-match页面内容
print("=== /duo-match 页面关键词 ===")
stdin, stdout, stderr = client.exec_command("curl -s http://81.70.59.228:3000/duo-match | grep -oE '(身份|对撞|你是谁|知乎|AI|自定义)' | sort | uniq -c | sort -rn")
print(stdout.read().decode() or "(无匹配)")

# 检查chunks JS（用实际文件名）
print("=== chunks JS验证 ===")
stdin, stdout, stderr = client.exec_command("JS=$(ls /www/wwwroot/qunxiang-xinghuo/.next/static/chunks/*.js | head -1 | sed 's|.*/chunks/||') && curl -sI -o /dev/null -w '%{http_code}' http://81.70.59.228:3000/_next/static/chunks/$JS")
print(stdout.read().decode())

# 检查所有页面是否都有内容
print("=== 各页面内容长度 ===")
for path in ['/home', '/story-hall', '/duo-match', '/profile', '/library']:
    stdin, stdout, stderr = client.exec_command(f"curl -s http://81.70.59.228:3000{path} | wc -c")
    print(f"{path}: {stdout.read().decode().strip()} bytes")

client.close()
