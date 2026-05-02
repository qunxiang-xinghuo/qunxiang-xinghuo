import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

# 检查.next结构
print("=== .next 目录结构 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next -maxdepth 3 -type d | head -30')
print(stdout.read().decode().strip())

# 检查静态文件
print("\n=== 静态文件 ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next -name "main-app.js" -o -name "main-*.js" | head -10')
print(stdout.read().decode().strip())

# 检查server.ts
print("\n=== server.ts 静态资源部分 ===")
stdin, stdout, stderr = client.exec_command("grep -A 15 '_next' /www/wwwroot/qunxiang-xinghuo/server.ts")
print(stdout.read().decode().strip())

client.close()
