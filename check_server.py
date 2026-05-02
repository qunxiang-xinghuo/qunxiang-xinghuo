#!/usr/bin/env python3
import paramiko

HOST = "81.70.59.228"
USER = "root"
PASSWORD = "F!D)7n_mc8Mq}bx="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

print("=== 服务器Git版本 ===")
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -3')
print(stdout.read().decode())

print("=== v5.4关键文件 ===")
stdin, stdout, stderr = client.exec_command('ls /www/wwwroot/qunxiang-xinghuo/src/app/api/stories/\[storyId\]/roles/\[roleId\]/review/route.ts 2>/dev/null && echo "review OK" || echo "review MISSING"')
print(stdout.read().decode())
stdin, stdout, stderr = client.exec_command('ls /www/wwwroot/qunxiang-xinghuo/src/app/api/stories/\[storyId\]/start/route.ts 2>/dev/null && echo "start OK" || echo "start MISSING"')
print(stdout.read().decode())

print("=== Build时间 ===")
stdin, stdout, stderr = client.exec_command('stat /www/wwwroot/qunxiang-xinghuo/.next/BUILD_ID 2>/dev/null | grep Modify || echo "no stat"')
print(stdout.read().decode())

print("=== 线上story-hall页面内容检查 ===")
stdin, stdout, stderr = client.exec_command('curl -s http://81.70.59.228:3000/story-hall | wc -c')
print("HTML bytes:", stdout.read().decode())

stdin, stdout, stderr = client.exec_command('curl -s http://81.70.59.228:3000/story-hall | grep -c "approved" || echo 0')
print("approved count:", stdout.read().decode())

client.close()
