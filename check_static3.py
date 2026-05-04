import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

print("=== static/chunks 内容 ===")
stdin, stdout, stderr = client.exec_command('ls -la /path/to/remote/project/.next/static/chunks/ | head -20')
print(stdout.read().decode().strip())

print("\n=== curl 测试 ===")
stdin, stdout, stderr = client.exec_command("curl -sI http://localhost:3000/_next/static/chunks/ | head -5")
print(stdout.read().decode().strip())

print("\n=== 找一个实际存在的JS文件测试 ===")
stdin, stdout, stderr = client.exec_command('find /path/to/remote/project/.next/static -name "*.js" | head -3')
files = stdout.read().decode().strip().split('\n')
print(files)
if files and files[0]:
    js_path = files[0].replace('/path/to/remote/project/.next/static/', '/_next/static/')
    print(f"\n测试: curl -sI http://localhost:3000{js_path}")
    stdin, stdout, stderr = client.exec_command(f"curl -sI http://localhost:3000{js_path} | head -3")
    print(stdout.read().decode().strip())

client.close()
