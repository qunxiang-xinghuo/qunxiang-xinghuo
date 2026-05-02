#!/usr/bin/env python3
import paramiko

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# 检查首页HTML关键内容
print("=== /home 页面关键内容 ===")
stdin, stdout, stderr = client.exec_command("curl -s http://81.70.59.228:3000/home | grep -ioE '(bubble|spark|双人|故事大厅|刘看山|liukanshan)' | sort | uniq -c | sort -rn")
print(stdout.read().decode())

# BUILD_ID精确检查
print("=== BUILD_ID ===")
stdin, stdout, stderr = client.exec_command("cat /www/wwwroot/qunxiang-xinghuo/.next/BUILD_ID")
bid = stdout.read().decode().strip()
print(f"BUILD_ID: [{bid}]")
print(f"长度: {len(bid)}")

# 检查故事大厅页面
print("=== /story-hall 页面关键内容 ===")
stdin, stdout, stderr = client.exec_command("curl -s http://81.70.59.228:3000/story-hall | grep -ioE '(群像共创|发起群像|招募中|角色)' | sort | uniq -c | sort -rn")
print(stdout.read().decode())

client.close()
print("=== 完成 ===")
