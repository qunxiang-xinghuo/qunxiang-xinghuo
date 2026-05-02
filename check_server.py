import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=20)

stdin, stdout, stderr = client.exec_command("ps aux | grep -E 'npm|node' | grep -v grep")
out = stdout.read().decode().strip()
print('当前进程:')
print(out if out else '(无npm/node进程)')

stdin, stdout, stderr = client.exec_command('ls -la /www/wwwroot/qunxiang-xinghuo/.next 2>/dev/null | head -5')
out2 = stdout.read().decode().strip()
print('\n.next目录:')
print(out2 if out2 else '(不存在)')

client.close()
