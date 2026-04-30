import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)
stdin, stdout, stderr = client.exec_command('cd /www/wwwroot/qunxiang-xinghuo && git pull origin dev')
print('PULL:', stdout.read().decode())
print('ERR:', stderr.read().decode())
client.close()
