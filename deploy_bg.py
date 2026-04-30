import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

# Run git pull in background
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && (git pull origin dev > /tmp/gitpull.log 2>&1; echo DONE) &')
print('GIT PULL BACKGROUND STARTED')

# Wait a bit and check
import time
time.sleep(5)

stdin, stdout, stderr = client.exec_command('cat /tmp/gitpull.log')
print('GIT LOG:', stdout.read().decode())

client.close()
