import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('81.70.59.228', username='root', password='F!D)7n_mc8Mq}bx=', timeout=30)
stdin, stdout, stderr = client.exec_command('echo PING_OK')
print(stdout.read().decode())
client.close()
