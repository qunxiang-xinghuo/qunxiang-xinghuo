import paramiko
import time
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

for i in range(10):
    time.sleep(3)
    stdin, stdout, stderr = client.exec_command('cat /tmp/gitpull.log')
    log = stdout.read().decode()
    if log.strip():
        print(f'After {(i+1)*3}s:')
        print(log)
        break
    print(f'  waiting... {(i+1)*3}s')

# Check current git log
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git log --oneline -1')
print('CURRENT COMMIT:', stdout.read().decode())

client.close()
