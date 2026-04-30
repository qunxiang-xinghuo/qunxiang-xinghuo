import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)

stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git pull origin dev')
print('PULL:', stdout.read().decode())
print('ERR:', stderr.read().decode())

stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && nohup /usr/bin/npm run build > /tmp/build_v4.log 2>&1 &')
print('BUILD STARTED')

client.close()
