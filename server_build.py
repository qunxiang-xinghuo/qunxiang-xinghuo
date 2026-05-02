import paramiko, sys, io, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

# 使用pty运行build
channel = client.get_transport().open_session()
channel.get_pty()
channel.exec_command('cd /www/wwwroot/qunxiang-xinghuo && NODE_ENV=production npm run build')

output = b''
while True:
    if channel.exit_status_ready() and not channel.recv_ready():
        break
    if channel.recv_ready():
        data = channel.recv(4096)
        if data:
            output += data
            sys.stdout.buffer.write(data)
            sys.stdout.flush()
    time.sleep(0.5)

exit_status = channel.recv_exit_status()
print(f'\n\n=== Build exit status: {exit_status} ===')

if exit_status == 0:
    print('=== 重启 PM2 ===')
    stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && pm2 restart qunxiang-xinghuo && pm2 save')
    print(stdout.read().decode().strip())
    time.sleep(2)
    print('=== 验证静态资源 ===')
    stdin, stdout, stderr = client.exec_command("curl -sI http://localhost:3000/_next/static/chunks/main-app.js | head -1")
    print(stdout.read().decode().strip())

client.close()
