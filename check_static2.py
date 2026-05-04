import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

print("=== .next下所有文件（前50个） ===")
stdin, stdout, stderr = client.exec_command('find /path/to/remote/project/.next -type f | head -50')
print(stdout.read().decode().strip())

print("\n=== .next/static 是否存在 ===")
stdin, stdout, stderr = client.exec_command('ls -la /path/to/remote/project/.next/static 2>&1 || echo "NO_STATIC_DIR"')
print(stdout.read().decode().strip())

client.close()
