import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('YOUR_SERVER_HOST', username='YOUR_SERVER_USER', password='YOUR_SERVER_PASSWORD', timeout=20)

# 检查日志文件
stdin, stdout, stderr = client.exec_command('ls -la /tmp/xh_build.log 2>&1')
print('日志文件:', stdout.read().decode().strip())

# 尝试直接build一小部分看错误
stdin, stdout, stderr = client.exec_command(
    'cd /path/to/remote/project && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && NODE_ENV=production npm run build 2>&1 | tail -80',
    timeout=300
)
out = stdout.read().decode()
err = stderr.read().decode()
print('\n=== BUILD OUTPUT ===')
print(out[-3000:] if len(out) > 3000 else out)
if err:
    print('\n=== BUILD STDERR ===')
    print(err[-1000:] if len(err) > 1000 else err)

client.close()
