import paramiko, sys, io, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

# 检查环境
stdin, stdout, stderr = client.exec_command('which node && node -v && which npm && npm -v')
print('环境:', stdout.read().decode().strip())
print('环境err:', stderr.read().decode().strip())

# 进入目录并build
channel = client.get_transport().open_session()
channel.get_pty()
channel.exec_command('bash -lc "cd /www/wwwroot/qunxiang-xinghuo && source ~/.nvm/nvm.sh && node -v && npm -v && NODE_ENV=production npm run build"')

# 读取输出
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

print('\n\nExit status:', channel.recv_exit_status())
client.close()
