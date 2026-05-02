import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

print("=== .next下所有文件（前50个） ===")
stdin, stdout, stderr = client.exec_command('find /www/wwwroot/qunxiang-xinghuo/.next -type f | head -50')
print(stdout.read().decode().strip())

print("\n=== .next/static 是否存在 ===")
stdin, stdout, stderr = client.exec_command('ls -la /www/wwwroot/qunxiang-xinghuo/.next/static 2>&1 || echo "NO_STATIC_DIR"')
print(stdout.read().decode().strip())

client.close()
