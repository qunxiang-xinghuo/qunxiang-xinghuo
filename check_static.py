import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

# 检查.next结构
print("=== .next 目录结构 ===")
stdin, stdout, stderr = client.exec_command('find /path/to/remote/project/.next -maxdepth 3 -type d | head -30')
print(stdout.read().decode().strip())

# 检查静态文件
print("\n=== 静态文件 ===")
stdin, stdout, stderr = client.exec_command('find /path/to/remote/project/.next -name "main-app.js" -o -name "main-*.js" | head -10')
print(stdout.read().decode().strip())

# 检查server.ts
print("\n=== server.ts 静态资源部分 ===")
stdin, stdout, stderr = client.exec_command("grep -A 15 '_next' /path/to/remote/project/server.ts")
print(stdout.read().decode().strip())

client.close()
